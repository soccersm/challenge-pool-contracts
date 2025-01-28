// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library LibRole {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant SOCCERSM_COUNCIL = keccak256("SOCCERSM_COUNCIL");
    bytes32 public constant CHALLENGE_POOL_MANAGER =
        keccak256("CHALLENGE_POOL_MANAGER");
    bytes32 public constant TOPIC_REGISTRAR = keccak256("TOPIC_REGISTRAR");
}
