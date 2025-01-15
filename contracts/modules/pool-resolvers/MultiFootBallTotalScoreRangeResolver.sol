// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract MultiFootBallTotalScoreRangeResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event
    ) external override returns (bool) {
        return _requestData(dataProvider, _event.params);
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event,
        bytes[] calldata _options
    ) external override returns (bytes memory) {
        string memory matchId = abi.decode(_event.params, (string));

        (uint256 homeScore, uint256 awayScore) = abi.decode(
            _getData(dataProvider, abi.encode(matchId)),
            (uint256, uint256)
        );
        uint256 totalScore = homeScore + awayScore;
        for (uint256 i = 0; i < _options.length; i++) {
            (uint256 low, uint256 high) = abi.decode(
                _options[i],
                (uint256, uint256)
            );
            if (totalScore >= low && totalScore <= high) {
                return _options[i];
            }
        }
        return emptyBytes;
    }

    function validateOptions(
        IDataProvider /* dataProvider*/,
        IChallengePool.ChallengeEvent calldata /*_event*/,
        bytes[] calldata _options
    ) external pure override returns (bool) {
        if (_options.length == 0) {
            return false;
        }
        for (uint256 i = 0; i < _options.length; i++) {
            (uint256 low, uint256 high) = abi.decode(
                _options[i],
                (uint256, uint256)
            );
            if (high <= low) {
                return false;
            }
        }
        return true;
    }
}
