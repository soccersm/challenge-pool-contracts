// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IChallengePoolHandler.sol";

import "./IChallengePoolDispute.sol";
import "./ITopicRegistry.sol";
import "./IDataProvider.sol";
import "./IPoolResolver.sol";

interface ISoccersm is
    IChallengePoolHandler,
    IChallengePoolDispute,
    ITopicRegistry
{}
