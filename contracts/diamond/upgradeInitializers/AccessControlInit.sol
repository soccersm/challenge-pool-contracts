// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/access/access_control/AccessControlInternal.sol";
import "@solidstate/contracts/access/access_control/AccessControlStorage.sol";
import "../interfaces/SoccersmRoles.sol";

import "../libraries/LibRole.sol";
contract AccessControlInit is AccessControlInternal, SoccersmRoles {
    function init() external {
        _grantRole(AccessControlStorage.DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LibRole.ORACLE_ROLE, msg.sender);
        _grantRole(LibRole.SOCCERSM_COUNCIL, msg.sender);
        _grantRole(LibRole.CHALLENGE_POOL_MANAGER, msg.sender);
        _grantRole(LibRole.TOPIC_REGISTRAR, msg.sender);
    }
}
