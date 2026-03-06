// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test, console2 } from "forge-std/Test.sol";
import { BrokerReputation } from "../src/BrokerReputation.sol";
import { IBrokerReputation } from "../src/interfaces/IBrokerReputation.sol";

contract BrokerReputationTest is Test {
    BrokerReputation public reputation;

    address public owner = makeAddr("owner");
    address public escrow = makeAddr("escrow");
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");

    function setUp() public {
        reputation = new BrokerReputation(escrow, owner);
    }

    // ─── Record Deal ─────────────────────────────────────────────────────────────

    function test_recordDeal() public {
        vm.prank(escrow);
        reputation.recordDeal(agent1, agent2, 10 ether);

        IBrokerReputation.AgentStats memory stats1 = reputation.getAgentStats(agent1);
        assertEq(stats1.completedDeals, 1);
        assertEq(stats1.completedDeals, 1);
        assertEq(stats1.totalVolume, 10 ether);
        assertEq(stats1.firstDealTimestamp, block.timestamp);
        assertEq(stats1.lastDealTimestamp, block.timestamp);
        assertEq(stats1.cancelledDeals, 0);

        IBrokerReputation.AgentStats memory stats2 = reputation.getAgentStats(agent2);
        assertEq(stats2.completedDeals, 1);
        assertEq(stats2.totalVolume, 10 ether);
    }

    function test_recordDeal_revert_notEscrow() public {
        vm.prank(agent1);
        vm.expectRevert("BrokerReputation: not escrow");
        reputation.recordDeal(agent1, agent2, 10 ether);
    }

    function test_recordMultipleDeals() public {
        vm.startPrank(escrow);
        reputation.recordDeal(agent1, agent2, 10 ether);

        vm.warp(block.timestamp + 1 days);
        reputation.recordDeal(agent1, agent2, 20 ether);
        vm.stopPrank();

        IBrokerReputation.AgentStats memory stats = reputation.getAgentStats(agent1);
        assertEq(stats.completedDeals, 2);
        assertEq(stats.completedDeals, 2);
        assertEq(stats.totalVolume, 30 ether);
    }

    // ─── Record Cancellation ─────────────────────────────────────────────────────

    function test_recordCancellation() public {
        vm.prank(escrow);
        reputation.recordCancellation(agent1);

        IBrokerReputation.AgentStats memory stats = reputation.getAgentStats(agent1);
        assertEq(stats.cancelledDeals, 1);
    }

    function test_recordCancellation_revert_notEscrow() public {
        vm.prank(agent1);
        vm.expectRevert("BrokerReputation: not escrow");
        reputation.recordCancellation(agent1);
    }

    // ─── Score Calculation ───────────────────────────────────────────────────────

    function test_getScore_noDeals() public view {
        assertEq(reputation.getScore(agent1), 0);
    }

    function test_getScore_singleDeal() public {
        vm.prank(escrow);
        reputation.recordDeal(agent1, agent2, 10 ether);

        uint256 score = reputation.getScore(agent1);
        // Should be > 0 but not max
        assertGt(score, 0);
        assertLt(score, 10_000);
    }

    function test_getScore_maxDeals() public {
        vm.startPrank(escrow);
        for (uint256 i = 0; i < 100; i++) {
            reputation.recordDeal(agent1, agent2, 10 ether);
        }
        vm.stopPrank();

        // Warp forward 1 year for max age
        vm.warp(block.timestamp + 365 days);

        uint256 score = reputation.getScore(agent1);
        // Should be at or near max score
        // Deal count: 2500 (100 deals = max)
        // Volume: 2500 (1000 ether = max)
        // Completion: 3500 (100% = max)
        // Age: 1500 (365 days = max)
        assertEq(score, 10_000);
    }

    function test_getScore_withCancellations() public {
        vm.startPrank(escrow);
        reputation.recordDeal(agent1, agent2, 10 ether);
        reputation.recordCancellation(agent1);
        vm.stopPrank();

        // Completion rate should be 50% (1 completed, 1 cancelled)
        uint256 scoreWithCancellation = reputation.getScore(agent1);

        // Compare with agent without cancellation
        vm.prank(escrow);
        reputation.recordDeal(agent2, agent1, 10 ether);

        uint256 scoreWithout = reputation.getScore(agent2);

        // Agent without cancellation should have higher score
        assertGt(scoreWithout, scoreWithCancellation);
    }

    function test_getScore_ageMatters() public {
        vm.prank(escrow);
        reputation.recordDeal(agent1, agent2, 10 ether);

        uint256 scoreDay0 = reputation.getScore(agent1);

        vm.warp(block.timestamp + 180 days);
        uint256 scoreDay180 = reputation.getScore(agent1);

        // Older account should have higher score
        assertGt(scoreDay180, scoreDay0);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────────

    function test_setEscrow() public {
        address newEscrow = makeAddr("newEscrow");
        vm.prank(owner);
        reputation.setEscrow(newEscrow);
        assertEq(reputation.escrow(), newEscrow);
    }

    function test_setEscrow_revert_notOwner() public {
        vm.prank(agent1);
        vm.expectRevert();
        reputation.setEscrow(makeAddr("newEscrow"));
    }

    function test_setEscrow_revert_zero() public {
        vm.prank(owner);
        vm.expectRevert("BrokerReputation: zero escrow");
        reputation.setEscrow(address(0));
    }

    // ─── Fuzz Tests ──────────────────────────────────────────────────────────────

    function testFuzz_scoreAlwaysBounded(uint256 numDeals, uint256 volume, uint256 numCancellations, uint256 age)
        public
    {
        numDeals = bound(numDeals, 1, 200);
        volume = bound(volume, 1 ether, 10_000 ether);
        numCancellations = bound(numCancellations, 0, 50);
        age = bound(age, 0, 730 days);

        vm.startPrank(escrow);
        for (uint256 i = 0; i < numDeals; i++) {
            reputation.recordDeal(agent1, agent2, volume / numDeals);
        }
        for (uint256 i = 0; i < numCancellations; i++) {
            reputation.recordCancellation(agent1);
        }
        vm.stopPrank();

        vm.warp(block.timestamp + age);

        uint256 score = reputation.getScore(agent1);
        assertLe(score, 10_000);
    }
}
