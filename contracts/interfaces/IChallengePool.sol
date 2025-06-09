// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "./IChallengePoolHandler.sol";

import "./IChallengePoolDispute.sol";
import "./IChallengePoolManager.sol";

import "./IChallengePoolView.sol";

abstract contract IChallengePool is
    IChallengePoolHandler,
    IChallengePoolDispute,
    IChallengePoolManager,
    IChallengePoolView
{}
