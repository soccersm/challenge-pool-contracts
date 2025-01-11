// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootBallCorrectScoreResolver is BaseResolver {
    function resolveEvent(
        IChallengePool.ChallengeEvent memory _event
    )
        external
        view
        override
        returns (bytes memory)
    {}

    function validateEvent(
        IChallengePool.ChallengeEvent memory _event
    ) external view override returns (bool) {}

    function validateOptions(
        IDataProvider dataProvider,
        bytes[] calldata _options
    ) external pure override returns (bool) {}
}
