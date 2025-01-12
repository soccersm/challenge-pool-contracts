// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract AssetPriceBoundedResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePool.ChallengeEvent memory _event
    ) external override returns (bool) {
        (
            string memory assetSymbol,
            uint256 priceLowerBound,
            uint256 priceUpperBound,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, uint256, string));
        if (!compareStrings(outcome, IN) && !compareStrings(outcome, OUT)) {
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
        IChallengePool.ChallengeEvent memory _event,
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

        if (compareStrings(outcome, IN)) {
            if (
                assetPrice >= priceLowerBound && assetPrice <= priceUpperBound
            ) {
                return yes;
            }
        } else if (compareStrings(outcome, OUT)) {
            if (assetPrice < priceLowerBound || assetPrice > priceUpperBound) {
                return yes;
            }
        } else {
            revert ProtocolInvariantCheckFailed();
        }
        return no;
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePool.ChallengeEvent memory /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
