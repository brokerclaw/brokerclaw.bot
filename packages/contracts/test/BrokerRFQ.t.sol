// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test, console2 } from "forge-std/Test.sol";
import { BrokerEscrow } from "../src/BrokerEscrow.sol";
import { BrokerReputation } from "../src/BrokerReputation.sol";
import { BrokerRFQ } from "../src/BrokerRFQ.sol";
import { IBrokerEscrow } from "../src/interfaces/IBrokerEscrow.sol";
import { IBrokerRFQ } from "../src/interfaces/IBrokerRFQ.sol";
import { MockERC20, MockWETH } from "./helpers/MockERC20.sol";

contract BrokerRFQTest is Test {
    BrokerEscrow public escrow;
    BrokerReputation public reputation;
    BrokerRFQ public rfq;
    MockWETH public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public brokerToken;

    address public owner = makeAddr("owner");
    address public treasury = makeAddr("treasury");
    address public requester = makeAddr("requester");
    address public quoter = makeAddr("quoter");

    uint256 public constant AMOUNT_A = 100 ether;
    uint256 public constant AMOUNT_B = 200 ether;

    function setUp() public {
        weth = new MockWETH();
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        brokerToken = new MockERC20("BROKER", "BROKER", 18);

        reputation = new BrokerReputation(address(1), owner);
        escrow = new BrokerEscrow(
            address(weth), treasury, address(brokerToken), address(reputation), owner
        );

        vm.prank(owner);
        reputation.setEscrow(address(escrow));

        rfq = new BrokerRFQ(address(escrow), owner);

        // Authorize RFQ contract as a caller for createOfferFor
        vm.prank(owner);
        escrow.setAuthorizedCaller(address(rfq), true);

        // Fund accounts
        tokenA.mint(requester, 1_000 ether);
        tokenB.mint(quoter, 1_000 ether);
        vm.deal(requester, 100 ether);

        // Approvals — requester approves RFQ contract for tokenA
        vm.prank(requester);
        tokenA.approve(address(rfq), type(uint256).max);

        // Quoter approves escrow for tokenB (to fill the escrow offer later)
        vm.prank(quoter);
        tokenB.approve(address(escrow), type(uint256).max);
    }

    // ─── Request Quote ───────────────────────────────────────────────────────────

    function test_requestQuote() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        assertEq(requestId, 1);
        assertEq(rfq.requestCount(), 1);

        IBrokerRFQ.QuoteRequest memory request = rfq.getRequest(requestId);
        assertEq(request.requester, requester);
        assertEq(request.tokenA, address(tokenA));
        assertEq(request.amountA, AMOUNT_A);
        assertEq(request.tokenB, address(tokenB));
        assertEq(request.expiry, expiry);
        assertEq(uint8(request.status), uint8(IBrokerRFQ.RequestStatus.Open));
    }

    function test_requestQuote_revert_zeroAmount() public {
        vm.prank(requester);
        vm.expectRevert("BrokerRFQ: zero amount");
        rfq.requestQuote(address(tokenA), 0, address(tokenB), block.timestamp + 1 hours);
    }

    function test_requestQuote_revert_expired() public {
        vm.prank(requester);
        vm.expectRevert("BrokerRFQ: expired");
        rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), block.timestamp - 1);
    }

    // ─── Submit Quote ────────────────────────────────────────────────────────────

    function test_submitQuote() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        assertEq(quoteId, 1);

        IBrokerRFQ.Quote memory quote = rfq.getQuote(quoteId);
        assertEq(quote.requestId, requestId);
        assertEq(quote.quoter, quoter);
        assertEq(quote.amountB, AMOUNT_B);
        assertEq(uint8(quote.status), uint8(IBrokerRFQ.QuoteStatus.Active));
    }

    function test_submitQuote_multiple() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        address quoter2 = makeAddr("quoter2");

        vm.prank(quoter);
        rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.prank(quoter2);
        rfq.submitQuote(requestId, 180 ether, expiry);

        uint256[] memory quotes = rfq.getRequestQuotes(requestId);
        assertEq(quotes.length, 2);
    }

    function test_submitQuote_revert_selfQuote() public {
        vm.prank(requester);
        uint256 requestId =
            rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), block.timestamp + 1 hours);

        vm.prank(requester);
        vm.expectRevert("BrokerRFQ: self-quote");
        rfq.submitQuote(requestId, AMOUNT_B, block.timestamp + 1 hours);
    }

    function test_submitQuote_revert_zeroAmount() public {
        vm.prank(requester);
        uint256 requestId =
            rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), block.timestamp + 1 hours);

        vm.prank(quoter);
        vm.expectRevert("BrokerRFQ: zero amountB");
        rfq.submitQuote(requestId, 0, block.timestamp + 1 hours);
    }

    // ─── Accept Quote ────────────────────────────────────────────────────────────

    function test_acceptQuote() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.prank(requester);
        uint256 escrowOfferId = rfq.acceptQuote(quoteId);

        // Quote should be accepted
        IBrokerRFQ.Quote memory quote = rfq.getQuote(quoteId);
        assertEq(uint8(quote.status), uint8(IBrokerRFQ.QuoteStatus.Accepted));

        // Request should be filled
        IBrokerRFQ.QuoteRequest memory request = rfq.getRequest(requestId);
        assertEq(uint8(request.status), uint8(IBrokerRFQ.RequestStatus.Filled));
        assertEq(request.acceptedQuoteId, quoteId);

        // Escrow offer should exist
        assertGt(escrowOfferId, 0);
        IBrokerEscrow.Offer memory offer = escrow.getOffer(escrowOfferId);
        assertEq(offer.tokenA, address(tokenA));
        assertEq(offer.amountA, AMOUNT_A);
        assertEq(offer.amountB, AMOUNT_B);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Open));
    }

    function test_acceptQuote_rejectsOthers() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        address quoter2 = makeAddr("quoter2");

        vm.prank(quoter);
        uint256 quoteId1 = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.prank(quoter2);
        uint256 quoteId2 = rfq.submitQuote(requestId, 180 ether, expiry);

        // Accept first quote
        vm.prank(requester);
        rfq.acceptQuote(quoteId1);

        // Second quote should be rejected
        IBrokerRFQ.Quote memory quote2 = rfq.getQuote(quoteId2);
        assertEq(uint8(quote2.status), uint8(IBrokerRFQ.QuoteStatus.Rejected));
    }

    function test_acceptQuote_revert_notRequester() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.prank(quoter);
        vm.expectRevert("BrokerRFQ: not requester");
        rfq.acceptQuote(quoteId);
    }

    function test_acceptQuote_revert_expired() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.warp(block.timestamp + 2 hours);

        vm.prank(requester);
        vm.expectRevert("BrokerRFQ: quote expired");
        rfq.acceptQuote(quoteId);
    }

    // ─── Accept Quote with ETH ───────────────────────────────────────────────────

    function test_acceptQuote_withETH() public {
        uint256 expiry = block.timestamp + 1 hours;

        // Request: ETH for tokenB
        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(0), 1 ether, address(tokenB), expiry);

        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.prank(requester);
        uint256 escrowOfferId = rfq.acceptQuote{ value: 1 ether }(quoteId);

        IBrokerEscrow.Offer memory offer = escrow.getOffer(escrowOfferId);
        assertEq(offer.tokenA, address(weth));
        assertEq(offer.amountA, 1 ether);
    }

    // ─── Cancel Request ──────────────────────────────────────────────────────────

    function test_cancelRequest() public {
        vm.prank(requester);
        uint256 requestId =
            rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), block.timestamp + 1 hours);

        vm.prank(requester);
        rfq.cancelRequest(requestId);

        IBrokerRFQ.QuoteRequest memory request = rfq.getRequest(requestId);
        assertEq(uint8(request.status), uint8(IBrokerRFQ.RequestStatus.Cancelled));
    }

    function test_cancelRequest_rejectsQuotes() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        vm.prank(requester);
        rfq.cancelRequest(requestId);

        IBrokerRFQ.Quote memory quote = rfq.getQuote(quoteId);
        assertEq(uint8(quote.status), uint8(IBrokerRFQ.QuoteStatus.Rejected));
    }

    function test_cancelRequest_revert_notRequester() public {
        vm.prank(requester);
        uint256 requestId =
            rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), block.timestamp + 1 hours);

        vm.prank(quoter);
        vm.expectRevert("BrokerRFQ: not requester");
        rfq.cancelRequest(requestId);
    }

    // ─── Full Flow Integration ───────────────────────────────────────────────────

    function test_fullRFQFlow() public {
        uint256 expiry = block.timestamp + 1 hours;

        // 1. Requester broadcasts RFQ
        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        // 2. Market maker submits quote
        vm.prank(quoter);
        uint256 quoteId = rfq.submitQuote(requestId, AMOUNT_B, expiry);

        // 3. Requester accepts quote (creates escrow offer)
        vm.prank(requester);
        uint256 escrowOfferId = rfq.acceptQuote(quoteId);

        // 4. Quoter fills the escrow offer
        vm.prank(quoter);
        escrow.fillOffer(escrowOfferId);

        // Verify final state
        IBrokerEscrow.Offer memory offer = escrow.getOffer(escrowOfferId);
        assertEq(uint8(offer.status), uint8(IBrokerEscrow.OfferStatus.Filled));

        // Quoter received tokenA (minus fee)
        uint256 feeA = (AMOUNT_A * 30) / 10_000;
        uint256 feeB = (AMOUNT_B * 30) / 10_000;
        assertEq(tokenA.balanceOf(quoter), AMOUNT_A - feeA);
        // Requester is the maker (via createOfferFor), so they receive tokenB directly
        assertEq(tokenB.balanceOf(requester), AMOUNT_B - feeB);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────────

    function test_setEscrow() public {
        address newEscrow = makeAddr("newEscrow");
        vm.prank(owner);
        rfq.setEscrow(newEscrow);
        assertEq(address(rfq.escrow()), newEscrow);
    }

    function test_setEscrow_revert_zero() public {
        vm.prank(owner);
        vm.expectRevert("BrokerRFQ: zero escrow");
        rfq.setEscrow(address(0));
    }

    // ─── H-2: Quote cap prevents DoS ────────────────────────────────────────────

    function test_submitQuote_revert_maxQuotes() public {
        uint256 expiry = block.timestamp + 1 hours;

        vm.prank(requester);
        uint256 requestId = rfq.requestQuote(address(tokenA), AMOUNT_A, address(tokenB), expiry);

        // Submit MAX_QUOTES_PER_REQUEST (50) quotes
        for (uint256 i = 0; i < 50; i++) {
            address q = makeAddr(string(abi.encodePacked("quoter", i)));
            vm.prank(q);
            rfq.submitQuote(requestId, AMOUNT_B + i, expiry);
        }

        // 51st quote should revert
        address extraQuoter = makeAddr("extraQuoter");
        vm.prank(extraQuoter);
        vm.expectRevert("BrokerRFQ: max quotes reached");
        rfq.submitQuote(requestId, AMOUNT_B, expiry);
    }
}
