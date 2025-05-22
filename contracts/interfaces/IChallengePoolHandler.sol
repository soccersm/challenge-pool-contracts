// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolCommon.sol";
abstract contract IChallengePoolHandler is IChallengePoolCommon {
    struct Supply {
        uint256 stakes;
        uint256 tokens;
    }
    struct OptionSupply {
        bool exists;
        uint256 stakes;
        uint256 tokens;
        uint256 rewards;
    }
    struct PlayerSupply {
        bool withdrawn;
        uint256 stakes;
        uint256 tokens;
        uint256 rewards;
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
        uint256 quantity,
        uint256 totalAmount,
        uint256 rewards,
        bytes prediction,
        ChallengeEvent[] events,
        bytes[] options,
        address stakeToken,
        bool multi
    );
    event Stake(
        uint256 challengeId,
        address participant,
        bytes option,
        uint256 stakes,
        uint256 price,
        uint256 totalAmount,
        uint256 fee,
        uint256 rewards
    );
    event Withdraw(
        uint256 challengeId,
        address participant,
        bytes option,
        uint256 stakes,
        uint256 price,
        uint256 penalty,
        uint256 totalAmount,
        uint256 fee,
        uint256 rewards
    );
    event EvaluateChallenge(
        uint256 challengeId,
        address evaluator,
        ChallengeState state,
        bytes result
    );
    event CloseChallenge(
        uint256 challengeId,
        address closer,
        ChallengeState state,
        bytes result
    );

    event WinningsWithdrawn(
        uint256 challengeId,
        address participant,
        uint256 amountWon,
        uint256 amountWithdrawn
    );
    /**
     * @notice  .
     * @dev     create a new challenge
     * @param   _events  events in the challenge, maximum of one event if _options is not empty
     * @param   _options  challenge options, if empty then it is a yes or no pool
     * @param   _stakeToken  token used for staking on this challenge
     * @param   _prediction  prediction of user creating the challenge
     * @param   _quantity  how many stakes user is purchasing for this prediction
     * @param   _basePrice  the base price of a stake. total amount to be transferred is _basePrice * _quantity
     * @param   _paymaster  a contract the pays the total amount on behalf of the user set to 0x if none
     * @param _communityId community responsible for creating the challenge, id 0 for no community backed challenge
     * @param _cType challenge type of the created challenge. standard for normal challenges and custom for community only challenges
     */
    function createChallenge(
        ChallengeEvent[] calldata _events,
        bytes[] calldata _options,
        address _stakeToken,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _basePrice,
        address _paymaster,
        uint256 _communityId,
        ChallengeType _cType
    ) external virtual;
    /**
     * @notice  .
     * @dev     stake on a pool
     * @param   _challengeId  .
     * @param   _prediction  .
     * @param   _quantity  how many stakes user is purchasing for this prediction
     * @param   _paymaster  a contract the pays the total amount on behalf of the user set to 0x if none
     */
    function stake(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        address _paymaster
    ) external virtual;

    /**
     * @notice  .
     * @dev     early withdrawal allows player to get out of their stake. price of option calculated accordingly and applied
     * @param   _challengeId  .
     * @param   _option  option to withdraw from
     * @param   _quantity  of stakes to withdraw.
     * @param   _deadline  time after which this early withdraw transaction will revert
     */
    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        uint256 _deadline
    ) external virtual;

    /**
     * @notice  .
     * @dev     withdraw winnings from pool, reverts if user lost
     * @param   _challengeId  .
     */
    function withdraw(uint256 _challengeId) external virtual;
    /**
     * @notice  .
     * @dev     bulk withdrawal
     * @param   _challengeIds  .
     */
    function bulkWithdraw(uint256[] calldata _challengeIds) external virtual;

    /**
     * @notice  .
     * @dev     evaluate pool once it's matured
     * @param   _challengeId  .
     */
    function evaluate(uint256 _challengeId) external virtual;
    /**
     * @notice  .
     * @dev     close pool once it's evaluated or settled
     * @param   _challengeId  .
     */
    function close(uint256 _challengeId) external virtual;
}
