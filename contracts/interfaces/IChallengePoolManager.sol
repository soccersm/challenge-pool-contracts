// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


interface IChallengePoolManager {
    event StakeTokenAdded(address indexed token, bool active);
    
    function setFeeAddress(address _feeAddress) external;

    function setMinMaturityPeriod(uint256 _minMaturity) external;

    function setCreatePoolFee(uint256 _poolFee) external;

    function setStakeFee(uint256 _poolFee) external;

    function setEarlyWithdrawFee(uint256 _poolFee) external;

    function setMaxOptionsPerPool(uint256 _maxPoolEvents) external;

    function setMaxEventsPerPool(uint256 _maxPoolEvents) external;

    function setMinStakeAmount(uint256 _minStakeAmount) external;

    function addStakeToken(address _stakeToken) external;

    function removeStakeToken(address _stakeToken) external;
}
