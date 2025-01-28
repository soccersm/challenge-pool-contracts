// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../interfaces/IDataProvider.sol";
import "../../libraries/LibData.sol";
import "../../utils/Helpers.sol";

import "../../utils/Errors.sol";

abstract contract BaseProvider is IDataProvider {
    enum ProvisionMode {
        create,
        update
    }
    function _requestIdFromParams(
        bytes calldata _params
    ) internal pure virtual returns (bytes32);
    function requestExists(
        bytes32 requestId
    ) internal view returns (bool) {
        DPStore storage d = DPStorage.load();
        bool requestEmpty = HelpersLib.compareBytes(
            d.dataRequest[requestId].requested,
            HelpersLib.emptyBytes
        );
        bool isRegister = d.dataRequest[requestId].register;
        return !requestEmpty && !isRegister;
    }

    function dataExists(bytes32 requestId) internal view returns (bool) {
        DPStore storage d = DPStorage.load();
        return
            !HelpersLib.compareBytes(
                d.dataRequest[requestId].provided,
                HelpersLib.emptyBytes
            );
    }

    function registerExists(
        bytes32 requestId
    ) internal view returns (bool) {
        DPStore storage d = DPStorage.load();
        return d.dataRequest[requestId].register;
    }

    function registerEvent(bytes calldata /*_params*/) external virtual {
        revert NotImplemented();
    }

    function validateOptions(
        bytes calldata /*_params*/,
        bytes[] calldata _options
    ) external virtual returns (bool) {
        return _options.length > 1;
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        bytes32 requestId = _requestIdFromParams(_params);
        if (!dataExists(requestId)) {
            revert DataNotProvided();
        }
        DPStore storage d = DPStorage.load();

        return d.dataRequest[requestId].provided;
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        return dataExists(_requestIdFromParams(_params));
    }

    function _provideData(
        bytes calldata _params,
        ProvisionMode _mode
    ) internal virtual;

    function provideData(bytes calldata _params) external override {
        _provideData(_params, ProvisionMode.create);
    }

    function updateProvision(bytes calldata _params) external override {
        _provideData(_params, ProvisionMode.update);
    }
}
