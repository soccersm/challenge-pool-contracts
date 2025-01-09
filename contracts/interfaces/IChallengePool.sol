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
        uint256 totalTickets;
        uint256 createdAt;
        uint256 maturity;
        uint256 basePrice;
        address stakeToken;
        ChallengeEvent[] events;
        bytes[] options;
    }

    struct StakeToken {
        address token;
        uint256 accumulatedFee;
        bool active;
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

    event StakeTokenAdded(address indexed token, bool active);
    event NewChallenge(
        uint256 indexed challengeId,
        address indexed creator,
        uint256 createdAt,
        uint256 maturity,
        ChallengeState state,
        bytes result,
        uint256 basePrice,
        uint256 fee,
        uint256 totalTickets,
        bytes prediction,
        ChallengeEvent[] events,
        bytes[] options,
        address stakeToken,
        address paymaster
    );
    event ClosedChallenge(
        uint256 indexed challengeId,
        address indexed closer,
        ChallengeState state,
        bytes result
    );
    event CancelChallenge(
        uint256 indexed challengeId,
        address indexed canceller,
        ChallengeState state
    );
    event Stake(
        uint256 indexed challengeId,
        address indexed participant,
        uint256 fee,
        uint256 ticketQuantity,
        uint256 price,
        bytes choice,
        ChallengeState state
    );
    event WinningsWithdrawn(
        address indexed participant,
        uint256 indexed challengeId,
        uint256 amountWon,
        uint256 amountWithdrawn
    );
    event Withdraw(
        address indexed participant,
        uint256 indexed challengeId,
        bytes option,
        uint256 stakes,
        uint256 amount
    );

    error InvalidChallenge();
    error InvalidPrediction();
    error ChallengePoolClosed();
    error InvalidMaxDeadLine();
    error ActionNotAllowedForState(ChallengeState _state);
    error PlayerLimitReached();
    error PlayerDidNotWinPool();
    error PlayerAlreadyWithdrawn();
    error StakeLowerThanMinimum();
    error ProtocolInvariantCheckFailed();
    error UserLacksBalls();
    error InvalidEventTopic();
    error InvalidEventParam();
    error InvalidEventMaturity();
    error InvalidEventLength();
    error InvalidOptionsLength();
    error InvalidPoolOption();
    error InvalidOutcome();
    error DelegateCallFailed(string _functionName);
    error UnsupportedToken(address _token);
    error MaxPriceExceeded();
    error DeadlineExceeded();
    error BelowMinPrie();
    error InsufficientStakes(uint256 _requested, uint256 _available);

    /**
     * @notice  .
     * @dev     create a new challenge
     * @param   _events  events in the challenge, maximum of one event if _options is not empty
     * @param   _options  challenge options, if empty then it is a yes or no pool
     * @param   _stakeToken  token used for staking on this challenge
     * @param   _prediction  prediction of user creating the challenge
     * @param   _quantity  how many tickets user is purchasing for this prediction
     * @param   _basePrice  the base price of a ticket. total amount to be transferred is _basePrice * _quantity
     * @param   _paymaster  a contract the pays the total amount on behalf of the user set to 0x if none
     */
    function createChallenge(
        ChallengeEvent[] calldata _events,
        bytes[] calldata _options,
        address _stakeToken,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _basePrice,
        address _paymaster
    ) external;

    /**
     * @notice  .
     * @dev     stake on a pool
     * @param   _challengeId  .
     * @param   _prediction  .
     * @param   _quantity  how many tickets user is purchasing for this prediction
     * @param   _maxPrice  the maximum price user is willing to pay.
     * @param   _deadline  time after which this stake transaction will revert
     * @param   _paymaster  a contract the pays the total amount on behalf of the user set to 0x if none
     */
    function stake(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _maxPrice,
        uint256 _deadline,
        address _paymaster
    ) external;

    /**
     * @notice  .
     * @dev     withdraw winnings from pool, reverts if user lost
     * @param   _challengeId  .
     */
    function withdraw(uint256 _challengeId) external;

    /**
     * @notice  .
     * @dev     bulk withdrawal
     * @param   _challengeIds  .
     */
    function bulkWithdraw(uint256[] calldata _challengeIds) external;

    /**
     * @notice  .
     * @dev     early withdrawal allows player to get out of their stake. price of option calculated accordingly and applied
     * @param   _challengeId  .
     * @param   _option  option to withdraw from
     * @param   _quantity  of tickets to withdraw.
     * @param   _minPrice  minumum price user is willing to accept for selling their position.
     * @param   _deadline  ime after which this early withdraw transaction will revert
     */
    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        uint256 _minPrice,
        uint256 _deadline
    ) external;

    /**
     * @notice  .
     * @dev     price calculation for a pool option
     * @param   _challengeId  .
     * @param   _option  .
     * @param   _quantity  .
     * @return  uint256  .
     */
    function price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        PoolAction _action
    ) external view returns (uint256);

    /**
     * @notice  .
     * @dev     returns the Challenge struct.
     * @param   _challengeId  id of the challenge to return.
     * @return  Challenge  .
     */
    function getChallenge(
        uint256 _challengeId
    ) external view returns (Challenge memory);
}
