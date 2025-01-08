// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IPaymaster.sol";

contract SoccersmPaymaster is IPaymaster {
    function payFor(
        address _token,
        address _owner,
        uint256 _amt
    ) external override {}

    function consent(
        address _token,
        address _custodial,
        uint256 _amt
    ) external override {}

    function deposit(address _token, uint256 _amt) external override {}

    function withdraw(address _token, uint256 _amt) external override {}

    function depositFor(
        address _token,
        address _addr,
        uint256 _amt
    ) external override {}
}
