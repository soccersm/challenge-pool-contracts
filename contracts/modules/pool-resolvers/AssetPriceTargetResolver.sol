// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";
import "hardhat/console.sol";
contract AssetPriceTargetResolver is BaseResolver {

    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event
    ) external override returns (bool) {
        console.log("AssetPriceTargetResolver");
        (
            string memory assetSymbol,
            uint256 predictedPrice,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, string));
        console.log("assetSymbol", assetSymbol);
        if (
            !compareStrings(outcome, ABOVE) && !compareStrings(outcome, BELOW)
        ) {
            return false;
        }
        if (predictedPrice < 1) {
            return false;
        }
        return
            _requestData(
                dataProvider,
                abi.encode(assetSymbol, _event.maturity)
            );
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent calldata _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        (
            string memory assetSymbol,
            uint256 predictedPrice,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, string));
        uint256 actualPrice = abi.decode(
            _getData(dataProvider, abi.encode(assetSymbol, _event.maturity)),
            (uint256)
        );
        if (compareStrings(outcome, ABOVE)) {
            if (actualPrice > predictedPrice) {
                return yes;
            }
        } else if (compareStrings(outcome, BELOW)) {
            if (actualPrice < predictedPrice) {
                return yes;
            }
        } else {
            revert ProtocolInvariantCheckFailed();
        }
        return no;
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePool.ChallengeEvent calldata /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
