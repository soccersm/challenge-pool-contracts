// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPaymaster.sol";

interface IChallengePool {
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
        uint256 indexed challengeId,
        address indexed creator,
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
        uint256 indexed challengeId,
        address indexed closer,
        ChallengeState state,
        bytes result
    );
    event EvaluateChallenge(
        uint256 indexed challengeId,
        address indexed evaluator,
        ChallengeState state,
        bytes result
    );
    event DisputeOutcome(
        uint256 indexed challengeId,
        address indexed disputor,
        ChallengeState state,
        bytes result,
        uint256 amount
    );
    event DisputeReleased(
        uint256 indexed challengeId,
        address indexed disputor,
        ChallengeState state,
        bytes result,
        uint256 amount
    );
    event SettleDispute(
        uint256 indexed challengeId,
        address indexed disputor,
        ChallengeState state,
        bytes result,
        uint256 amount
    );
    event CancelChallenge(
        uint256 indexed challengeId,
        address indexed canceller,
        ChallengeState state
    );
    event Stake(
        uint256 indexed challengeId,
        address indexed participant,
        bytes option,
        uint256 stakes,
        uint256 amount,
        uint256 fee
    );
    event WinningsWithdrawn(
        uint256 indexed challengeId,
        address indexed participant,
        uint256 amountWon,
        uint256 amountWithdrawn
    );
    event Withdraw(
        uint256 indexed challengeId,
        address indexed participant,
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
    error InvalidOptionsLength();
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
