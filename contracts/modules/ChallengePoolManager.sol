// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolManager.sol";
import "../utils/Helpers.sol";
import "../utils/Errors.sol";

contract ChallengePoolManager is IChallengePoolManager, Helpers {
    function setFeeAddress(
        address _feeAddress
    ) external override positiveAddress(_feeAddress) {
        CPStorage.load().feeAddress = _feeAddress;
    }

    function setMinMaturityPeriod(
        uint256 _minMaturityPeriod
    ) external override nonZero(_minMaturityPeriod) {
        CPStorage.load().minMaturityPeriod = _minMaturityPeriod;
    }

    function setCreatePoolFee(
        uint256 _createPoolFee
    ) external override nonZero(_createPoolFee) {
        CPStorage.load().createPoolFee = _createPoolFee;
    }

    function setStakeFee(
        uint256 _stakeFee
    ) external override nonZero(_stakeFee) {
        CPStorage.load().stakeFee = _stakeFee;
    }

    function setEarlyWithdrawFee(
        uint256 _earlyWithdrawFee
    ) external override nonZero(_earlyWithdrawFee) {
        CPStorage.load().earlyWithdrawFee = _earlyWithdrawFee;
    }

    function setMaxOptionsPerPool(
        uint256 _maxOptionsPerPool
    ) external override nonZero(_maxOptionsPerPool) {
        CPStorage.load().maxOptionsPerPool = _maxOptionsPerPool;
    }

    function setMaxEventsPerPool(
        uint256 _maxEventsPerPool
    ) external override nonZero(_maxEventsPerPool) {
        CPStorage.load().maxEventsPerPool = _maxEventsPerPool;
    }

    function setMinStakeAmount(
        uint256 _minStakeAmount
    ) external override nonZero(_minStakeAmount) {
        CPStorage.load().minStakeAmount = _minStakeAmount;
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
    }

    function removeStakeToken(
        address _stakeToken
    ) external override positiveAddress(_stakeToken) {
        CPStore storage c = CPStorage.load();
        StakeToken storage st = c.stakeTokens[_stakeToken];
        require(st.active == true, "stake token is not active");
        st.active = false;
    }

    function withdrawFee(address _stakeToken) external override {
        CPStore storage c = CPStorage.load();
        StakeToken storage st = c.stakeTokens[_stakeToken];
        require(st.accumulatedFee > 0, "no fee to extra");
        uint256 accumulatedFee = st.accumulatedFee;
        st.accumulatedFee = 0;
        _send(_stakeToken, accumulatedFee);
    }

    function _send(address _token, uint256 _amount) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(_token), msg.sender, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }
}
