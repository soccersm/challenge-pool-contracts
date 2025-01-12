// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../interfaces/IDataProvider.sol";
import "../../libraries/LibData.sol";
import "../../utils/Helpers.sol";

import "../../utils/Errors.sol";

abstract contract BaseProvider is IDataProvider, Helpers {
    function requestExists(bytes memory requestId) internal view returns (bool) {
        DPStore storage d = DPStorage.load();
        bool requestEmpty = compareBytes(
            d.dataRequest[requestId].requested,
            emptyBytes
        );
        bool isRegister = d.dataRequest[requestId].register;
        return !requestEmpty && !isRegister;
    }

    function dataExists(bytes memory requestId) internal view returns (bool) {
        DPStore storage d = DPStorage.load();
        return !compareBytes(
            d.dataRequest[requestId].provided,
            emptyBytes
        );
    }

    function registerExists(bytes memory requestId) internal view returns (bool) {
        DPStore storage d = DPStorage.load();
        return d.dataRequest[requestId].register;
    }

    function registerEvent(bytes calldata /*_params*/) external pure override {
        revert NotImplemented();
    }

    function validateOptions(
        bytes calldata /*_params*/,
        bytes[] calldata _options
    ) external pure override returns (bool) {
        return _options.length > 1;
    }
}
