// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";

library LibPrice {
    function computeOptionPrice(
        uint256 _basePrice,
        uint256 _poolSupply,
        uint256 _optionSupply,
        uint256 _timeToMaturity,
        uint256 _quantity
    ) internal pure returns (uint256) {}

    // @dev computes fraction of [value] in [bps]
    // 100 bps is equivalent to 1%
    function basisPoint(
        uint256 value,
        uint256 bps
    ) internal pure returns (uint256) {
        require((value * bps) >= 10_000);
        return Math.mulDiv(value, bps, 10_000);
    }

    function simplePrice(
        uint256 _basePrice
    ) internal pure returns (uint256) {
        return _basePrice;
    }
}
