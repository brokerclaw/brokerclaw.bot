// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBrokerReputation } from "./interfaces/IBrokerReputation.sol";

/// @title BrokerReputation
/// @author BROKER Protocol
/// @notice On-chain reputation system for AI agents participating in OTC deals
/// @dev Reputation scores are calculated based on deal count, volume, completion rate, and account age.
///      Only the designated escrow contract can record deals and cancellations.
contract BrokerReputation is IBrokerReputation, Ownable {
    // ─── Constants ───────────────────────────────────────────────────────────────

    /// @notice Maximum reputation score (100% in basis points)
    uint256 public constant MAX_SCORE = 10_000;

    /// @notice Weight for deal count component (25%)
    uint256 public constant DEAL_COUNT_WEIGHT = 2_500;

    /// @notice Weight for volume component (25%)
    uint256 public constant VOLUME_WEIGHT = 2_500;

    /// @notice Weight for completion rate component (35%)
    uint256 public constant COMPLETION_WEIGHT = 3_500;

    /// @notice Weight for account age component (15%)
    uint256 public constant AGE_WEIGHT = 1_500;

    /// @notice Deal count threshold for maximum score (100 deals = max)
    uint256 public constant DEAL_COUNT_MAX = 100;

    /// @notice Volume threshold for maximum score (1000 ETH equivalent)
    uint256 public constant VOLUME_MAX = 1_000 ether;

    /// @notice Age threshold for maximum score (365 days)
    uint256 public constant AGE_MAX = 365 days;

    // ─── State ───────────────────────────────────────────────────────────────────

    /// @notice The escrow contract authorized to record deals
    address public escrow;

    /// @notice Mapping of agent address to their statistics
    mapping(address => AgentStats) internal _stats;

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /// @notice Deploys the BrokerReputation contract
    /// @param _escrow Address of the BrokerEscrow contract
    /// @param _owner Address of the contract owner
    constructor(address _escrow, address _owner) Ownable(_owner) {
        escrow = _escrow;
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    /// @dev Restricts access to the escrow contract only
    modifier onlyEscrow() {
        require(msg.sender == escrow, "BrokerReputation: not escrow");
        _;
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /// @inheritdoc IBrokerReputation
    function recordDeal(address maker, address taker, uint256 volume) external onlyEscrow {
        _recordCompletedDeal(maker, volume);
        _recordCompletedDeal(taker, volume);

        emit DealRecorded(maker, taker, volume);
    }

    /// @inheritdoc IBrokerReputation
    function recordCancellation(address agent) external onlyEscrow {
        _stats[agent].cancelledDeals++;

        emit CancellationRecorded(agent);
    }

    /// @inheritdoc IBrokerReputation
    /// @dev Score is calculated as a weighted sum of four components:
    ///      - Deal count: min(deals / DEAL_COUNT_MAX, 1) * DEAL_COUNT_WEIGHT
    ///      - Volume: min(volume / VOLUME_MAX, 1) * VOLUME_WEIGHT
    ///      - Completion rate: (completed / (completed + cancelled)) * COMPLETION_WEIGHT
    ///      - Age: min(age / AGE_MAX, 1) * AGE_WEIGHT
    function getScore(address agent) external view returns (uint256 score) {
        AgentStats storage stats = _stats[agent];

        // No deals = no score
        if (stats.completedDeals == 0) return 0;

        // Deal count component (capped at DEAL_COUNT_MAX)
        uint256 dealCountScore = stats.completedDeals >= DEAL_COUNT_MAX
            ? DEAL_COUNT_WEIGHT
            : (stats.completedDeals * DEAL_COUNT_WEIGHT) / DEAL_COUNT_MAX;

        // Volume component (capped at VOLUME_MAX)
        uint256 volumeScore =
            stats.totalVolume >= VOLUME_MAX ? VOLUME_WEIGHT : (stats.totalVolume * VOLUME_WEIGHT) / VOLUME_MAX;

        // Completion rate component
        uint256 totalAttempts = stats.completedDeals + stats.cancelledDeals;
        uint256 completionScore = totalAttempts > 0
            ? (stats.completedDeals * COMPLETION_WEIGHT) / totalAttempts
            : 0;

        // Age component (capped at AGE_MAX)
        uint256 age = block.timestamp - stats.firstDealTimestamp;
        uint256 ageScore = age >= AGE_MAX ? AGE_WEIGHT : (age * AGE_WEIGHT) / AGE_MAX;

        score = dealCountScore + volumeScore + completionScore + ageScore;
    }

    /// @inheritdoc IBrokerReputation
    function getAgentStats(address agent) external view returns (AgentStats memory) {
        return _stats[agent];
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────────

    /// @notice Updates the escrow contract address
    /// @param _escrow New escrow contract address
    function setEscrow(address _escrow) external onlyOwner {
        require(_escrow != address(0), "BrokerReputation: zero escrow");
        emit EscrowUpdated(escrow, _escrow);
        escrow = _escrow;
    }

    // ─── Internal Functions ──────────────────────────────────────────────────────

    /// @dev Records a completed deal for a single agent
    /// @param agent The agent's address
    /// @param volume The deal volume
    function _recordCompletedDeal(address agent, uint256 volume) internal {
        AgentStats storage stats = _stats[agent];

        if (stats.firstDealTimestamp == 0) {
            stats.firstDealTimestamp = block.timestamp;
        }

        stats.completedDeals++;
        stats.totalVolume += volume;
        stats.lastDealTimestamp = block.timestamp;
    }
}
