// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolCommon.sol";

abstract contract IChallengePoolDispute is  IChallengePoolCommon {
    struct Dispute {
        bytes dispute;
        uint256 stake;
        bool released;
    }
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
    event CancelChallenge(
        uint256 challengeId,
        address canceller,
        ChallengeState state
    );

    /**
     * @notice  .
     * @dev     evaluate pool once it's matured
     * @param   _challengeId  .
     */
    function evaluate(uint256 _challengeId) external virtual;
    /**
     * @notice  .
     * @dev     anyone can call this to dispute the outcome.
     * @param   _challengeId  .
     * @param   _outcome  their suggested outcome.
     */
    function dispute(
        uint256 _challengeId,
        bytes calldata _outcome
    ) external virtual;
    function releaseDispute(uint256 _challengeId) external virtual;
    /**
     * @notice  .
     * @dev      dispute admin can call this to settle dispute.
     * @param   _challengeId  .
     * @param   _outcome  decoded and applied based on the event topic type.
     */
    function settle(
        uint256 _challengeId,
        bytes calldata _outcome
    ) external virtual;
    /**
     * @notice  .
     * @dev     cancel pool for some reason
     * @param   _challengeId  .
     */
    function cancel(uint256 _challengeId) external virtual;
    /**
     * @notice  .
     * @dev     close pool once it's evaluated or settled
     * @param   _challengeId  .
     */
    function close(uint256 _challengeId) external virtual;
}
