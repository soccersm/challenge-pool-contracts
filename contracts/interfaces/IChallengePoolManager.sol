// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IChallengePoolManager {
    struct StakeToken {
        address token;
        uint256 accumulatedFee;
        bool active;
    }

    event StakeTokenAdded(
        address  caller,
        address  token,
        bool active
    );
    event StakeTokenRemoved(
        address  caller,
        address  token,
        bool active
    );
    event FeeWithdrawn(
        address  caller,
        address  token,
        address to,
        uint256 amount
    );
    event SetFeeAddress(
        address  caller,
        address oldFeeAddress,
        address newFeeAddress
    );
    event SetMinMaturityPeriod(
        address  caller,
        uint256 oldMinMaturityPeriod,
        uint256 newMinMaturityPeriod
    );
    event SetCreatePoolFee(
        address  caller,
        uint256 oldCreatePoolFee,
        uint256 newCreatePoolFee
    );
    event SetStakeFee(
        address  caller,
        uint256 oldStakeFee,
        uint256 newStakeFee
    );
    event SetEarlyWithdrawFee(
        address  caller,
        uint256 oldEarlyWithdrawFee,
        uint256 newEarlyWithdrawFee
    );
    event SetMaxOptionsPerPool(
        address  caller,
        uint256 oldMaxOptionsPerPool,
        uint256 newMaxOptionsPerPool
    );
    event SetMaxEventsPerPool(
        address  caller,
        uint256 oldMaxEventsPerPool,
        uint256 newMaxEventsPerPool
    );
    event SetMinStakeAmount(
        address  caller,
        uint256 oldMinStakeAmount,
        uint256 newMinStakeAmount
    );
    event SetDisputePeriod(
        address  caller,
        uint256 oldDisputePeriod,
        uint256 newDisputePeriod
    );
    event SetDisputeStake(
        address  caller,
        uint256 oldDisputeStake,
        uint256 newDisputeStake
    );

    function setFeeAddress(address _feeAddress) external;

    function setMinMaturityPeriod(uint256 _minMaturityPeriod) external;

    function setCreatePoolFee(uint256 _createPoolFee) external;

    function setStakeFee(uint256 _stakeFee) external;

    function setEarlyWithdrawFee(uint256 _earlyWithdrawFee) external;

    function setMaxOptionsPerPool(uint256 _maxOptionsPerPool) external;

    function setMaxEventsPerPool(uint256 _maxEventsPerPool) external;

    function setMinStakeAmount(uint256 _minStakeAmount) external;

    function setDisputePeriod(uint256 _disputePeriod) external;

    function setDisputeStake(uint256 _disputeStake) external;

    function addStakeToken(address _stakeToken) external;

    function removeStakeToken(address _stakeToken) external;

    function withdrawFee(address _stakeToken) external;

    function feeAddress() external view returns (address);

    function minMaturityPeriod() external view returns (uint256);

    function createPoolFee() external view returns (uint256);

    function stakeFee() external view returns (uint256);

    function earlyWithdrawFee() external view returns (uint256);

    function maxOptionsPerPool() external view returns (uint256);

    function maxEventsPerPool() external view returns (uint256);

    function minStakeAmount() external view returns (uint256);

    function disputePeriod() external view returns (uint256);

    function disputeStake() external view returns (uint256);

    function challengeId() external view returns(uint256);

    function stakeToken(
        address _token
    ) external view returns (StakeToken memory);
}
