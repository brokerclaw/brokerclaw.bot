// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBrokerEscrow } from "./interfaces/IBrokerEscrow.sol";
import { IBrokerReputation } from "./interfaces/IBrokerReputation.sol";
import { IWETH } from "./interfaces/IWETH.sol";

/// @title BrokerEscrow
/// @author BROKER Protocol
/// @notice Core OTC escrow contract for trustless peer-to-peer token swaps between AI agents on Base
/// @dev Supports ETH (auto-wrapped to WETH) and any ERC-20 token. Fees are split between
///      burning $BANKERS tokens and the protocol treasury.
contract BrokerEscrow is IBrokerEscrow, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────────────────────

    /// @notice Maximum fee in basis points (5%)
    uint256 public constant MAX_FEE_BPS = 500;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Sentinel address representing native ETH
    address public constant ETH_SENTINEL = address(0);

    // ─── State ───────────────────────────────────────────────────────────────────

    /// @notice WETH contract address on Base
    IWETH public immutable weth;

    /// @notice Protocol fee in basis points (default 30 = 0.3%)
    uint256 public feeBps;

    /// @notice Treasury address receiving 50% of fees
    address public treasury;

    /// @notice $BANKERS token address (50% of fees are used to buy & burn)
    address public brokerToken;

    /// @notice Reputation contract for recording deals
    IBrokerReputation public reputation;

    /// @notice Total number of offers created
    uint256 public offerCount;

    /// @notice Mapping of offerId to Offer
    mapping(uint256 => Offer) internal _offers;

    /// @notice Mapping of authorized contracts that can create offers on behalf of others
    mapping(address => bool) public authorizedCallers;

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /// @notice Deploys the BrokerEscrow contract
    /// @param _weth Address of the WETH contract on Base
    /// @param _treasury Address of the protocol treasury
    /// @param _brokerToken Address of the $BANKERS ERC-20 token
    /// @param _reputation Address of the BrokerReputation contract
    /// @param _owner Address of the contract owner
    constructor(address _weth, address _treasury, address _brokerToken, address _reputation, address _owner)
        Ownable(_owner)
    {
        require(_weth != address(0), "BrokerEscrow: zero WETH");
        require(_treasury != address(0), "BrokerEscrow: zero treasury");

        weth = IWETH(_weth);
        treasury = _treasury;
        brokerToken = _brokerToken;
        reputation = IBrokerReputation(_reputation);
        feeBps = 30; // 0.3%
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    /// @dev Ensures the offer exists
    modifier validOffer(uint256 offerId) {
        require(offerId > 0 && offerId <= offerCount, "BrokerEscrow: invalid offer");
        _;
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /// @inheritdoc IBrokerEscrow
    function createOffer(address tokenA, uint256 amountA, address tokenB, uint256 amountB, uint256 expiry)
        external
        payable
        nonReentrant
        returns (uint256 offerId)
    {
        require(amountA > 0, "BrokerEscrow: zero amountA");
        require(amountB > 0, "BrokerEscrow: zero amountB");
        require(expiry > block.timestamp, "BrokerEscrow: expired");
        require(tokenA != tokenB || (tokenA == ETH_SENTINEL && tokenB == ETH_SENTINEL), "BrokerEscrow: same tokens");

        // Handle tokenA deposit (ETH → WETH or ERC-20 transfer)
        address actualTokenA = _depositToken(tokenA, amountA);
        address actualTokenB = tokenB == ETH_SENTINEL ? address(weth) : tokenB;

        offerId = ++offerCount;
        _offers[offerId] = Offer({
            maker: msg.sender,
            taker: address(0),
            tokenA: actualTokenA,
            tokenB: actualTokenB,
            amountA: amountA,
            amountB: amountB,
            expiry: expiry,
            status: OfferStatus.Open,
            originalOfferId: 0
        });

        emit OfferCreated(offerId, msg.sender, actualTokenA, actualTokenB, amountA, amountB, expiry);
    }

    /// @inheritdoc IBrokerEscrow
    function fillOffer(uint256 offerId) external payable nonReentrant validOffer(offerId) {
        Offer storage offer = _offers[offerId];
        require(offer.status == OfferStatus.Open, "BrokerEscrow: not open");
        require(block.timestamp <= offer.expiry, "BrokerEscrow: expired");
        require(msg.sender != offer.maker, "BrokerEscrow: self-fill");

        offer.status = OfferStatus.Filled;
        offer.taker = msg.sender;

        // Calculate fees
        uint256 feeA = (offer.amountA * feeBps) / BPS_DENOMINATOR;
        uint256 feeB = (offer.amountB * feeBps) / BPS_DENOMINATOR;
        uint256 makerReceives = offer.amountB - feeB;
        uint256 takerReceives = offer.amountA - feeA;

        // Taker deposits tokenB
        // If tokenB is WETH and ETH was sent, wrap it
        if (address(weth) == offer.tokenB && msg.value > 0) {
            require(msg.value == offer.amountB, "BrokerEscrow: wrong ETH amount");
            weth.deposit{ value: msg.value }();
        } else {
            require(msg.value == 0, "BrokerEscrow: unexpected ETH");
            IERC20(offer.tokenB).safeTransferFrom(msg.sender, address(this), offer.amountB);
        }

        // Settle: taker gets tokenA (minus fee), maker gets tokenB (minus fee)
        IERC20(offer.tokenA).safeTransfer(msg.sender, takerReceives);
        IERC20(offer.tokenB).safeTransfer(offer.maker, makerReceives);

        // Distribute fees (50% burn $BANKERS, 50% treasury)
        _distributeFee(offer.tokenA, feeA);
        _distributeFee(offer.tokenB, feeB);

        // Record deal in reputation system
        if (address(reputation) != address(0)) {
            uint256 volume = offer.amountA + offer.amountB;
            reputation.recordDeal(offer.maker, msg.sender, volume);
        }

        emit OfferFilled(offerId, msg.sender, feeA, feeB);
    }

    /// @inheritdoc IBrokerEscrow
    function cancelOffer(uint256 offerId) external nonReentrant validOffer(offerId) {
        Offer storage offer = _offers[offerId];
        require(offer.status == OfferStatus.Open, "BrokerEscrow: not open");
        require(msg.sender == offer.maker, "BrokerEscrow: not maker");

        offer.status = OfferStatus.Cancelled;

        // Return escrowed tokenA to maker
        IERC20(offer.tokenA).safeTransfer(offer.maker, offer.amountA);

        // Record cancellation in reputation system
        if (address(reputation) != address(0)) {
            reputation.recordCancellation(msg.sender);
        }

        emit OfferCancelled(offerId, msg.sender);
    }

    /// @inheritdoc IBrokerEscrow
    /// @dev The counter-party deposits tokenB into escrow. The original offer stays Open
    ///      (still fillable by others). The counter-offer is a reversed offer: counter-party
    ///      is the maker offering tokenB, wanting tokenA at the proposed price.
    ///      The original maker can fill the counter-offer to accept the new price.
    function counterOffer(uint256 offerId, uint256 newAmountB) external payable nonReentrant validOffer(offerId) {
        Offer storage offer = _offers[offerId];
        require(offer.status == OfferStatus.Open, "BrokerEscrow: not open");
        require(block.timestamp <= offer.expiry, "BrokerEscrow: expired");
        require(newAmountB > 0, "BrokerEscrow: zero amount");
        require(newAmountB != offer.amountB, "BrokerEscrow: same price");
        require(msg.sender != offer.maker, "BrokerEscrow: self-counter");

        // Original offer stays Open — still fillable by anyone at the original price.
        // Counter-party must deposit tokenB (skin in the game).
        address actualTokenB = _depositToken(offer.tokenB, newAmountB);

        // Create a reversed offer: counter-party offers tokenB, wants tokenA
        uint256 counterOfferId = ++offerCount;
        _offers[counterOfferId] = Offer({
            maker: msg.sender,
            taker: address(0),
            tokenA: actualTokenB,
            tokenB: offer.tokenA,
            amountA: newAmountB,
            amountB: offer.amountA,
            expiry: offer.expiry,
            status: OfferStatus.Open,
            originalOfferId: offerId
        });

        emit CounterOfferCreated(offerId, counterOfferId, msg.sender, newAmountB);
        emit OfferCreated(counterOfferId, msg.sender, actualTokenB, offer.tokenA, newAmountB, offer.amountA, offer.expiry);
    }

    /// @inheritdoc IBrokerEscrow
    /// @dev Only callable by authorized contracts (e.g., BrokerRFQ). The caller must have
    ///      already received the tokenA from the actual user and transferred it to this contract.
    function createOfferFor(
        address onBehalfOf,
        address tokenA,
        uint256 amountA,
        address tokenB,
        uint256 amountB,
        uint256 expiry
    ) external payable nonReentrant returns (uint256 offerId) {
        require(authorizedCallers[msg.sender], "BrokerEscrow: not authorized");
        require(onBehalfOf != address(0), "BrokerEscrow: zero maker");
        require(amountA > 0, "BrokerEscrow: zero amountA");
        require(amountB > 0, "BrokerEscrow: zero amountB");
        require(expiry > block.timestamp, "BrokerEscrow: expired");

        // Handle tokenA deposit (ETH → WETH or ERC-20 transfer from msg.sender i.e. the authorized caller)
        address actualTokenA = _depositToken(tokenA, amountA);
        address actualTokenB = tokenB == ETH_SENTINEL ? address(weth) : tokenB;

        offerId = ++offerCount;
        _offers[offerId] = Offer({
            maker: onBehalfOf,
            taker: address(0),
            tokenA: actualTokenA,
            tokenB: actualTokenB,
            amountA: amountA,
            amountB: amountB,
            expiry: expiry,
            status: OfferStatus.Open,
            originalOfferId: 0
        });

        emit OfferCreated(offerId, onBehalfOf, actualTokenA, actualTokenB, amountA, amountB, expiry);
    }

    /// @inheritdoc IBrokerEscrow
    function getOffer(uint256 offerId) external view validOffer(offerId) returns (Offer memory) {
        return _offers[offerId];
    }

    // ─── Admin Functions ─────────────────────────────────────────────────────────

    /// @notice Updates the protocol fee
    /// @param _feeBps New fee in basis points
    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "BrokerEscrow: fee too high");
        emit FeeBpsUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    /// @notice Updates the treasury address
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "BrokerEscrow: zero treasury");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    /// @notice Updates the $BANKERS token address
    /// @param _brokerToken New $BANKERS token address
    function setBrokerToken(address _brokerToken) external onlyOwner {
        emit BrokerTokenUpdated(brokerToken, _brokerToken);
        brokerToken = _brokerToken;
    }

    /// @notice Updates the reputation contract address
    /// @param _reputation New reputation contract address
    function setReputation(address _reputation) external onlyOwner {
        reputation = IBrokerReputation(_reputation);
    }

    /// @notice Sets whether an address is an authorized caller for createOfferFor
    /// @param caller The address to authorize/deauthorize
    /// @param authorized Whether the address is authorized
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
    }

    // ─── Internal Functions ──────────────────────────────────────────────────────

    /// @dev Deposits a token into escrow. Wraps ETH to WETH if ETH sentinel is used.
    /// @param token The token address (address(0) for ETH)
    /// @param amount The amount to deposit
    /// @return actualToken The actual token address held in escrow (WETH if ETH was sent)
    function _depositToken(address token, uint256 amount) internal returns (address actualToken) {
        if (token == ETH_SENTINEL) {
            require(msg.value == amount, "BrokerEscrow: wrong ETH amount");
            weth.deposit{ value: amount }();
            actualToken = address(weth);
        } else {
            require(msg.value == 0, "BrokerEscrow: unexpected ETH");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            actualToken = token;
        }
    }

    /// @dev Distributes a fee: 50% to treasury, 50% burned via $BANKERS token.
    ///      If no $BANKERS token is set, 100% goes to treasury.
    /// @param token The fee token
    /// @param feeAmount The total fee amount
    function _distributeFee(address token, uint256 feeAmount) internal {
        if (feeAmount == 0) return;

        uint256 burnShare = feeAmount / 2;
        uint256 treasuryShare = feeAmount - burnShare;

        // Treasury always gets its share
        IERC20(token).safeTransfer(treasury, treasuryShare);

        // Burn share: if BROKER token is set and the fee token IS the BROKER token, burn directly.
        // Otherwise, send burn share to treasury as well (off-chain buyback & burn).
        if (brokerToken != address(0) && token == brokerToken) {
            // Burn by sending to dead address
            IERC20(token).safeTransfer(address(0xdead), burnShare);
        } else {
            // Send to treasury for off-chain buyback & burn
            IERC20(token).safeTransfer(treasury, burnShare);
        }
    }

    /// @dev Allow the contract to receive ETH (for WETH unwrapping if needed)
    receive() external payable { }
}
