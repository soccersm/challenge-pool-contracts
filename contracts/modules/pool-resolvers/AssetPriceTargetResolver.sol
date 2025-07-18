// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";
contract AssetPriceTargetResolver is BaseResolver {

    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) external override returns (bool) {
        (
            string memory assetSymbol,
            uint256 predictedPrice,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, string));
        if (
            !HelpersLib.compareStrings(outcome, HelpersLib.ABOVE) && !HelpersLib.compareStrings(outcome, HelpersLib.BELOW)
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
        IChallengePoolHandler.ChallengeEvent calldata _event,
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
        if (HelpersLib.compareStrings(outcome, HelpersLib.ABOVE)) {
            if (actualPrice > predictedPrice) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.BELOW)) {
            if (actualPrice < predictedPrice) {
                return HelpersLib.yes;
            }
        } else {
            revert ProtocolInvariantCheckFailed();
        }
        return HelpersLib.no;
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent calldata /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
