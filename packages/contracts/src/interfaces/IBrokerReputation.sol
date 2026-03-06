// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IBrokerReputation
/// @notice Interface for the BROKER on-chain reputation system
interface IBrokerReputation {
    /// @notice Agent statistics
    /// @dev L-5: Removed redundant dealCount (was always == completedDeals)
    struct AgentStats {
        uint256 completedDeals;
        uint256 cancelledDeals;
        uint256 totalVolume;
        uint256 firstDealTimestamp;
        uint256 lastDealTimestamp;
    }

    /// @notice Emitted when a deal is recorded
    event DealRecorded(address indexed maker, address indexed taker, uint256 volume);

    /// @notice Emitted when a cancellation is recorded
    event CancellationRecorded(address indexed agent);

    /// @notice Emitted when the escrow contract address is updated
    event EscrowUpdated(address oldEscrow, address newEscrow);

    /// @notice Records a successful deal (callable only by escrow)
    function recordDeal(address maker, address taker, uint256 volume) external;

    /// @notice Records a cancellation for reputation tracking
    function recordCancellation(address agent) external;

    /// @notice Returns the reputation score of an agent (0-10000 basis points)
    function getScore(address agent) external view returns (uint256 score);

    /// @notice Returns full stats for an agent
    function getAgentStats(address agent) external view returns (AgentStats memory);
}
