// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBrokerRFQ } from "./interfaces/IBrokerRFQ.sol";
import { IBrokerEscrow } from "./interfaces/IBrokerEscrow.sol";

/// @title BrokerRFQ
/// @author BROKER Protocol
/// @notice Request-for-Quote system enabling AI agents to broadcast pricing requests
///         and receive competitive quotes from market makers
/// @dev Accepted quotes are automatically routed to BrokerEscrow for settlement
contract BrokerRFQ is IBrokerRFQ, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────────────────────

    /// @notice Sentinel address representing native ETH
    address public constant ETH_SENTINEL = address(0);

    /// @notice Maximum quotes per request (prevents DoS via unbounded loops)
    uint256 public constant MAX_QUOTES_PER_REQUEST = 50;

    // ─── State ───────────────────────────────────────────────────────────────────

    /// @notice The escrow contract used for settlement
    IBrokerEscrow public escrow;

    /// @notice Total number of RFQ requests
    uint256 public requestCount;

    /// @notice Total number of quotes submitted
    uint256 public quoteCount;

    /// @notice Mapping of requestId to QuoteRequest
    mapping(uint256 => QuoteRequest) internal _requests;

    /// @notice Mapping of quoteId to Quote
    mapping(uint256 => Quote) internal _quotes;

    /// @notice Mapping of requestId to array of quoteIds
    mapping(uint256 => uint256[]) internal _requestQuotes;

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /// @notice Deploys the BrokerRFQ contract
    /// @param _escrow Address of the BrokerEscrow contract
    /// @param _owner Address of the contract owner
    constructor(address _escrow, address _owner) Ownable(_owner) {
        require(_escrow != address(0), "BrokerRFQ: zero escrow");
        escrow = IBrokerEscrow(_escrow);
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /// @inheritdoc IBrokerRFQ
    function requestQuote(address tokenA, uint256 amountA, address tokenB, uint256 expiry)
        external
        returns (uint256 requestId)
    {
        require(amountA > 0, "BrokerRFQ: zero amount");
        require(expiry > block.timestamp, "BrokerRFQ: expired");
        require(tokenA != tokenB, "BrokerRFQ: same tokens");

        requestId = ++requestCount;
        _requests[requestId] = QuoteRequest({
            requester: msg.sender,
            tokenA: tokenA,
            amountA: amountA,
            tokenB: tokenB,
            expiry: expiry,
            status: RequestStatus.Open,
            acceptedQuoteId: 0
        });

        emit QuoteRequested(requestId, msg.sender, tokenA, amountA, tokenB, expiry);
    }

    /// @inheritdoc IBrokerRFQ
    function submitQuote(uint256 requestId, uint256 amountB, uint256 quoteExpiry) external returns (uint256 quoteId) {
        require(requestId > 0 && requestId <= requestCount, "BrokerRFQ: invalid request");
        QuoteRequest storage request = _requests[requestId];
        require(request.status == RequestStatus.Open, "BrokerRFQ: not open");
        require(block.timestamp <= request.expiry, "BrokerRFQ: request expired");
        require(amountB > 0, "BrokerRFQ: zero amountB");
        require(quoteExpiry > block.timestamp, "BrokerRFQ: quote expired");
        require(msg.sender != request.requester, "BrokerRFQ: self-quote");
        require(_requestQuotes[requestId].length < MAX_QUOTES_PER_REQUEST, "BrokerRFQ: max quotes reached");

        quoteId = ++quoteCount;
        _quotes[quoteId] = Quote({
            requestId: requestId,
            quoter: msg.sender,
            amountB: amountB,
            quoteExpiry: quoteExpiry,
            status: QuoteStatus.Active
        });

        _requestQuotes[requestId].push(quoteId);

        emit QuoteSubmitted(requestId, quoteId, msg.sender, amountB);
    }

    /// @inheritdoc IBrokerRFQ
    /// @dev The requester must have approved this contract (or the escrow) to spend tokenA
    ///      before calling acceptQuote. For ETH-based offers, send the required ETH value.
    function acceptQuote(uint256 quoteId) external payable nonReentrant returns (uint256 escrowOfferId) {
        require(quoteId > 0 && quoteId <= quoteCount, "BrokerRFQ: invalid quote");
        Quote storage quote = _quotes[quoteId];
        require(quote.status == QuoteStatus.Active, "BrokerRFQ: quote not active");
        require(block.timestamp <= quote.quoteExpiry, "BrokerRFQ: quote expired");

        QuoteRequest storage request = _requests[quote.requestId];
        require(request.status == RequestStatus.Open, "BrokerRFQ: request not open");
        require(msg.sender == request.requester, "BrokerRFQ: not requester");

        // Update statuses
        quote.status = QuoteStatus.Accepted;
        request.status = RequestStatus.Filled;
        request.acceptedQuoteId = quoteId;

        // Reject all other active quotes for this request
        uint256[] storage quoteIds = _requestQuotes[quote.requestId];
        for (uint256 i = 0; i < quoteIds.length; i++) {
            if (quoteIds[i] != quoteId && _quotes[quoteIds[i]].status == QuoteStatus.Active) {
                _quotes[quoteIds[i]].status = QuoteStatus.Rejected;
            }
        }

        // Create the escrow offer on behalf of the requester via createOfferFor
        // The requester needs to have approved tokenA to this contract first
        // We transfer tokenA from requester to this contract, approve escrow, then create offer
        uint256 ethValue = 0;
        if (request.tokenA == ETH_SENTINEL) {
            require(msg.value == request.amountA, "BrokerRFQ: wrong ETH amount");
            ethValue = msg.value;
        } else {
            require(msg.value == 0, "BrokerRFQ: unexpected ETH");
            IERC20(request.tokenA).safeTransferFrom(msg.sender, address(this), request.amountA);
            IERC20(request.tokenA).forceApprove(address(escrow), request.amountA);
        }

        // Set expiry to the quote expiry (the taker, i.e., the quoter, needs time to fill)
        // createOfferFor sets the requester as the maker so they receive tokenB directly
        escrowOfferId = escrow.createOfferFor{ value: ethValue }(
            msg.sender, request.tokenA, request.amountA, request.tokenB, quote.amountB, quote.quoteExpiry
        );

        emit QuoteAccepted(quote.requestId, quoteId, escrowOfferId);
    }

    /// @inheritdoc IBrokerRFQ
    function cancelRequest(uint256 requestId) external {
        require(requestId > 0 && requestId <= requestCount, "BrokerRFQ: invalid request");
        QuoteRequest storage request = _requests[requestId];
        require(request.status == RequestStatus.Open, "BrokerRFQ: not open");
        require(msg.sender == request.requester, "BrokerRFQ: not requester");

        request.status = RequestStatus.Cancelled;

        // Reject all active quotes
        uint256[] storage quoteIds = _requestQuotes[requestId];
        for (uint256 i = 0; i < quoteIds.length; i++) {
            if (_quotes[quoteIds[i]].status == QuoteStatus.Active) {
                _quotes[quoteIds[i]].status = QuoteStatus.Rejected;
            }
        }

        emit RequestCancelled(requestId);
    }

    /// @inheritdoc IBrokerRFQ
    function getRequest(uint256 requestId) external view returns (QuoteRequest memory) {
        require(requestId > 0 && requestId <= requestCount, "BrokerRFQ: invalid request");
        return _requests[requestId];
    }

    /// @inheritdoc IBrokerRFQ
    function getQuote(uint256 quoteId) external view returns (Quote memory) {
        require(quoteId > 0 && quoteId <= quoteCount, "BrokerRFQ: invalid quote");
        return _quotes[quoteId];
    }

    /// @notice Returns all quote IDs for a given request
    /// @param requestId The request ID
    /// @return quoteIds Array of quote IDs
    function getRequestQuotes(uint256 requestId) external view returns (uint256[] memory) {
        return _requestQuotes[requestId];
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────────

    /// @notice Updates the escrow contract address
    /// @param _escrow New escrow contract address
    function setEscrow(address _escrow) external onlyOwner {
        require(_escrow != address(0), "BrokerRFQ: zero escrow");
        escrow = IBrokerEscrow(_escrow);
    }

    /// @dev Allow the contract to receive ETH
    receive() external payable { }
}
