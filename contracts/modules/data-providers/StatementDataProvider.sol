// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseProvider.sol";

contract StatementDataProvider is BaseProvider {
    function requestData(
        bytes calldata _params
    ) external override returns (bool) {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeRequestedParams(_params);

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

        emit DataRequested(msg.sender, namespace(), requestId, _params);
        return true;
    }

    function _provideData(
        bytes calldata _params,
        ProvisionMode _mode
    ) internal override {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity,
            bytes memory answer
        ) = _decodeProvidedParams(_params);

        if (block.timestamp < maturity) {
            revert InvalidSubmissionDate(maturity);
        }

        bytes memory requestId = _requestId(statementId, statement, maturity);

        if (!requestExists(requestId)) {
            revert DataNotRequested();
        }

        if (dataExists(requestId) && _mode == ProvisionMode.create) {
            revert DataAlreadyProvided();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId].provided = abi.encode(answer);

        emit DataProvided(msg.sender, namespace(), requestId, _params);
    }

    function registerEvent(bytes calldata _params) external override {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity,
            bytes[] memory options
        ) = abi.decode(_params, (string, string, uint256, bytes[]));
        if (block.timestamp >= maturity) {
            revert InvalidSubmissionDate(maturity);
        }

        bytes memory requestId = _requestId(statementId, statement, maturity);

        if (requestExists(requestId)) {
            revert DataAlreadyRegistered();
        }

        if (options.length < 2) {
            revert InvalidOptionsLength();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId] = DataRequest(_params, emptyBytes, true);

        for (uint256 i = 0; i < options.length; i++) {
            d.requestOptions[requestId][options[i]] = true;
        }

        emit DataRegistered(msg.sender, namespace(), requestId, _params);
    }

    function validateOptions(
        bytes calldata _params,
        bytes[] calldata _options
    ) external view override returns (bool) {
        bytes memory requestId = _requestIdFromParams(_params);
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

    function _requestId(
        string memory statementId,
        string memory statement,
        uint256 maturity
    ) internal pure returns (bytes memory) {
        return abi.encode(namespace(), statementId, statement, maturity);
    }

    function _decodeRequestedParams(
        bytes calldata _params
    ) internal pure returns (string memory, string memory, uint256) {
        return abi.decode(_params, (string, string, uint256));
    }

    function _decodeProvidedParams(
        bytes calldata _params
    )
        internal
        pure
        returns (string memory, string memory, uint256, bytes memory)
    {
        return abi.decode(_params, (string, string, uint256, bytes));
    }

    function _requestIdFromParams(
        bytes calldata _params
    ) internal pure virtual override returns (bytes memory) {
        (
            string memory statementId,
            string memory statement,
            uint256 maturity
        ) = _decodeRequestedParams(_params);

        return _requestId(statementId, statement, maturity);
    }

    function namespace() public pure override returns (string memory) {
        return "statement";
    }
}
