// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ITopicRegistry.sol";

import "../interfaces/IChallengePool.sol";

import "../interfaces/IChallengePoolManager.sol";

import "../interfaces/IChallengePoolDispute.sol";

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
    mapping(uint256 => IChallengePoolHandler.Challenge) challenges;
    mapping(uint256 => mapping(address => mapping(bytes32 => IChallengePoolHandler.PlayerSupply))) playerOptionSupply; // challengeId -> player > option > supply
    mapping(uint256 => mapping(address => IChallengePoolHandler.PlayerSupply)) playerSupply; // challengeId -> player > supply
    mapping(uint256 => mapping(bytes32 => IChallengePoolHandler.OptionSupply)) optionSupply; // challengeId > option > supply
    mapping(uint256 => IChallengePoolHandler.Supply) poolSupply; // challengeId -> supply
    mapping(uint256 => mapping(address => IChallengePoolDispute.Dispute)) playerDisputes; // challengeId -> disputer -> data dispute
    mapping(uint256 => mapping(bytes32 => uint256)) optionDisputes; // challengeId -> option -> stakes
    mapping(uint256 => uint256) poolDisputes; // challengeId -> stakes
    mapping(address => IChallengePoolManager.StakeToken) stakeTokens;
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
    address gelatoTrustedForwarder;
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
    mapping(bytes32 => IDataProvider.DataRequest) dataRequest; // requestId -> data request
    mapping(bytes32 => mapping(bytes32 => bool)) requestOptions; // requestId -> option -> bool
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

struct AirDropStore {
    uint256 stakeAirDrop;
    address paymaster;
    uint256 maxClaim;
    mapping(address => mapping(address => uint256)) claimCount; // player -> token -> claims
    uint256 minPoolMaturity;
}

library AirDropStorage {
    bytes32 constant AIRDROP_STORAGE_POSITION =
        keccak256("soccersm.data.airdop");

    function load() internal pure returns (AirDropStore storage s) {
        bytes32 position = AIRDROP_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
