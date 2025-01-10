// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


interface IChallengePoolManager {
    struct StakeToken {
        address token;
        uint256 accumulatedFee;
        bool active;
    }

    event StakeTokenAdded(address indexed caller, address indexed token, bool active);
    event StakeTokenRemoved(address indexed caller,address indexed token, bool active);
    event FeeWithdrawn(address indexed caller,address indexed token, address to, uint256 amount);
    event SetFeeAddress(address indexed caller, address oldFeeAddress, address newFeeAddress);
    event SetMinMaturityPeriod(address indexed caller, uint256 oldMinMaturityPeriod, uint256 newMinMaturityPeriod);
    event SetCreatePoolFee(address indexed caller, uint256 oldCreatePoolFee, uint256 newCreatePoolFee);
    event SetStakeFee(address indexed caller, uint256 oldStakeFee, uint256 newStakeFee);
    event SetEarlyWithdrawFee(address indexed caller, uint256 oldEarlyWithdrawFee, uint256 newEarlyWithdrawFee);
    event SetMaxOptionsPerPool(address indexed caller, uint256 oldMaxOptionsPerPool, uint256 newMaxOptionsPerPool);
    event SetMaxEventsPerPool(address indexed caller, uint256 oldMaxEventsPerPool, uint256 newMaxEventsPerPool);
    event SetMinStakeAmount(address indexed caller, uint256 oldMinStakeAmount, uint256 newMinStakeAmount);

    
    function setFeeAddress(address _feeAddress) external;

    function setMinMaturityPeriod(uint256 _minMaturityPeriod) external;

    function setCreatePoolFee(uint256 _createPoolFee) external;

    function setStakeFee(uint256 _stakeFee) external;

    function setEarlyWithdrawFee(uint256 _earlyWithdrawFee) external;

    function setMaxOptionsPerPool(uint256 _maxOptionsPerPool) external;

    function setMaxEventsPerPool(uint256 _maxEventsPerPool) external;

    function setMinStakeAmount(uint256 _minStakeAmount) external;

    function addStakeToken(address _stakeToken) external;

    function removeStakeToken(address _stakeToken) external;

    function withdrawFee(address _stakeToken) external;
}
