// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract MultiFootBallCorrectScoreResolver is BaseResolver {
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
        return _getData(dataProvider, _event.params);
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent calldata /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        return true;
    }
}
