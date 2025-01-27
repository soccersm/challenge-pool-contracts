// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract MultiFootBallTotalExactResolver is BaseResolver {
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
        return abi.encode(homeScore + awayScore);
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent calldata /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        return true;
    }
}
