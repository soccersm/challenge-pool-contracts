// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseProvider.sol";

contract StatementDataProvider is BaseProvider {
    function _requestId(
        string memory statementId,
        string memory statement,
        uint256 maturity
    ) internal pure returns (bytes memory) {
        return abi.encode(namspace(), statementId, statement, maturity);
    }
    function _decodeParams(
        bytes calldata _params
    ) internal pure returns (string memory, string memory, uint256) {
        return abi.decode(_params, (string, string, uint256));
    }
    function requestData(
        bytes calldata _params
    ) external override returns (bool) {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeParams(_params);

        if (block.timestamp > maturity) {
            revert InvalidSubmissionDate(maturity);
        }

        bytes memory requestId = _requestId(statementId, statement, maturity);

        if (!registerExists(requestId)) {
            revert DataNotRegistered();
        }

        if (requestExists(requestId)) {
            return true;
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId] = DataRequest(_params, emptyBytes, false);

        emit DataRequested(msg.sender, namspace(), requestId, _params);
        return true;
    }

    function provideData(bytes calldata _params) external override {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeParams(_params);

        if (block.timestamp < maturity) {
            revert InvalidSubmissionDate(maturity);
        }

        bytes memory requestId = _requestId(statementId, statement, maturity);

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
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeParams(_params);
        if (block.timestamp < maturity) {
            revert InvalidSubmissionDate(maturity);
        }
        bytes memory requestId = _requestId(statementId, statement, maturity);

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

    function registerEvent(bytes calldata _params) external override {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity,
            
        ) = abi.decode(_params, (string, string, uint256, bytes[]));
        if (block.timestamp >= maturity) {
            revert InvalidSubmissionDate(maturity);
        }

        bytes memory requestId = _requestId(statementId, statement, maturity);

        if (requestExists(requestId)) {
            revert DataAlreadyRegistered();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId] = DataRequest(_params, emptyBytes, true);

        emit DataRegistered(msg.sender, namspace(), requestId, _params);
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeParams(_params);

        bytes memory requestId = _requestId(statementId, statement, maturity);
        if (!dataExists(requestId)) {
            revert DataNotProvided();
        }
        DPStore storage d = DPStorage.load();

        return d.dataRequest[requestId].provided;
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeParams(_params);

        bytes memory requestId = _requestId(statementId, statement, maturity);
        return dataExists(requestId);
    }

    function validateOptions(
        bytes calldata _params,
        bytes[] calldata _options
    ) external view override returns (bool) {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeParams(_params);

        bytes memory requestId = _requestId(statementId, statement, maturity);
        DPStore storage d = DPStorage.load();
        if (!registerExists(requestId)) {
            revert DataNotRegistered();
        }
        for (uint256 i = 0; i < _options.length; i++) {
            if (!d.requestOptions[requestId][_options[i]]) {
                return false;
            }
        }
        return true;
    }

    function namspace() public pure override returns (string memory) {
        return "statement";
    }
}
