// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../interfaces/IPoolResolver.sol";
import "../../utils/Errors.sol";
import "../../utils/Helpers.sol";
abstract contract BaseResolver is IPoolResolver, Helpers {
    function _requestData(
        IDataProvider dataProvider,
        bytes memory _params
    ) internal returns (bool) {
        (bool success, bytes memory result) = address(dataProvider)
            .delegatecall(
                abi.encodeWithSelector(
                    IDataProvider.requestData.selector,
                    _params
                )
            );
        if (!success) {
            revert DelegateCallFailed("BaseResolver._requestData");
        }
        return abi.decode(result, (bool));
    }

    function _getData(
        IDataProvider dataProvider,
        bytes memory _params
    ) internal returns (bytes memory) {
        (bool success, bytes memory result) = address(dataProvider)
            .delegatecall(
                abi.encodeWithSelector(IDataProvider.getData.selector, _params)
            );
        if (!success) {
            revert DelegateCallFailed("BaseResolver._getData");
        }
        return result;
    }

    function _hasData(
        IDataProvider dataProvider,
        bytes memory _params
    ) internal returns (bool) {
        (bool success, bytes memory result) = address(dataProvider)
            .delegatecall(
                abi.encodeWithSelector(IDataProvider.hasData.selector, _params)
            );
        if (!success) {
            revert DelegateCallFailed("BaseResolver._hasData");
        }
        return abi.decode(result, (bool));
    }

    function _validateOptions(
        IDataProvider dataProvider,
        bytes memory _params,
        bytes[] memory _options
    ) internal returns (bool) {
        (bool success, bytes memory result) = address(dataProvider)
            .delegatecall(
                abi.encodeWithSelector(
                    IDataProvider.validateOptions.selector,
                    _params,
                    _options
                )
            );
        if (!success) {
            revert DelegateCallFailed("BaseResolver._validateOptions");
        }
        return abi.decode(result, (bool));
    }
}
