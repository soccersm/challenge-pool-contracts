// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootBallOutcomeResolver is BaseResolver {
    function _scoreToOutcome(
        uint256 homeScore,
        uint256 awayScore
    ) internal pure returns (string memory) {
        if (homeScore > awayScore) {
            return HOME;
        } else if (awayScore > homeScore) {
            return AWAY;
        } else {
            return DRAW;
        }
    }

    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent memory _event
    ) external override returns (bool) {
        (string memory matchId, string memory outcome) = abi.decode(
            _event.params,
            (string, string)
        );
        if (
            !HelpersLib.compareStrings(outcome, HOME) &&
            !HelpersLib.compareStrings(outcome, AWAY) &&
            !HelpersLib.compareStrings(outcome, DRAW) &&
            !HelpersLib.compareStrings(outcome, HOME_DRAW) &&
            !HelpersLib.compareStrings(outcome, AWAY_DRAW) &&
            !HelpersLib.compareStrings(outcome, HOME_AWAY)
        ) {
            return false;
        }
        return _requestData(dataProvider, abi.encode(matchId));
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent memory _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        (string memory matchId, string memory outcome) = abi.decode(
            _event.params,
            (string, string)
        );
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            _getData(dataProvider, abi.encode(matchId)),
            (uint256, uint256)
        );
        string memory result = _scoreToOutcome(homeScore, awayScore);
        if (HelpersLib.compareStrings(outcome, HOME)) {
            if (HelpersLib.compareStrings(HOME, result)) {
                return yes;
            }
        } else if (HelpersLib.compareStrings(outcome, AWAY)) {
            if (HelpersLib.compareStrings(AWAY, result)) {
                return yes;
            }
        } else if (HelpersLib.compareStrings(outcome, DRAW)) {
            if (HelpersLib.compareStrings(DRAW, result)) {
                return yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HOME_DRAW)) {
            if (HelpersLib.compareStrings(HOME, result)) {
                return yes;
            }
            if (HelpersLib.compareStrings(DRAW, result)) {
                return yes;
            }
        } else if (HelpersLib.compareStrings(outcome, AWAY_DRAW)) {
            if (HelpersLib.compareStrings(AWAY, result)) {
                return yes;
            }
            if (HelpersLib.compareStrings(DRAW, result)) {
                return yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HOME_AWAY)) {
            if (HelpersLib.compareStrings(HOME, result)) {
                return yes;
            }
            if (HelpersLib.compareStrings(AWAY, result)) {
                return yes;
            }
        } else {
            revert ProtocolInvariantCheckFailed();
        }
        return no;
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent memory /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
