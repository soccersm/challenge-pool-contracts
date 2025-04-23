// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootBallOutcomeResolver is BaseResolver {
    function _scoreToOutcome(
        uint256 homeScore,
        uint256 awayScore
    ) internal pure returns (string memory) {
        if (homeScore > awayScore) {
            return HelpersLib.HOME;
        } else if (awayScore > homeScore) {
            return HelpersLib.AWAY;
        } else {
            return HelpersLib.DRAW;
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
            !HelpersLib.compareStrings(outcome, HelpersLib.HOME) &&
            !HelpersLib.compareStrings(outcome, HelpersLib.AWAY) &&
            !HelpersLib.compareStrings(outcome, HelpersLib.DRAW) &&
            !HelpersLib.compareStrings(outcome, HelpersLib.HOME_DRAW) &&
            !HelpersLib.compareStrings(outcome, HelpersLib.AWAY_DRAW) &&
            !HelpersLib.compareStrings(outcome, HelpersLib.HOME_AWAY)
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
        if (HelpersLib.compareStrings(outcome, HelpersLib.HOME)) {
            if (HelpersLib.compareStrings(HelpersLib.HOME, result)) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.AWAY)) {
            if (HelpersLib.compareStrings(HelpersLib.AWAY, result)) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.DRAW)) {
            if (HelpersLib.compareStrings(HelpersLib.DRAW, result)) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.HOME_DRAW)) {
            if (HelpersLib.compareStrings(HelpersLib.HOME, result)) {
                return HelpersLib.yes;
            }
            if (HelpersLib.compareStrings(HelpersLib.DRAW, result)) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.AWAY_DRAW)) {
            if (HelpersLib.compareStrings(HelpersLib.AWAY, result)) {
                return HelpersLib.yes;
            }
            if (HelpersLib.compareStrings(HelpersLib.DRAW, result)) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.HOME_AWAY)) {
            if (HelpersLib.compareStrings(HelpersLib.HOME, result)) {
                return HelpersLib.yes;
            }
            if (HelpersLib.compareStrings(HelpersLib.AWAY, result)) {
                return HelpersLib.yes;
            }
        } else {
            revert ProtocolInvariantCheckFailed();
        }
        return HelpersLib.no;
    }

     function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent calldata /*_event*/,
        bytes[] calldata _options
    ) external pure override returns (bool) {
        if (_options.length == 0) {
            return false;
        }
        for (uint256 i = 0; i < _options.length; i++) {
            string memory opt = abi.decode(_options[i], (string));
            if (
                !HelpersLib.compareStrings(opt, HelpersLib.HOME) &&
                !HelpersLib.compareStrings(opt, HelpersLib.AWAY) &&
                !HelpersLib.compareStrings(opt, HelpersLib.DRAW) &&
                !HelpersLib.compareStrings(opt, HelpersLib.HOME_DRAW) &&
                !HelpersLib.compareStrings(opt, HelpersLib.AWAY_DRAW) &&
                !HelpersLib.compareStrings(opt, HelpersLib.HOME_AWAY)
            ) {
                return false;
            }
        }
        return true;
    }
}
