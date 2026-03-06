// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Simple ERC-20 mock for testing
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

/// @title MockFeeToken
/// @notice ERC-20 that takes a 2% fee on every transfer (fee-on-transfer token)
contract MockFeeToken is ERC20 {
    uint8 private _decimals;
    uint256 public constant FEE_BPS = 200; // 2%

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * FEE_BPS) / 10_000;
        uint256 net = amount - fee;
        // Fee is burned (removed from supply)
        _burn(msg.sender, fee);
        return super.transfer(to, net);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * FEE_BPS) / 10_000;
        uint256 net = amount - fee;
        _spendAllowance(from, msg.sender, amount);
        _burn(from, fee);
        _transfer(from, to, net);
        return true;
    }
}

/// @title MockWETH
/// @notice Simple WETH mock for testing
contract MockWETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") { }

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool success,) = msg.sender.call{ value: amount }("");
        require(success, "WETH: ETH transfer failed");
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
