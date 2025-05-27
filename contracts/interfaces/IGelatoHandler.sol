// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolCommon.sol";

abstract contract IGelatoHandler is IChallengePoolCommon {
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
     * @param   _communityId community responsible for creating the challenge, id 0 for no community backed challenge
     * @param   _cType challenge type of the created challenge. standard for normal challenges and custom for community only challenges
     */
    function createChallengeRelay(
        ChallengeEvent[] calldata _events,
        bytes[] calldata _options,
        address _stakeToken,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _basePrice,
        address _paymaster,
        string calldata _communityId,
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
    function stakeRelay(
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
    function earlyWithdrawRelay(
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
    function withdrawRelay(uint256 _challengeId) external virtual;

    /**
     * @notice  .
     * @dev     bulk withdrawal
     * @param   _challengeIds  .
     */
    function bulkWithdrawRelay(
        uint256[] calldata _challengeIds
    ) external virtual;
}
