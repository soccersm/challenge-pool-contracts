// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolManager.sol";

contract ChallengePoolManager is IChallengePoolManager {
    function setFeeAddress(address _feeAddress) external override {}

    function setMinMaturityPeriod(uint256 _minMaturity) external override {}

    function setCreatePoolFee(uint256 _poolFee) external override {}

    function setStakeFee(uint256 _poolFee) external override {}

    function setEarlyWithdrawFee(uint256 _poolFee) external override {}

    function setMaxOptionsPerPool(uint256 _maxPoolEvents) external override {}

    function setMaxEventsPerPool(uint256 _maxPoolEvents) external override {}

    function setMinStakeAmount(uint256 _minStakeAmount) external override {}

    function addStakeToken(address _stakeToken) external override {}

    function removeStakeToken(address _stakeToken) external override {}
}
