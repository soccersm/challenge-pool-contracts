// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../utils/Helpers.sol";

abstract contract IChallengePoolCommon {
    enum ChallengeState {
        open,
        closed,
        cancelled,
        matured,
        evaluated,
        settled,
        disputed
    }
    enum ChallengeType {
        standard,
        community,
        tournament
    }
    struct Challenge {
        ChallengeState state;
        bool multi;
        bytes outcome;
        uint256 createdAt;
        uint256 maturity;
        uint256 basePrice;
        address stakeToken;
        ChallengeEvent[] events;
        bytes[] options;
        bool disputed;
        uint256 lastOutcomeSet;
        bytes communityId;
        ChallengeType cType; 
    }

    struct ChallengeEvent {
        bytes params;
        string topicId;
        uint256 maturity;
    }

    error InvalidChallenge();
    error InvalidPrediction();
    error ActionNotAllowedForState(ChallengeState _state);
    error PlayerDidNotWinPool();
    error PlayerNotInPool();
    error PlayerAlreadyWithdrawn();
    error StakeLowerThanMinimum();
    error InvalidEventTopic();
    error InvalidEventParam();
    error InvalidEventMaturity();
    error InvalidEventLength();
    error InvalidPoolOption();
    error InvalidOutcome();
    error UnsupportedToken(address _token);
    error MaxPriceExceeded();
    error DeadlineExceeded();
    error BelowMinPrie();
    error InsufficientStakes(uint256 _requested, uint256 _available);
    error DisputePeriodElapsed();
    error PlayerAlreadyDisputed();
    error PlayerAlreadyReleased();
    error PlayerDidNotDispute();
    error PlayerLostDispute();
    error DisputePeriod();
}
