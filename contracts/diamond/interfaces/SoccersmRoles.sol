// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/access/access_control/AccessControlInternal.sol";
import "../libraries/LibRole.sol";
abstract contract SoccersmRoles is AccessControlInternal {
    modifier onlyAdmin() {
        _checkRole(AccessControlStorage.DEFAULT_ADMIN_ROLE);
        _;
    }

    modifier onlyOracle() {
        _checkRole(LibRole.ORACLE_ROLE);
        _;
    }

    modifier onlySoccersmCouncil() {
        _checkRole(LibRole.SOCCERSM_COUNCIL);
        _;
    }

    modifier onlyPoolManager() {
        _checkRole(LibRole.CHALLENGE_POOL_MANAGER);
        _;
    }

    modifier onlyTopicRegistrar() {
        _checkRole(LibRole.TOPIC_REGISTRAR);
        _;
    }
}
