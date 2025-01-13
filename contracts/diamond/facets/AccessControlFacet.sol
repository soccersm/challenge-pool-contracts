// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/access/access_control/AccessControl.sol";
import "@solidstate/contracts/access/access_control/AccessControlStorage.sol";
import "../interfaces/SoccersmRoles.sol";

contract AccessControlFacet is AccessControl, SoccersmRoles {
    modifier onlyAdmin() {
        _checkRole(AccessControlStorage.DEFAULT_ADMIN_ROLE);
        _;
    }

    modifier onlyOracle() {
        _checkRole(ORACLE_ROLE);
        _;
    }

    modifier onlySoccersmCouncil() {
        _checkRole(SOCCERSM_COUNCIL);
        _;
    }

    modifier onlyPoolManager() {
        _checkRole(CHALLENGE_POOL_MANAGER);
        _;
    }

    modifier onlyTopicRegistrar() {
        _checkRole(TOPIC_REGISTRAR);
        _;
    }
}
