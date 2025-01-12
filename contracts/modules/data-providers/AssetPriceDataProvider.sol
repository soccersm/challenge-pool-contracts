// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseProvider.sol";

contract AssetPriceDataProvider is BaseProvider {
    function _requestId(
        string memory assetSymbol,
        uint256 date
    ) internal pure returns (bytes memory) {
        return abi.encode(namspace(), assetSymbol, date);
    }
    function _decodeParams(
        bytes calldata _params
    ) internal pure returns (string memory, uint256) {
        return abi.decode(_params, (string, uint256));
    }
    function requestData(
        bytes calldata _params
    ) external override returns (bool) {
        (string memory assetSymbol, uint256 date) = _decodeParams(_params);

        bytes memory requestId = _requestId(assetSymbol, date);

        if (requestExists(requestId)) {
            return true;
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId] = DataRequest(_params, emptyBytes, false);

        emit DataRequested(msg.sender, namspace(), requestId, _params);
        return true;
    }

    function provideData(bytes calldata _params) external override {
        (string memory assetSymbol, uint256 date) = _decodeParams(_params);
        if (block.timestamp < date) {
            revert InvalidSubmissionDate(date);
        }

        bytes memory requestId = _requestId(assetSymbol, date);

        if (!requestExists(requestId)) {
            revert DataNotRequested();
        }

        if (dataExists(requestId)) {
            revert DataAlreadyProvided();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId].provided = _params;

        emit DataProvided(msg.sender, namspace(), requestId, _params);
    }

    function updateProvision(bytes calldata _params) external override {
        (string memory assetSymbol, uint256 date) = _decodeParams(_params);
        if (block.timestamp < date) {
            revert InvalidSubmissionDate(date);
        }

        bytes memory requestId = _requestId(assetSymbol, date);

        if (!requestExists(requestId)) {
            revert DataNotRequested();
        }

        if (!dataExists(requestId)) {
            revert DataNotProvided();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId].provided = _params;

        emit DataProvided(msg.sender, namspace(), requestId, _params);
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        (string memory assetSymbol, uint256 date) = _decodeParams(_params);
        bytes memory requestId = _requestId(assetSymbol, date);
        if (!dataExists(requestId)) {
            revert DataNotProvided();
        }
        DPStore storage d = DPStorage.load();

        return d.dataRequest[requestId].provided;
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        (string memory assetSymbol, uint256 date) = _decodeParams(_params);
        bytes memory requestId = _requestId(assetSymbol, date);
        return dataExists(requestId);
    }

    function namspace() public pure override returns (string memory) {
        return "asset-price";
    }
}
