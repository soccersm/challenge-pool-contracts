// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IChallengePool.sol";
import "../libraries/LibData.sol";
library LibPrice {
    function _computeStakeFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return HelpersLib.basisPoint(_stakePrice, CPStorage.load().stakeFee);
    }

    function _computeCreateFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return
            HelpersLib.basisPoint(_stakePrice, CPStorage.load().createPoolFee);
    }

    function _computeEarlyWithdrawFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return
            HelpersLib.basisPoint(
                _stakePrice,
                CPStorage.load().earlyWithdrawFee
            );
    }

    function _rewardPoints(
        uint256 _stakes,
        uint256 _createdAt,
        uint256 _maturity
    ) internal view returns (uint256) {
        if (block.timestamp == _createdAt) {
            return HelpersLib.maxRewardPoint;
        }
        return
            Math.mulDiv(
                HelpersLib.maxRewardPoint,
                _maturity - block.timestamp,
                _maturity - _createdAt
            ) * _stakes;
    }

    function _penalty(
        uint256 _price,
        uint256 _createdAt,
        uint256 _maturity
    ) internal view returns (uint256) {
        if (_maturity >= block.timestamp) {
            return _price;
        }
        return
            Math.mulDiv(
                _price,
                _maturity - block.timestamp,
                _maturity - _createdAt
            );
    }

    function _computeWinnerShare(
        uint256 _challengeId,
        uint256 stakes
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        uint256 winnerStakes = s.optionSupply[_challengeId][keccak256(c.outcome)].stakes;
        uint256 winnerTokens = s.optionSupply[_challengeId][keccak256(c.outcome)].tokens;
        uint256 looserTokens = s.poolSupply[_challengeId].tokens - winnerTokens;
        return Math.mulDiv(looserTokens, stakes, winnerStakes);
    }
}
