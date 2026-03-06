// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IBrokerRFQ
/// @notice Interface for the BROKER Request-for-Quote system
interface IBrokerRFQ {
    /// @notice Status of an RFQ request
    enum RequestStatus {
        Open,
        Filled,
        Expired,
        Cancelled
    }

    /// @notice Status of a quote
    enum QuoteStatus {
        Active,
        Accepted,
        Expired,
        Rejected
    }

    /// @notice Represents an RFQ request
    struct QuoteRequest {
        address requester;
        address tokenA;
        uint256 amountA;
        address tokenB;
        uint256 expiry;
        RequestStatus status;
        uint256 acceptedQuoteId;
    }

    /// @notice Represents a quote submitted by a market maker
    struct Quote {
        uint256 requestId;
        address quoter;
        uint256 amountB;
        uint256 quoteExpiry;
        QuoteStatus status;
    }

    /// @notice Emitted when a new RFQ request is created
    event QuoteRequested(
        uint256 indexed requestId,
        address indexed requester,
        address tokenA,
        uint256 amountA,
        address tokenB,
        uint256 expiry
    );

    /// @notice Emitted when a quote is submitted
    event QuoteSubmitted(uint256 indexed requestId, uint256 indexed quoteId, address indexed quoter, uint256 amountB);

    /// @notice Emitted when a quote is accepted
    event QuoteAccepted(uint256 indexed requestId, uint256 indexed quoteId, uint256 escrowOfferId);

    /// @notice Emitted when a request is cancelled
    event RequestCancelled(uint256 indexed requestId);

    /// @notice Creates a new RFQ request
    function requestQuote(address tokenA, uint256 amountA, address tokenB, uint256 expiry)
        external
        returns (uint256 requestId);

    /// @notice Submits a quote for an open RFQ request
    function submitQuote(uint256 requestId, uint256 amountB, uint256 quoteExpiry) external returns (uint256 quoteId);

    /// @notice Accepts a quote and creates an escrow offer
    function acceptQuote(uint256 quoteId) external payable returns (uint256 escrowOfferId);

    /// @notice Cancels an open RFQ request
    function cancelRequest(uint256 requestId) external;

    /// @notice Returns the details of an RFQ request
    function getRequest(uint256 requestId) external view returns (QuoteRequest memory);

    /// @notice Returns the details of a quote
    function getQuote(uint256 quoteId) external view returns (Quote memory);
}
