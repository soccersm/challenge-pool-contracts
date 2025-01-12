// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootBallScoreOutcomeResolver is BaseResolver {
      function validateOptions(
        IDataProvider dataProvider,
        bytes calldata _params,
        bytes[] calldata _options
    ) external pure override returns (bool) {}

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event
    ) external view override returns (bytes memory) {}

    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event
    ) external view override returns (bool) {}
}
