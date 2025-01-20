// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/access/access_control/AccessControlInternal.sol";
abstract contract SoccersmRoles is AccessControlInternal {
    bytes32 internal constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 internal constant SOCCERSM_COUNCIL = keccak256("SOCCERSM_COUNCIL");
    bytes32 internal constant CHALLENGE_POOL_MANAGER =
        keccak256("CHALLENGE_POOL_MANAGER");
    bytes32 internal constant TOPIC_REGISTRAR = keccak256("TOPIC_REGISTRAR");

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
