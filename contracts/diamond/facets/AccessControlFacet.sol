// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@solidstate/contracts/access/access_control/AccessControl.sol";
import "@solidstate/contracts/access/access_control/AccessControlStorage.sol";
import "../libraries/LibRole.sol";
contract AccessControlFacet is AccessControl {
    bytes32 public constant ORACLE_ROLE = LibRole.ORACLE_ROLE;
    bytes32 public constant SOCCERSM_COUNCIL = LibRole.SOCCERSM_COUNCIL;
    bytes32 public constant CHALLENGE_POOL_MANAGER =
        LibRole.CHALLENGE_POOL_MANAGER;
    bytes32 public constant TOPIC_REGISTRAR = LibRole.TOPIC_REGISTRAR;
}
