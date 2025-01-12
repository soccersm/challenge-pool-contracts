// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootBallMultiTotalExactResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event
    ) external view override returns (bool) {}

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event,
        bytes[] calldata _options
    ) external override returns (bytes memory) {}

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePool.ChallengeEvent memory /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
