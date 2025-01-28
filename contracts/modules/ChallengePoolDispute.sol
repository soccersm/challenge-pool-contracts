// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@solidstate/contracts/security/pausable/PausableInternal.sol";
import "@solidstate/contracts/security/reentrancy_guard/ReentrancyGuard.sol";

import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolDispute.sol";
import "../libraries/LibPrice.sol";
import "../libraries/LibTransfer.sol";
import "../libraries/LibPool.sol";

import "../utils/Helpers.sol";

import "../utils/ChallengePoolHelpers.sol";
import "../utils/Errors.sol";

import "./TopicRegistry.sol";

import "../diamond/interfaces/SoccersmRoles.sol";


contract ChallengePoolDispute is
    IChallengePoolDispute,
    SoccersmRoles,
    Helpers,
    ChallengePoolHelpers,
    PausableInternal,
    ReentrancyGuard
{
    function cancel(
        uint256 _challengeId
    )
        external
        override
        whenNotPaused
        onlySoccersmCouncil
        validChallenge(_challengeId)
    {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        c.state = ChallengeState.cancelled;
        emit CancelChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.cancelled
        );
    }

    function dispute(
        uint256 _challengeId,
        bytes calldata _outcome
    )
        external
        override
        whenNotPaused
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.evaluated)
    {
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, _outcome)) {
            revert InvalidOutcome();
        }
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (!s.optionSupply[_challengeId][keccak256(_outcome)].exists) {
            revert InvalidOutcome();
        }
        if (s.playerSupply[_challengeId][msg.sender].stakes == 0) {
            revert PlayerNotInPool();
        }
        if (block.timestamp - c.lastOutcomeSet > s.disputePeriod) {
            revert DisputePeriodElapsed();
        }
        Dispute storage d = s.playerDisputes[_challengeId][msg.sender];
        if (d.stake > 0) {
            revert PlayerAlreadyDisputed();
        }
        d.dispute = _outcome;
        d.stake = s.disputeStake;
        if (!c.disputed) {
            c.disputed = true;
            c.state = ChallengeState.disputed;
        }
        s.optionDisputes[_challengeId][keccak256(_outcome)] += s.disputeStake;
        s.poolDisputes[_challengeId] += s.disputeStake;
        LibTransfer._receive(c.stakeToken, s.disputeStake);
        emit DisputeOutcome(
            _challengeId,
            msg.sender,
            ChallengeState.disputed,
            _outcome,
            s.disputeStake
        );
    }

    function releaseDispute(
        uint256 _challengeId
    )
        external
        override
        whenNotPaused
        nonReentrant
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.closed)
    {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, c.outcome)) {
            revert InvalidOutcome();
        }
        if (s.playerSupply[_challengeId][msg.sender].stakes == 0) {
            revert PlayerNotInPool();
        }
        Dispute storage d = s.playerDisputes[_challengeId][msg.sender];
        if (d.stake == 0) {
            revert PlayerDidNotDispute();
        }
        if (d.released) {
            revert PlayerAlreadyReleased();
        }
        if (!HelpersLib.compareBytes(c.outcome, d.dispute)) {
            revert PlayerLostDispute();
        }
        d.released = true;
        LibTransfer._send(c.stakeToken, d.stake, msg.sender);
        emit DisputeReleased(
            _challengeId,
            msg.sender,
            c.state,
            d.dispute,
            d.stake
        );
    }

    function settle(
        uint256 _challengeId,
        bytes calldata _outcome
    )
        external
        override
        whenNotPaused
        nonReentrant
        onlySoccersmCouncil
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.disputed)
    {
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, _outcome)) {
            revert InvalidOutcome();
        }
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        c.state = ChallengeState.settled;
        c.outcome = _outcome;
        uint256 slashed = s.poolDisputes[_challengeId] -
            s.optionDisputes[_challengeId][keccak256(_outcome)];
        LibTransfer._send(c.stakeToken, slashed, s.feeAddress);
        emit SettleDispute(
            _challengeId,
            msg.sender,
            ChallengeState.settled,
            _outcome,
            slashed
        );
    }
}
