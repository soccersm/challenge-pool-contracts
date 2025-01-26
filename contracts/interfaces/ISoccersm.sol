// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IChallengePoolHandler.sol";

import "./IChallengePoolDispute.sol";
import "./IChallengePoolManager.sol";

import "./IChallengePoolView.sol";
import "./ITopicRegistry.sol";
import "./IDataProvider.sol";
import "./IPoolResolver.sol";

abstract contract ISoccersm is
    IChallengePoolHandler,
    IChallengePoolDispute,
    IChallengePoolManager,
    IChallengePoolView,
    ITopicRegistry,
    IDataProvider,
    IPoolResolver
{}
