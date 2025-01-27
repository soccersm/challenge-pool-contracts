// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IChallengePool.sol";

library LibPrice {
    function computeOptionPrice(
        uint256 _basePrice,
        uint256 _poolSupply,
        uint256 _optionSupply,
        uint256 _timeToMaturity,
        uint256 _quantity,
        IChallengePool.PoolAction _action
    ) internal pure returns (uint256) {}

    function simplePrice(
        uint256 _basePrice
    ) internal pure returns (uint256) {
        return _basePrice;
    }
}
