// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract StatementResolver is BaseResolver {
    function _decodeParams(
        bytes memory _params
    ) internal pure returns (string memory, string memory, uint256) {
        return abi.decode(_params, (string, string, uint256));
    }

    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event
    ) external returns (bool) {
        (, , uint256 maturity) = _decodeParams(_event.params);
        if (_event.maturity < maturity) {
            return false;
        }
        return _requestData(dataProvider, _event.params);
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        return _getData(dataProvider, _event.params);
    }

    function validateOptions(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event,
        bytes[] memory _options
    ) external override returns (bool) {
        return _validateOptions(dataProvider, _event.params, _options);
    }

}
