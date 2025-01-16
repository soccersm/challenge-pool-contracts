// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPaymaster.sol";
import "../libraries/LibData.sol";
import "../libraries/LibPool.sol";
import "../utils/Helpers.sol";

abstract contract IChallengePool {
    modifier validChallenge(uint256 _challengeId) {
        if (_challengeId >= CPStorage.load().challengeId) {
            revert InvalidChallenge();
        }
        _;
    }

    modifier poolInState(uint256 _challengeId, ChallengeState _state) {
        ChallengeState currentState = LibPool._poolState(
            CPStorage.load().challenges[_challengeId]
        );
        if (currentState != _state) {
            revert ActionNotAllowedForState(currentState);
        }
        _;
    }

    modifier validStake(uint256 _stake) {
        if (_stake < CPStorage.load().minStakeAmount) {
            revert StakeLowerThanMinimum();
        }
        _;
    }

    modifier validPrediction(bytes memory _prediction) {
        if (HelpersLib.compareBytes(_prediction, HelpersLib.emptyBytes)) {
            revert InvalidPrediction();
        }
        _;
    }

    modifier supportedToken(address _token) {
        if (!CPStorage.load().stakeTokens[_token].active) {
            revert UnsupportedToken(_token);
        }
        _;
    }
    enum ChallengeState {
        open,
        closed,
        cancelled,
        matured,
        evaluated,
        settled,
        disputed
    }
    enum PoolAction {
        stake,
        withdraw
    }

    struct ChallengeEvent {
        bytes params;
        string topicId;
        uint256 maturity;
    }
    struct Challenge {
        ChallengeState state;
        bool multi;
        bytes outcome;
        uint256 totalStakes;
        uint256 createdAt;
        uint256 maturity;
        uint256 basePrice;
        address stakeToken;
        ChallengeEvent[] events;
        bytes[] options;
        bool disputed;
        uint256 lastOutcomeSet;
    }
    struct Supply {
        uint256 stakes;
        uint256 tokens;
    }
    struct OptionSupply {
        bool exists;
        uint256 stakes;
        uint256 tokens;
    }
    struct PlayerSupply {
        bool withdrawn;
        uint256 stakes;
        uint256 tokens;
    }
    struct Dispute {
        bytes dispute;
        uint256 stake;
        bool released;
    }

    event NewChallenge(
        uint256 challengeId,
        address creator,
        uint256 createdAt,
        uint256 maturity,
        ChallengeState state,
        bytes result,
        uint256 basePrice,
        uint256 fee,
        uint256 totalStakes,
        bytes prediction,
        ChallengeEvent[] events,
        bytes[] options,
        address stakeToken,
        address paymaster
    );
    event CloseChallenge(
        uint256 challengeId,
        address closer,
        ChallengeState state,
        bytes result
    );
    event EvaluateChallenge(
        uint256 challengeId,
        address evaluator,
        ChallengeState state,
        bytes result
    );
    event DisputeOutcome(
        uint256 challengeId,
        address disputor,
        ChallengeState state,
        bytes result,
        uint256 amount
    );
    event DisputeReleased(
        uint256 challengeId,
        address disputor,
        ChallengeState state,
        bytes result,
        uint256 amount
    );
    event SettleDispute(
        uint256 challengeId,
        address disputor,
        ChallengeState state,
        bytes result,
        uint256 amount
    );
    event CancelChallenge(
        uint256 challengeId,
        address canceller,
        ChallengeState state
    );
    event Stake(
        uint256 challengeId,
        address participant,
        bytes option,
        uint256 stakes,
        uint256 amount,
        uint256 fee
    );
    event WinningsWithdrawn(
        uint256 challengeId,
        address participant,
        uint256 amountWon,
        uint256 amountWithdrawn
    );
    event Withdraw(
        uint256 challengeId,
        address participant,
        bytes option,
        uint256 stakes,
        uint256 amount,
        uint256 fee
    );

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
}
