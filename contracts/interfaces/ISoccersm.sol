// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IChallengePool.sol";
import "./ITopicRegistry.sol";
import "./IDataProvider.sol";
import "./IPoolResolver.sol";
import "./ICommunity.sol";
import "./ICommunityView.sol";
import "./ITournament.sol";

abstract contract ISoccersm is
    IChallengePool,
    ITopicRegistry,
    IDataProvider,
    IPoolResolver,
    ICommunity,
    ICommunityView,
    ITournament
{}
