// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract StatementResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event
    ) external returns (bool) {
        return _requestData(dataProvider, _event.params);
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        return _getData(dataProvider, _event.params);
    }

    function validateOptions(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event,
        bytes[] calldata _options
    ) external override returns (bool) {
        return _validateOptions(dataProvider, _event.params, _options);
    }
}
