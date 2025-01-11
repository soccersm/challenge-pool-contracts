// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/LibData.sol";
import "../libraries/LibTransfer.sol";
import "../interfaces/IChallengePoolManager.sol";
import "../utils/Helpers.sol";
import "../utils/Errors.sol";

contract ChallengePoolManager is IChallengePoolManager, Helpers {
    function setFeeAddress(
        address _feeAddress
    ) external override positiveAddress(_feeAddress) {
        address oldFeeAddress = CPStorage.load().feeAddress;
        CPStorage.load().feeAddress = _feeAddress;
        emit SetFeeAddress(msg.sender, oldFeeAddress, _feeAddress);
    }

    function setMinMaturityPeriod(
        uint256 _minMaturityPeriod
    ) external override nonZero(_minMaturityPeriod) {
        uint256 oldMinMaturityPeriod = CPStorage.load().minMaturityPeriod;
        CPStorage.load().minMaturityPeriod = _minMaturityPeriod;
        emit SetMinMaturityPeriod(
            msg.sender,
            oldMinMaturityPeriod,
            _minMaturityPeriod
        );
    }

    function setCreatePoolFee(
        uint256 _createPoolFee
    ) external override nonZero(_createPoolFee) {
        uint256 oldCreatePoolFee = CPStorage.load().createPoolFee;
        CPStorage.load().createPoolFee = _createPoolFee;
        emit SetCreatePoolFee(msg.sender, oldCreatePoolFee, _createPoolFee);
    }

    function setStakeFee(
        uint256 _stakeFee
    ) external override nonZero(_stakeFee) {
        uint256 oldStakeFee = CPStorage.load().stakeFee;
        CPStorage.load().stakeFee = _stakeFee;
        emit SetStakeFee(msg.sender, oldStakeFee, _stakeFee);
    }

    function setEarlyWithdrawFee(
        uint256 _earlyWithdrawFee
    ) external override nonZero(_earlyWithdrawFee) {
        uint256 oldEarlyWithdrawFee = CPStorage.load().earlyWithdrawFee;
        CPStorage.load().earlyWithdrawFee = _earlyWithdrawFee;
        emit SetEarlyWithdrawFee(
            msg.sender,
            oldEarlyWithdrawFee,
            _earlyWithdrawFee
        );
    }

    function setMaxOptionsPerPool(
        uint256 _maxOptionsPerPool
    ) external override nonZero(_maxOptionsPerPool) {
        uint256 oldMaxOptionsPerPool = CPStorage.load().maxOptionsPerPool;
        CPStorage.load().maxOptionsPerPool = _maxOptionsPerPool;
        emit SetMaxOptionsPerPool(
            msg.sender,
            oldMaxOptionsPerPool,
            _maxOptionsPerPool
        );
    }

    function setMaxEventsPerPool(
        uint256 _maxEventsPerPool
    ) external override nonZero(_maxEventsPerPool) {
        uint256 oldMaxEventsPerPool = CPStorage.load().maxEventsPerPool;
        CPStorage.load().maxEventsPerPool = _maxEventsPerPool;
        emit SetMaxEventsPerPool(
            msg.sender,
            oldMaxEventsPerPool,
            _maxEventsPerPool
        );
    }

    function setMinStakeAmount(
        uint256 _minStakeAmount
    ) external override nonZero(_minStakeAmount) {
        uint256 oldMinStakeAmount = CPStorage.load().minStakeAmount;
        CPStorage.load().minStakeAmount = _minStakeAmount;
        emit SetMinStakeAmount(msg.sender, oldMinStakeAmount, _minStakeAmount);
    }

    function addStakeToken(
        address _stakeToken
    ) external override positiveAddress(_stakeToken) {
        CPStore storage c = CPStorage.load();
        require(
            c.stakeTokens[_stakeToken].active == false,
            "stake token is active"
        );
        c.stakeTokens[_stakeToken] = StakeToken(_stakeToken, 0, true);
        emit StakeTokenAdded(msg.sender, _stakeToken, true);
    }

    function removeStakeToken(
        address _stakeToken
    ) external override positiveAddress(_stakeToken) {
        CPStore storage c = CPStorage.load();
        StakeToken storage st = c.stakeTokens[_stakeToken];
        require(st.active == true, "stake token is not active");
        st.active = false;
        emit StakeTokenRemoved(msg.sender, _stakeToken, false);
    }

    function withdrawFee(address _stakeToken) external override {
        CPStore storage c = CPStorage.load();
        StakeToken storage st = c.stakeTokens[_stakeToken];
        require(st.accumulatedFee > 0, "no fee to extra");
        uint256 accumulatedFee = st.accumulatedFee;
        st.accumulatedFee = 0;
        LibTransfer._send(_stakeToken, accumulatedFee, msg.sender);
        emit FeeWithdrawn(msg.sender, _stakeToken, msg.sender, accumulatedFee);
    }

    function setDisputePeriod(
        uint256 _disputePeriod
    ) external override nonZero(_disputePeriod) {
        uint256 oldDisputePeriod = CPStorage.load().disputePeriod;
        CPStorage.load().disputePeriod = _disputePeriod;
        emit SetDisputePeriod(msg.sender, oldDisputePeriod, _disputePeriod);
    }

    function setDisputeStake(
        uint256 _disputeStake
    ) external override nonZero(_disputeStake) {
        uint256 oldDisputeStake = CPStorage.load().disputeStake;
        CPStorage.load().disputeStake = _disputeStake;
        emit SetDisputeStake(msg.sender, oldDisputeStake, _disputeStake);
    }
}
