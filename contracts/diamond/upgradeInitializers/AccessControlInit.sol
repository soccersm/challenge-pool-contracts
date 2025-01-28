// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/access/access_control/AccessControlInternal.sol";
import "@solidstate/contracts/access/access_control/AccessControlStorage.sol";
import "../interfaces/SoccersmRoles.sol";
import "../../diamond/facets/AccessControlFacet.sol";

contract AccessControlInit is AccessControlInternal, AccessControlFacet, SoccersmRoles {
    function init() external {
        _grantRole(AccessControlStorage.DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(SOCCERSM_COUNCIL, msg.sender);
        _grantRole(CHALLENGE_POOL_MANAGER, msg.sender);
        _grantRole(TOPIC_REGISTRAR, msg.sender);
    }
}
