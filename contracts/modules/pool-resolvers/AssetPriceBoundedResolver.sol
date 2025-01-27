// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";
contract AssetPriceBoundedResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) external override returns (bool) {
        (
            string memory assetSymbol,
            uint256 priceLowerBound,
            uint256 priceUpperBound,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, uint256, string));
        if (!HelpersLib.compareStrings(outcome, HelpersLib.IN) && !HelpersLib.compareStrings(outcome, HelpersLib.OUT)) {
            return false;
        }
        if (priceLowerBound >= priceUpperBound) {
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
            uint256 priceLowerBound,
            uint256 priceUpperBound,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, uint256, string));
        uint256 assetPrice = abi.decode(
            _getData(dataProvider, abi.encode(assetSymbol, _event.maturity)),
            (uint256)
        );
        if (HelpersLib.compareStrings(outcome, HelpersLib.IN)) {
            if (
                assetPrice >= priceLowerBound && assetPrice <= priceUpperBound
            ) {
                return HelpersLib.yes;
            }
        } else if (HelpersLib.compareStrings(outcome, HelpersLib.OUT)) {
            if (assetPrice < priceLowerBound || assetPrice > priceUpperBound) {
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
