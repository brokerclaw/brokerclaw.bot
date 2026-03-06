// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test, console2 } from "forge-std/Test.sol";
import { BrokerEscrow } from "../src/BrokerEscrow.sol";
import { BrokerReputation } from "../src/BrokerReputation.sol";
import { IBrokerEscrow } from "../src/interfaces/IBrokerEscrow.sol";
import { MockERC20, MockFeeToken, MockWETH } from "./helpers/MockERC20.sol";

contract BrokerEscrowTest is Test {
    BrokerEscrow public escrow;
    BrokerReputation public reputation;
    MockWETH public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public brokerToken;

    address public owner = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public maker = makeAddr("maker");
    address public taker = makeAddr("taker");

    uint256 public constant AMOUNT_A = 100 ether;
    uint256 public constant AMOUNT_B = 200 ether;

    function setUp() public {
        weth = new MockWETH();
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        brokerToken = new MockERC20("BROKER", "BROKER", 18);

        // Deploy reputation first with a placeholder escrow
        reputation = new BrokerReputation(address(1), owner);

        // Deploy escrow
        escrow = new BrokerEscrow(
            address(weth), treasury, address(brokerToken), address(reputation), owner
        );

        // Point reputation to the real escrow
        vm.prank(owner);
        reputation.setEscrow(address(escrow));

        // Fund accounts
        tokenA.mint(maker, 1_000 ether);
        tokenB.mint(taker, 1_000 ether);
        vm.deal(maker, 100 ether);
        vm.deal(taker, 100 ether);

        // Approvals
        vm.prank(maker);
        tokenA.approve(address(escrow), type(uint256).max);
        vm.prank(taker);
        tokenB.approve(address(escrow), type(uint256).max);
    }

    // ─── Create Offer ────────────────────────────────────────────────────────────

    function test_createOffer() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(maker);
        uint256 offerId = escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, expiry);

        assertEq(offerId, 1);
        assertEq(escrow.offerCount(), 1);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(offer.maker, maker);
        assertEq(offer.taker, address(0));
        assertEq(offer.tokenA, address(tokenA));
        assertEq(offer.tokenB, address(tokenB));
        assertEq(offer.amountA, AMOUNT_A);
        assertEq(offer.amountB, AMOUNT_B);
        assertEq(offer.expiry, expiry);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Open));

        // Token A should be in escrow
        assertEq(tokenA.balanceOf(address(escrow)), AMOUNT_A);
    }

    function test_createOffer_withETH() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer{ value: 1 ether }(address(0), 1 ether, address(tokenB), AMOUNT_B, expiry);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(offer.tokenA, address(weth));
        assertEq(weth.balanceOf(address(escrow)), 1 ether);
    }

    function test_createOffer_revert_zeroAmountA() public {
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: zero amountA");
        escrow.createOffer(address(tokenA), 0, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);
    }

    function test_createOffer_revert_zeroAmountB() public {
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: zero amountB");
        escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), 0, block.timestamp + 1 hours);
    }

    function test_createOffer_revert_expired() public {
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: expired");
        escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp - 1);
    }

    function test_createOffer_revert_wrongETH() public {
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: wrong ETH amount");
        escrow.createOffer{ value: 0.5 ether }(address(0), 1 ether, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);
    }

    // ─── Fill Offer ──────────────────────────────────────────────────────────────

    function test_fillOffer() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(maker);
        uint256 offerId = escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, expiry);

        uint256 feeA = (AMOUNT_A * 30) / 10_000; // 0.3%
        uint256 feeB = (AMOUNT_B * 30) / 10_000;

        vm.prank(taker);
        escrow.fillOffer(offerId);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Filled));
        assertEq(offer.taker, taker);

        // Taker receives tokenA minus fee
        assertEq(tokenA.balanceOf(taker), AMOUNT_A - feeA);
        // Maker receives tokenB minus fee
        assertEq(tokenB.balanceOf(maker), AMOUNT_B - feeB);

        // Treasury receives fees (all goes to treasury since tokenA/B != brokerToken)
        assertEq(tokenA.balanceOf(treasury), feeA);
        assertEq(tokenB.balanceOf(treasury), feeB);
    }

    function test_fillOffer_withETH() public {
        uint256 expiry = block.timestamp + 1 hours;
        uint256 amountA = 1 ether;

        // Maker creates offer: tokenA for ETH(WETH)
        vm.prank(maker);
        uint256 offerId = escrow.createOffer(address(tokenA), AMOUNT_A, address(0), amountA, expiry);

        // Taker fills with ETH
        vm.prank(taker);
        escrow.fillOffer{ value: amountA }(offerId);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Filled));
    }

    function test_fillOffer_revert_notOpen() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.prank(maker);
        escrow.cancelOffer(offerId);

        vm.prank(taker);
        vm.expectRevert("BrokerEscrow: not open");
        escrow.fillOffer(offerId);
    }

    function test_fillOffer_revert_expired() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.warp(block.timestamp + 2 hours);

        vm.prank(taker);
        vm.expectRevert("BrokerEscrow: expired");
        escrow.fillOffer(offerId);
    }

    function test_fillOffer_revert_selfFill() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        tokenB.mint(maker, AMOUNT_B);
        vm.prank(maker);
        tokenB.approve(address(escrow), type(uint256).max);

        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: self-fill");
        escrow.fillOffer(offerId);
    }

    // ─── Cancel Offer ────────────────────────────────────────────────────────────

    function test_cancelOffer() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        uint256 balanceBefore = tokenA.balanceOf(maker);

        vm.prank(maker);
        escrow.cancelOffer(offerId);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Cancelled));

        // Maker gets tokenA back
        assertEq(tokenA.balanceOf(maker), balanceBefore + AMOUNT_A);
    }

    function test_cancelOffer_revert_notMaker() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.prank(taker);
        vm.expectRevert("BrokerEscrow: not maker");
        escrow.cancelOffer(offerId);
    }

    // ─── Counter Offer ───────────────────────────────────────────────────────────

    function test_counterOffer() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        uint256 newAmountB = 150 ether;

        // Taker deposits tokenB as counter-offer (skin in the game)
        vm.prank(taker);
        escrow.counterOffer(offerId, newAmountB);

        // Original offer stays Open (still fillable by anyone)
        IBrokerEscrow.Offer memory original = escrow.getOffer(offerId);
        assertEq(uint8(original.status), uint8(IBrokerEscrow.OfferStatus.Open));

        // Counter-offer: taker is maker, offering tokenB for tokenA (reversed)
        IBrokerEscrow.Offer memory counter = escrow.getOffer(2);
        assertEq(counter.maker, taker);
        assertEq(counter.tokenA, address(tokenB));
        assertEq(counter.tokenB, address(tokenA));
        assertEq(counter.amountA, newAmountB);
        assertEq(counter.amountB, AMOUNT_A);
        assertEq(uint8(counter.status), uint8(IBrokerEscrow.OfferStatus.Open));
        assertEq(counter.originalOfferId, offerId);

        // tokenB should be in escrow (deposited by taker)
        assertEq(tokenB.balanceOf(address(escrow)), newAmountB);
    }

    function test_counterOffer_originalStillFillable() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        // Taker counters
        vm.prank(taker);
        escrow.counterOffer(offerId, 150 ether);

        // Another taker can still fill the original offer
        address taker2 = makeAddr("taker2");
        tokenB.mint(taker2, AMOUNT_B);
        vm.prank(taker2);
        tokenB.approve(address(escrow), type(uint256).max);
        vm.prank(taker2);
        escrow.fillOffer(offerId);

        IBrokerEscrow.Offer memory original = escrow.getOffer(offerId);
        assertEq(uint8(original.status), uint8(IBrokerEscrow.OfferStatus.Filled));
    }

    function test_counterOffer_makerCanFillCounter() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        uint256 newAmountB = 150 ether;

        vm.prank(taker);
        escrow.counterOffer(offerId, newAmountB);

        // Maker accepts the counter by filling it (deposits tokenA for counter's tokenB)
        tokenA.mint(maker, AMOUNT_A);
        vm.prank(maker);
        escrow.fillOffer(2);

        IBrokerEscrow.Offer memory counter = escrow.getOffer(2);
        assertEq(uint8(counter.status), uint8(IBrokerEscrow.OfferStatus.Filled));
        assertEq(counter.taker, maker);
    }

    function test_counterOffer_takerCanCancel() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        uint256 newAmountB = 150 ether;
        uint256 takerBalBefore = tokenB.balanceOf(taker);

        vm.prank(taker);
        escrow.counterOffer(offerId, newAmountB);

        // Taker can cancel their counter-offer and get tokenB back
        vm.prank(taker);
        escrow.cancelOffer(2);

        assertEq(tokenB.balanceOf(taker), takerBalBefore);
    }

    function test_counterOffer_noDoubleSpend_chainedCounters() public {
        // C-2: Verify chained counters can't double-spend
        // Each counter is independently funded, so no shared escrow risk
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        // Taker1 counters (deposits 150 tokenB)
        uint256 counter1Amount = 150 ether;
        vm.prank(taker);
        escrow.counterOffer(offerId, counter1Amount); // creates offer 2

        // Taker2 also counters the original (deposits 180 tokenB)
        address taker2 = makeAddr("taker2");
        tokenB.mint(taker2, 200 ether);
        vm.prank(taker2);
        tokenB.approve(address(escrow), type(uint256).max);
        uint256 counter2Amount = 180 ether;
        vm.prank(taker2);
        escrow.counterOffer(offerId, counter2Amount); // creates offer 3

        // Escrow holds: AMOUNT_A (original) + 150 tokenB (counter1) + 180 tokenB (counter2)
        assertEq(tokenA.balanceOf(address(escrow)), AMOUNT_A);
        assertEq(tokenB.balanceOf(address(escrow)), counter1Amount + counter2Amount);

        // Taker1 cancels their counter — gets only their 150 back
        vm.prank(taker);
        escrow.cancelOffer(2);
        assertEq(tokenB.balanceOf(address(escrow)), counter2Amount);

        // Original is still open, maker cancels — gets their tokenA back
        vm.prank(maker);
        escrow.cancelOffer(offerId);
        assertEq(tokenA.balanceOf(address(escrow)), 0);

        // Taker2 cancels their counter — gets their 180 back
        vm.prank(taker2);
        escrow.cancelOffer(3);
        assertEq(tokenB.balanceOf(address(escrow)), 0);

        // No funds stuck in escrow
    }

    function test_counterOffer_revert_samePrice() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.prank(taker);
        vm.expectRevert("BrokerEscrow: same price");
        escrow.counterOffer(offerId, AMOUNT_B);
    }

    function test_counterOffer_revert_selfCounter() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: self-counter");
        escrow.counterOffer(offerId, 150 ether);
    }

    // ─── Fee Management ──────────────────────────────────────────────────────────

    function test_setFeeBps() public {
        vm.prank(owner);
        escrow.setFeeBps(50); // 0.5%

        assertEq(escrow.feeBps(), 50);
    }

    function test_setFeeBps_revert_tooHigh() public {
        vm.prank(owner);
        vm.expectRevert("BrokerEscrow: fee too high");
        escrow.setFeeBps(501);
    }

    function test_setFeeBps_revert_notOwner() public {
        vm.prank(maker);
        vm.expectRevert();
        escrow.setFeeBps(50);
    }

    function test_setTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        escrow.setTreasury(newTreasury);
        assertEq(escrow.treasury(), newTreasury);
    }

    function test_setTreasury_revert_zero() public {
        vm.prank(owner);
        vm.expectRevert("BrokerEscrow: zero treasury");
        escrow.setTreasury(address(0));
    }

    // ─── Fee Distribution with BROKER Token ──────────────────────────────────────

    function test_fillOffer_brokerTokenFee_burn() public {
        // Create an offer where tokenA IS the BROKER token
        brokerToken.mint(maker, 1_000 ether);
        vm.prank(maker);
        brokerToken.approve(address(escrow), type(uint256).max);

        vm.prank(maker);
        uint256 offerId = escrow.createOffer(
            address(brokerToken), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours
        );

        vm.prank(taker);
        escrow.fillOffer(offerId);

        uint256 feeA = (AMOUNT_A * 30) / 10_000;
        uint256 burnShare = feeA / 2;
        uint256 treasuryShare = feeA - burnShare;

        // Burn address (0xdead) gets 50% of BROKER fee
        assertEq(brokerToken.balanceOf(address(0xdead)), burnShare);
        // Treasury gets 50% of BROKER fee + 100% of tokenB fee
        assertEq(brokerToken.balanceOf(treasury), treasuryShare);
    }

    // ─── Reputation Integration ──────────────────────────────────────────────────

    function test_fillOffer_recordsReputation() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.prank(taker);
        escrow.fillOffer(offerId);

        // Both maker and taker should have reputation recorded
        assertEq(reputation.getAgentStats(maker).completedDeals, 1);
        assertEq(reputation.getAgentStats(taker).completedDeals, 1);
        assertEq(reputation.getAgentStats(maker).totalVolume, AMOUNT_A + AMOUNT_B);
    }

    function test_cancelOffer_recordsCancellation() public {
        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        vm.prank(maker);
        escrow.cancelOffer(offerId);

        assertEq(reputation.getAgentStats(maker).cancelledDeals, 1);
    }

    // ─── H-1: Fee-on-transfer token accounting ────────────────────────────────────

    function test_feeOnTransfer_correctAccounting() public {
        MockFeeToken fot = new MockFeeToken("FOT", "FOT", 18);
        fot.mint(maker, 1_000 ether);
        vm.prank(maker);
        fot.approve(address(escrow), type(uint256).max);

        vm.prank(maker);
        uint256 offerId = escrow.createOffer(address(fot), 100 ether, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        // Stored amountA should be 98 ether (100 - 2% fee)
        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(offer.amountA, 98 ether);
        assertEq(fot.balanceOf(address(escrow)), 98 ether);
    }

    function test_feeOnTransfer_cancelReturnsCorrectAmount() public {
        MockFeeToken fot = new MockFeeToken("FOT", "FOT", 18);
        fot.mint(maker, 1_000 ether);
        vm.prank(maker);
        fot.approve(address(escrow), type(uint256).max);

        vm.prank(maker);
        uint256 offerId = escrow.createOffer(address(fot), 100 ether, address(tokenB), AMOUNT_B, block.timestamp + 1 hours);

        // Cancel should work — only transfers stored 98, not original 100
        vm.prank(maker);
        escrow.cancelOffer(offerId);
        assertEq(fot.balanceOf(address(escrow)), 0);
    }

    // ─── H-3: Same-token rejection ──────────────────────────────────────────────

    function test_createOffer_revert_sameTokens() public {
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: same tokens");
        escrow.createOffer(address(tokenA), AMOUNT_A, address(tokenA), AMOUNT_B, block.timestamp + 1 hours);
    }

    function test_createOffer_revert_ethForEth() public {
        // Both ETH sentinels resolve to WETH — should be blocked
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: same tokens");
        escrow.createOffer{ value: 1 ether }(address(0), 1 ether, address(0), 1 ether, block.timestamp + 1 hours);
    }

    function test_createOffer_revert_ethForWeth() public {
        // ETH sentinel for tokenA (resolves to WETH) + WETH for tokenB — same tokens
        vm.prank(maker);
        vm.expectRevert("BrokerEscrow: same tokens");
        escrow.createOffer{ value: 1 ether }(address(0), 1 ether, address(weth), 1 ether, block.timestamp + 1 hours);
    }

    // ─── Fuzz Tests ──────────────────────────────────────────────────────────────

    function testFuzz_createAndFillOffer(uint256 amountA, uint256 amountB) public {
        // Bound to reasonable amounts to avoid overflow
        amountA = bound(amountA, 1_000, 1_000_000 ether);
        amountB = bound(amountB, 1_000, 1_000_000 ether);

        tokenA.mint(maker, amountA);
        tokenB.mint(taker, amountB);

        vm.prank(maker);
        tokenA.approve(address(escrow), amountA);
        vm.prank(taker);
        tokenB.approve(address(escrow), amountB);

        vm.prank(maker);
        uint256 offerId =
            escrow.createOffer(address(tokenA), amountA, address(tokenB), amountB, block.timestamp + 1 hours);

        vm.prank(taker);
        escrow.fillOffer(offerId);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(offerId);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Filled));

        // Verify no tokens stuck in escrow (accounting for rounding)
        assertLe(tokenA.balanceOf(address(escrow)), 1);
        assertLe(tokenB.balanceOf(address(escrow)), 1);
    }

    function testFuzz_feeCalculation(uint256 amount, uint256 fee) public view {
        amount = bound(amount, 1, type(uint128).max);
        fee = bound(fee, 0, 500);

        uint256 feeAmount = (amount * fee) / 10_000;
        uint256 remaining = amount - feeAmount;

        // Fee + remaining should equal original amount
        assertEq(feeAmount + remaining, amount);
    }
}
