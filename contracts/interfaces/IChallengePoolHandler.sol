// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPaymaster.sol";
import "./IChallengePool.sol";

abstract contract  IChallengePoolHandler is IChallengePool {

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
     */
    function createChallenge(
        ChallengeEvent[] calldata _events,
        bytes[] calldata _options,
        address _stakeToken,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _basePrice,
        address _paymaster
    ) external virtual;
    /**
     * @notice  .
     * @dev     stake on a pool
     * @param   _challengeId  .
     * @param   _prediction  .
     * @param   _quantity  how many stakes user is purchasing for this prediction
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
     * @dev     early withdrawal allows player to get out of their stake. price of option calculated accordingly and applied
     * @param   _challengeId  .
     * @param   _option  option to withdraw from
     * @param   _quantity  of stakes to withdraw.
     * @param   _minPrice  minumum price user is willing to accept for selling their position.
     * @param   _deadline  ime after which this early withdraw transaction will revert
     */
    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        uint256 _minPrice,
        uint256 _deadline
    ) external virtual;
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
    ) external virtual view returns (uint256);
    /**
     * @notice  .
     * @dev     returns the Challenge struct.
     * @param   _challengeId  id of the challenge to return.
     * @return  Challenge  .
     */
    function getChallenge(
        uint256 _challengeId
    ) external virtual view returns (Challenge memory);
}
