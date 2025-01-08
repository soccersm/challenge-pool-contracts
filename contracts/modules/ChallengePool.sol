// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IChallengePool.sol";

contract ChallengePool is IChallengePool {
    bytes32 constant CHALLENGE_POOL_STORAGE_POSITION =
        keccak256("soccersm.challenge.pool");

    struct ChallengePoolStore {
        IChallengePool.Challenge[] challenges;
    }

    function store() internal pure returns (ChallengePoolStore storage s) {
        bytes32 position = CHALLENGE_POOL_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function createChallenge(
        PartialChallengeEvent[] calldata events,
        bytes[] calldata options,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _stake,
        IPaymaster _paymaster
    ) external override {}

    function stake(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _stake,
        IPaymaster _paymaster
    ) external override {}

    function withdraw(uint256 _challengeId) external override {}

    function bulkWithdraw(uint256[] calldata _challengeIds) external override {}

    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity
    ) external override {}

    function price(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity
    ) external override returns (uint256) {}
}
