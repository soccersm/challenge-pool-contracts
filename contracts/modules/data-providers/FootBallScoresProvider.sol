// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseProvider.sol";

contract FootBallScoresProvider is BaseProvider {
    function requestData(
        bytes calldata _params
    ) external override returns (bool) {
        string memory matchId = _decodeRequestedParams(_params);

        bytes32 requestId = _requestId(matchId);

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
            string memory matchId,
            uint256 homeScore,
            uint256 awayScore
        ) = _decodeProvidedParams(_params);

        bytes32 requestId = _requestId(matchId);

        if (!requestExists(requestId)) {
            revert DataNotRequested();
        }

        if (dataExists(requestId) && _mode == ProvisionMode.create) {
            revert DataAlreadyProvided();
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId].provided = abi.encode(homeScore, awayScore);

        emit DataProvided(
            msg.sender,
            namespace(),
            requestId,
            d.dataRequest[requestId].provided
        );
    }

    function _requestId(
        string memory matchId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(namespace(), matchId));
    }

    function _decodeRequestedParams(
        bytes calldata _params
    ) internal pure returns (string memory) {
        return abi.decode(_params, (string));
    }

    function _decodeProvidedParams(
        bytes calldata _params
    ) internal pure returns (string memory, uint256, uint256) {
        return abi.decode(_params, (string, uint256, uint256));
    }

    function _requestIdFromParams(
        bytes calldata _params
    ) internal pure virtual override returns (bytes32) {
        return _requestId(_decodeRequestedParams(_params));
    }

    function namespace() public pure override returns (string memory) {
        return "football-scores";
    }
}
