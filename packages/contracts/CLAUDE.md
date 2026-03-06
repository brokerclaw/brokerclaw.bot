# CLAUDE.md — BrokerClaw Contracts

## Overview
Solidity smart contracts for the BrokerClaw OTC protocol on Base L2.

## Stack
- Solidity 0.8.28, Foundry, optimizer enabled (200 runs)
- EVM target: Cancun
- OpenZeppelin contracts via Foundry remapping

## Contracts
- **BrokerEscrow.sol** — Core escrow: create deals, deposit (ERC20/ETH), atomic settle, cancel with timelock, fee collection
- **BrokerRFQ.sol** — Request For Quote: post intents, submit quotes, accept best quote, integrates with escrow
- **BrokerReputation.sol** — On-chain reputation tracking: deal count, success rate, badges (ERC-8004 inspired)

## Interfaces
All contracts have matching interfaces in `src/interfaces/`:
- `IBrokerEscrow.sol`, `IBrokerRFQ.sol`, `IBrokerReputation.sol`, `IWETH.sol`

## Commands
```bash
forge build              # Compile
forge test               # Run tests (fuzz: 256 runs)
forge test -vvv          # Verbose test output
forge fmt                # Format (120 char lines, 4-space tabs)
forge script script/Deploy.s.sol  # Deploy script
```

## Testing
Tests in `test/` with `MockERC20` helper. Each contract has its own test file:
- `BrokerEscrow.t.sol`
- `BrokerRFQ.t.sol`
- `BrokerReputation.t.sol`

## Style
- 120 char line length, 4-space tabs
- `int_types = "long"` (use `uint256` not `uint`)
- Bracket spacing enabled
- Wrap comments at line length
- Number underscores for thousands (`1_000_000`)

## Deploy
- Chain: Base (8453)
- Explorer: BaseScan (needs `BASESCAN_API_KEY`)
- RPC: `BASE_RPC_URL` env var
