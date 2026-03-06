// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IBrokerEscrow
/// @notice Interface for the BROKER OTC Escrow contract
interface IBrokerEscrow {
    /// @notice Status of an OTC offer
    enum OfferStatus {
        Open,
        Filled,
        Cancelled,
        Countered
    }

    /// @notice Represents an OTC offer
    struct Offer {
        address maker;
        address taker;
        address tokenA;
        address tokenB;
        uint256 amountA;
        uint256 amountB;
        uint256 expiry;
        OfferStatus status;
        uint256 originalOfferId; // non-zero if this is a counter-offer
    }

    /// @notice Emitted when a new offer is created
    event OfferCreated(
        uint256 indexed offerId,
        address indexed maker,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 expiry
    );

    /// @notice Emitted when an offer is filled
    event OfferFilled(uint256 indexed offerId, address indexed taker, uint256 feeA, uint256 feeB);

    /// @notice Emitted when an offer is cancelled
    event OfferCancelled(uint256 indexed offerId, address indexed maker);

    /// @notice Emitted when a counter-offer is created
    event CounterOfferCreated(
        uint256 indexed originalOfferId, uint256 indexed counterOfferId, address indexed counterParty, uint256 newAmountB
    );

    /// @notice Emitted when the fee basis points are updated
    event FeeBpsUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    /// @notice Emitted when the treasury address is updated
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    /// @notice Emitted when the BROKER token address is updated
    event BrokerTokenUpdated(address oldToken, address newToken);

    /// @notice Creates an OTC offer, locking tokenA in escrow
    function createOffer(address tokenA, uint256 amountA, address tokenB, uint256 amountB, uint256 expiry)
        external
        payable
        returns (uint256 offerId);

    /// @notice Fills an open offer by depositing tokenB
    function fillOffer(uint256 offerId) external payable;

    /// @notice Cancels an open offer and returns tokens to maker
    function cancelOffer(uint256 offerId) external;

    /// @notice Creates a counter-offer with a different amountB. Counter-party must deposit tokenB.
    /// @dev The original offer stays Open. The counter-offer is a reversed offer where the
    ///      counter-party is the maker depositing tokenB. The original maker can fill it to accept.
    function counterOffer(uint256 offerId, uint256 newAmountB) external payable;

    /// @notice Returns the details of an offer
    function getOffer(uint256 offerId) external view returns (Offer memory);

    /// @notice Creates an OTC offer on behalf of another address (authorized callers only)
    function createOfferFor(
        address onBehalfOf,
        address tokenA,
        uint256 amountA,
        address tokenB,
        uint256 amountB,
        uint256 expiry
    ) external payable returns (uint256 offerId);

    /// @notice Returns the current number of offers
    function offerCount() external view returns (uint256);

    /// @notice Returns the fee in basis points
    function feeBps() external view returns (uint256);
}
