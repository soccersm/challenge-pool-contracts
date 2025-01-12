// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ITopicRegistry.sol";

import "../interfaces/IChallengePool.sol";

import "../interfaces/IChallengePoolManager.sol";

import "../interfaces/IDataProvider.sol";

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
    mapping(address => mapping(uint256 => mapping(bytes => IChallengePool.PlayerSupply))) playerOptionSupply; // player -> challengeId > option > supply
    mapping(address => mapping(uint256 => IChallengePool.PlayerSupply)) playerSupply; // player -> challengeId > supply
    mapping(uint256 => mapping(bytes => IChallengePool.OptionSupply)) optionSupply; // challengeId > option > supply
    mapping(uint256 => IChallengePool.Supply) poolSupply; // challengeId -> supply
    mapping(address => IChallengePoolManager.StakeToken) stakeTokens;
    mapping(uint256 => mapping(address => IChallengePool.Dispute)) playerDisputes; // challengeId -> disputer -> data dispute
    mapping(uint256 => mapping(bytes => uint256)) optionDisputes; // challengeId -> disputer -> stakes
    mapping(uint256 => uint256) poolDisputes; // challengeId -> stakes
    uint256 challengeId;
    uint256 stakeFee;
    uint256 earlyWithdrawFee;
    uint256 createPoolFee;
    uint256 minStakeAmount;
    uint256 maxOptionsPerPool;
    uint256 maxEventsPerPool;
    uint256 minMaturityPeriod;
    address feeAddress;
    uint256 disputePeriod;
    uint256 disputeStake;
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

struct DPStore {
    mapping(bytes => IDataProvider.DataRequest) dataRequest; // requestId -> data request
    mapping(bytes => mapping(bytes => bool)) requestOptions; // requestId -> option -> bool
}

library DPStorage {
    bytes32 constant DATA_PROVIDER_STORAGE_POSITION =
        keccak256("soccersm.data.provider");

    function load() internal pure returns (DPStore storage s) {
        bytes32 position = DATA_PROVIDER_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
