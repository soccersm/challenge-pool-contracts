// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract MultiFootBallOutcomeResolver is BaseResolver {
    function _isOutcome(bytes memory outcome) internal pure returns (bool) {
        if (
            !HelpersLib.compareBytes(outcome, abi.encode(HOME)) &&
            !HelpersLib.compareBytes(outcome, abi.encode(AWAY)) &&
            !HelpersLib.compareBytes(outcome, abi.encode(DRAW))
        ) {
            return false;
        }
        return true;
    }

    function _scoreToOutcome(
        uint256 homeScore,
        uint256 awayScore
    ) internal pure returns (bytes memory) {
        if (homeScore > awayScore) {
            return abi.encode(HOME);
        } else if (awayScore > homeScore) {
            return abi.encode(AWAY);
        } else {
            return abi.encode(DRAW);
        }
    }

    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) external override returns (bool) {
        return _requestData(dataProvider, _event.params);
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            _getData(dataProvider, _event.params),
            (uint256, uint256)
        );
        return _scoreToOutcome(homeScore, awayScore);
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent calldata /*_event*/,
        bytes[] calldata _options
    ) external pure override returns (bool) {
        if (_options.length == 0) {
            return false;
        }
        if (_options.length > 3) {
            return false;
        }
        for (uint256 i = 0; i < _options.length; i++) {
            if (!_isOutcome(_options[i])) {
                return false;
            }
        }
        return true;
    }
}
