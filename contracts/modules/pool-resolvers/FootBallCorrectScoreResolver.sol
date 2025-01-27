// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootBallCorrectScoreResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent memory _event
    ) external override returns (bool) {
        (string memory matchId, , ) = abi.decode(
            _event.params,
            (string, uint256, uint256)
        );
        return _requestData(dataProvider, abi.encode(matchId));
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent memory _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        (
            string memory matchId,
            uint256 predictedHomeScore,
            uint256 predictedAwayScore
        ) = abi.decode(_event.params, (string, uint256, uint256));
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            _getData(dataProvider, abi.encode(matchId)),
            (uint256, uint256)
        );
        if (
            homeScore == predictedHomeScore && awayScore == predictedAwayScore
        ) {
            return yes;
        } else {
            return no;
        }
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent memory /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
