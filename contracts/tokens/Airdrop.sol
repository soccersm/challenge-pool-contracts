// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AirDroper {
    address public token;
    constructor(address _token) {
        token = _token;
    }

    event AirDrop(address _cliamer, uint256 _amount);

    function airDrop(address[] calldata _addresses, uint256 _val) external {
        for (uint i = 0; i < _addresses.length; i++) {
            SafeERC20.safeTransferFrom(IERC20(token), msg.sender, _addresses[i], _val);
            emit AirDrop(_addresses[i], _val);
        }
    }
}
