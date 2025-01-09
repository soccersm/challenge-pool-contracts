// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ITopicRegistry.sol";

import "../interfaces/IChallengePool.sol";

struct TRStore {
    mapping(string => ITopicRegistry.Topic) registry;
}

library TRStorage {
    bytes32 constant TOPIC_REGISTRY_STORAGE_POSITION =
        keccak256("soccersm.topic.registry");

    function load() internal pure returns (TRStore storage s) {
        bytes32 position = TOPIC_REGISTRY_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}

struct CPStore {
    mapping(uint256 => IChallengePool.Challenge) challenges;
    mapping(address => mapping(uint256 => mapping(bytes => IChallengePool.PlayerSupply))) playerSupply; // player -> challengeId > option > supply
    mapping(uint256 => mapping(bytes => IChallengePool.OptionSupply)) optionSupply; // challengeId > option > supply
    mapping(uint256 => IChallengePool.Supply) poolSupply; // challengeId -> supply
    mapping(address => IChallengePool.StakeToken) stakeTokens;
    uint256 challengeId;
    uint256 joinPoolFee;
    uint256 createPoolFee;
    uint256 maxMaturityPeriod;
    uint256 maxPlayersPerPool;
    uint256 maxStakesPerPool;
    uint256 minStakeAmount;
    uint256 maxOptionsPerPool;
    uint256 maxEventsPerPool;
    uint256 minMaturityPeriod;
    address feeAddress;
}

library CPStorage {
    bytes32 constant CHALLENGE_POOL_STORAGE_POSITION =
        keccak256("soccersm.challenge.pool");

    function load() internal pure returns (CPStore storage s) {
        bytes32 position = CHALLENGE_POOL_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
