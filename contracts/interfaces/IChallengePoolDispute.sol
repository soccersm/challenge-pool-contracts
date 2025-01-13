// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPaymaster.sol";
import "./IChallengePool.sol";

interface IChallengePoolDispute is IChallengePool {

    /**
     * @notice  .
     * @dev     evaluate pool once it's matured
     * @param   _challengeId  .
     */
    function evaluate(uint256 _challengeId) external;
    /**
     * @notice  .
     * @dev     anyone can call this to dispute the outcome.
     * @param   _challengeId  .
     * @param   _outcome  their suggested outcome.
     */
    function dispute(uint256 _challengeId, bytes calldata _outcome) external;
    function releaseDispute(uint256 _challengeId) external;
    /**
     * @notice  .
     * @dev      dispute admin can call this to settle dispute.
     * @param   _challengeId  .
     * @param   _outcome  decoded and applied based on the event topic type.
     */
    function settle(uint256 _challengeId, bytes calldata _outcome) external;
    /**
     * @notice  .
     * @dev     cancel pool for some reason
     * @param   _challengeId  .
     */
    function cancel(uint256 _challengeId) external;
    /**
     * @notice  .
     * @dev     close pool once it's evaluated or settled
     * @param   _challengeId  .
     */
    function close(uint256 _challengeId) external;
}
