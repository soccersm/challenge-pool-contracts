// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract MultiAssetRangeResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) external override returns (bool) {
        string memory assetSymbol = abi.decode(_event.params, (string));
        return
            _requestData(
                dataProvider,
                abi.encode(assetSymbol, _event.maturity)
            );
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event,
        bytes[] calldata _options
    ) external override returns (bytes memory) {
        string memory assetSymbol = abi.decode(_event.params, (string));
        uint256 assetPrice = abi.decode(
            _getData(dataProvider, abi.encode(assetSymbol, _event.maturity)),
            (uint256)
        );
        for (uint256 i = 0; i < _options.length; i++) {
            (uint256 low, uint256 high) = abi.decode(
                _options[i],
                (uint256, uint256)
            );
            if (assetPrice >= low && assetPrice <= high) {
                return _options[i];
            }
        }
        return HelpersLib.emptyBytes;
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent calldata /*_event*/,
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
