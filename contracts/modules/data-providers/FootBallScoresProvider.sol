// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseProvider.sol";

contract FootBallScoresProvider is BaseProvider {
    function _requestId(
        string memory matchId
    ) internal pure returns (bytes memory) {
        return abi.encode(namspace(), matchId);
    }
    function _decodeParams(
        bytes calldata _params
    ) internal pure returns (string memory) {
        return abi.decode(_params, (string));
    }
    function requestData(
        bytes calldata _params
    ) external override returns (bool) {
        string memory matchId = _decodeParams(_params);

        bytes memory requestId = _requestId(matchId);

        if (requestExists(requestId)) {
            return true;
        }

        DPStore storage d = DPStorage.load();

        d.dataRequest[requestId] = DataRequest(_params, emptyBytes, false);

        emit DataRequested(msg.sender, namspace(), requestId, _params);
        return true;
    }

    function provideData(bytes calldata _params) external override {
        string memory matchId = _decodeParams(_params);

        bytes memory requestId = _requestId(matchId);

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
        string memory matchId = _decodeParams(_params);

        bytes memory requestId = _requestId(matchId);

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
        string memory matchId = _decodeParams(_params);

        bytes memory requestId = _requestId(matchId);
        if (!dataExists(requestId)) {
            revert DataNotProvided();
        }
        DPStore storage d = DPStorage.load();

        return d.dataRequest[requestId].provided;
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        string memory matchId = _decodeParams(_params);

        bytes memory requestId = _requestId(matchId);
        return dataExists(requestId);
    }

    function namspace() public pure override returns (string memory) {
        return "football-scores";
    }
}
