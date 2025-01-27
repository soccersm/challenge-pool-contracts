// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseProvider.sol";

contract AssetPriceDataProvider is BaseProvider {
    function requestData(
        bytes calldata _params
    ) external override returns (bool) {
        (string memory assetSymbol, uint256 date) = _decodeRequestedParams(
            _params
        );

        bytes memory requestId = _requestId(assetSymbol, date);

        if (requestExists(requestId)) {
            return true;
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId] = DataRequest(_params, HelpersLib.emptyBytes, false);

        emit DataRequested(msg.sender, namespace(), requestId, _params);
        return true;
    }

    function _provideData(
        bytes calldata _params,
        ProvisionMode _mode
    ) internal override {
        (
            string memory assetSymbol,
            uint256 date,
            uint256 price
        ) = _decodeProvidedParams(_params);
        if (block.timestamp < date) {
            revert InvalidSubmissionDate(date);
        }

        bytes memory requestId = _requestId(assetSymbol, date);

        if (!requestExists(requestId)) {
            revert DataNotRequested();
        }

        if (dataExists(requestId) && _mode == ProvisionMode.create) {
            revert DataAlreadyProvided();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId].provided = abi.encode(price);

        emit DataProvided(
            msg.sender,
            namespace(),
            requestId,
            d.dataRequest[requestId].provided
        );
    }

    function _requestId(
        string memory assetSymbol,
        uint256 date
    ) internal pure returns (bytes memory) {
        return abi.encode(namespace(), assetSymbol, date);
    }

    function _decodeRequestedParams(
        bytes calldata _params
    ) internal pure returns (string memory, uint256) {
        return abi.decode(_params, (string, uint256));
    }

    function _decodeProvidedParams(
        bytes calldata _params
    ) internal pure returns (string memory, uint256, uint256) {
        return abi.decode(_params, (string, uint256, uint256));
    }

    function _requestIdFromParams(
        bytes calldata _params
    ) internal pure virtual override returns (bytes memory) {
        (string memory assetSymbol, uint256 date) = _decodeRequestedParams(
            _params
        );
        return _requestId(assetSymbol, date);
    }

    function namespace() public pure override returns (string memory) {
        return "asset-price";
    }
}
