// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolDispute.sol";
import "../libraries/LibPrice.sol";
import "../libraries/LibTransfer.sol";
import "../libraries/LibPool.sol";

import "../utils/Helpers.sol";
import "../utils/Errors.sol";

import "./TopicRegistry.sol";

import "../diamond/interfaces/SoccersmRoles.sol";

contract ChallengePoolDispute is IChallengePoolDispute, SoccersmRoles, Helpers {


    function evaluate(
        uint256 _challengeId
    )
        external
        override
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.matured)
    {
        TRStore storage t = TRStorage.load();
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (compareBytes(emptyBytes, c.outcome)) {
            revert InvalidOutcome();
        }
        c.state = ChallengeState.closed;
        bytes memory result = emptyBytes;
        if (c.multi) {
            bool allCorrect = true;
            for (uint i = 0; i < c.events.length; i++) {
                if (
                    t.registry[c.events[i].topicId].state ==
                    ITopicRegistry.TopicState.disabled
                ) {
                    revert InvalidEventTopic();
                }
                if (
                    c.events[i].maturity <
                    (block.timestamp + s.minMaturityPeriod)
                ) {
                    revert InvalidEventMaturity();
                }
                if (compareBytes(no, LibPool._resolveEvent(t, c.events[i]))) {
                    allCorrect = false;
                }
            }
            if (allCorrect) {
                c.outcome = yes;
                result = yes;
            } else {
                c.outcome = no;
                result = no;
            }
        } else {
            c.outcome = LibPool._resolveEvent(t, c.events[0]);
        }
        c.lastOutcomeSet = block.timestamp;

        emit EvaluateChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.closed,
            result
        );
    }

    function cancel(
        uint256 _challengeId
    ) external override onlySoccersmCouncil validChallenge(_challengeId) {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        c.state = ChallengeState.cancelled;
        emit CancelChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.cancelled
        );
    }

    function close(
        uint256 _challengeId
    ) external override validChallenge(_challengeId) {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (
            c.state != ChallengeState.settled ||
            c.state != ChallengeState.evaluated
        ) {
            revert ActionNotAllowedForState(c.state);
        }
        if (compareBytes(emptyBytes, c.outcome)) {
            revert InvalidOutcome();
        }
        c.state = ChallengeState.closed;
        emit CloseChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.closed,
            c.outcome
        );
    }

    function dispute(
        uint256 _challengeId,
        bytes calldata _outcome
    )
        external
        override
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.evaluated)
    {
        if (compareBytes(emptyBytes, _outcome)) {
            revert InvalidOutcome();
        }
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (!s.optionSupply[_challengeId][_outcome].exists) {
            revert InvalidOutcome();
        }
        if (s.playerSupply[msg.sender][_challengeId].stakes == 0) {
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
        }
        s.optionDisputes[_challengeId][_outcome] += s.disputeStake;
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
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.closed)
    {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (s.playerSupply[msg.sender][_challengeId].stakes == 0) {
            revert PlayerNotInPool();
        }
        Dispute storage d = s.playerDisputes[_challengeId][msg.sender];
        if (d.stake == 0) {
            revert PlayerDidNotDispute();
        }
        if (d.released) {
            revert PlayerAlreadyReleased();
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
        onlySoccersmCouncil
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.disputed)
    {
        if (compareBytes(emptyBytes, _outcome)) {
            revert InvalidOutcome();
        }
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        c.state = ChallengeState.settled;
        c.outcome = _outcome;
        uint256 slashed = s.poolDisputes[_challengeId] -
            s.optionDisputes[_challengeId][_outcome];
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
