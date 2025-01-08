// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPaymaster.sol";

interface IChallengePool {
    enum ChallengeState {
        open,
        closed,
        cancelled,
        matured
    }

    struct ChallengeEvent {
        bytes params;
        string topicId;
        uint256 maturity;
        bytes outcome;
    }

    struct PartialChallengeEvent {
        bytes params;
        string topicId;
        uint256 maturity;
    }

    struct Challenge {
        ChallengeState state;
        bool multi;
        bytes outcome;
        uint256 totalParticipants;
        uint256 totalTickets;
        uint256 createdAt;
        uint256 maturity;
        ChallengeEvent[] events;
        bytes[] options;
    }

    struct StakeToken {
        address token;
        uint256 accumulatedFee;
        bool active;
    }

    struct Ticket {
        uint256 quantity;
        bytes choice;
        bool withdrawn;
    }

    struct OptionTicket {
        bool isOption;
        uint256 totalSupply;
    }

    error InvalidChallenge();
    error InvalidPrediction();
    error ChallengePoolClosed();
    error InvalidMaxDeadLine();
    error ActionNotAllowedForState(ChallengeState _state);
    error PlayerLimitReached();
    error PlayerAlreadyInPool();
    error PlayerNotInPool();
    error PlayerDidNotWinPool();
    error PlayerWinningAlreadyWithdrawn();
    error StakeLowerThanMinimum();
    error ProtocolInvariantCheckFailed();
    error UserLacksBalls();
    error InvalidPollTopic();
    error InvalidPollParam();
    error InvalidPollMaturity();
    error InvalidOptionsLength();
    error InvalidPollOption();

    /**
     * @notice  .
     * @dev     .
     * @param   events  .
     * @param   options  .
     * @param   _prediction  .
     * @param   _quantity  .
     * @param   _stake  .
     * @param   _paymaster  .
     */
    function createChallenge(
        PartialChallengeEvent[] calldata events,
        bytes[] calldata options,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _stake,
        IPaymaster _paymaster
    ) external;

    /**
     * @notice  .
     * @dev     .
     * @param   _challengeId  .
     * @param   _prediction  .
     * @param   _quantity  .
     * @param   _stake  .
     * @param   _paymaster  .
     */
    function stake(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _stake,
        IPaymaster _paymaster
    ) external;

    /**
     * @notice  .
     * @dev     .
     * @param   _challengeId  .
     */
    function withdraw(uint256 _challengeId) external;

    /**
     * @notice  .
     * @dev     .
     * @param   _challengeIds  .
     */
    function bulkWithdraw(uint256[] calldata _challengeIds) external;

    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity
    ) external;

    function price(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity
    ) external returns(uint256);
}
