// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { BrokerEscrow } from "../src/BrokerEscrow.sol";
import { BrokerReputation } from "../src/BrokerReputation.sol";
import { BrokerRFQ } from "../src/BrokerRFQ.sol";

/// @title Deploy
/// @notice Deployment script for the BROKER OTC Protocol on Base
/// @dev Run with: forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
contract Deploy is Script {
    /// @notice Base mainnet WETH address
    address public constant WETH_BASE = 0x4200000000000000000000000000000000000006;

    function run() external {
        // Load configuration from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address brokerToken = vm.envOr("BROKER_TOKEN_ADDRESS", address(0));
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer:", deployer);
        console2.log("Treasury:", treasury);
        console2.log("BROKER Token:", brokerToken);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy BrokerReputation with placeholder escrow
        BrokerReputation reputation = new BrokerReputation(address(1), deployer);
        console2.log("BrokerReputation deployed at:", address(reputation));

        // 2. Deploy BrokerEscrow
        BrokerEscrow escrow = new BrokerEscrow(WETH_BASE, treasury, brokerToken, address(reputation), deployer);
        console2.log("BrokerEscrow deployed at:", address(escrow));

        // 3. Point reputation to the real escrow
        reputation.setEscrow(address(escrow));
        console2.log("BrokerReputation escrow set to:", address(escrow));

        // 4. Deploy BrokerRFQ
        BrokerRFQ rfq = new BrokerRFQ(address(escrow), deployer);
        console2.log("BrokerRFQ deployed at:", address(rfq));

        // 5. Authorize RFQ to create offers on behalf of users
        escrow.setAuthorizedCaller(address(rfq), true);
        console2.log("BrokerRFQ authorized as escrow caller");

        vm.stopBroadcast();

        // Summary
        console2.log("\n=== BROKER OTC Protocol Deployed ===");
        console2.log("Chain ID: 8453 (Base)");
        console2.log("BrokerReputation:", address(reputation));
        console2.log("BrokerEscrow:    ", address(escrow));
        console2.log("BrokerRFQ:       ", address(rfq));
        console2.log("====================================");
    }
}
