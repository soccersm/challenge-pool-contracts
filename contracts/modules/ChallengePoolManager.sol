// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@solidstate/contracts/security/reentrancy_guard/ReentrancyGuard.sol";
import "../libraries/LibData.sol";
import "../libraries/LibTransfer.sol";
import "../interfaces/IChallengePoolManager.sol";
import "../utils/Helpers.sol";
import "../diamond/interfaces/SoccersmRoles.sol";
contract ChallengePoolManager is
    IChallengePoolManager,
    SoccersmRoles,
    Helpers,
    ReentrancyGuard
{
    function setFeeAddress(
        address _feeAddress
    ) external override onlyPoolManager positiveAddress(_feeAddress) {
        address oldFeeAddress = CPStorage.load().feeAddress;
        CPStorage.load().feeAddress = _feeAddress;
        emit SetFeeAddress(msg.sender, oldFeeAddress, _feeAddress);
    }

    function setMinMaturityPeriod(
        uint256 _minMaturityPeriod
    ) external override onlyPoolManager nonZero(_minMaturityPeriod) {
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
    ) external override onlyPoolManager nonZero(_createPoolFee) {
        uint256 oldCreatePoolFee = CPStorage.load().createPoolFee;
        CPStorage.load().createPoolFee = _createPoolFee;
        emit SetCreatePoolFee(msg.sender, oldCreatePoolFee, _createPoolFee);
    }

    function setStakeFee(
        uint256 _stakeFee
    ) external override onlyPoolManager nonZero(_stakeFee) {
        uint256 oldStakeFee = CPStorage.load().stakeFee;
        CPStorage.load().stakeFee = _stakeFee;
        emit SetStakeFee(msg.sender, oldStakeFee, _stakeFee);
    }

    function setEarlyWithdrawFee(
        uint256 _earlyWithdrawFee
    ) external override onlyPoolManager nonZero(_earlyWithdrawFee) {
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
    ) external override onlyPoolManager nonZero(_maxOptionsPerPool) {
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
    ) external override onlyPoolManager nonZero(_maxEventsPerPool) {
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
    ) external override onlyPoolManager nonZero(_minStakeAmount) {
        uint256 oldMinStakeAmount = CPStorage.load().minStakeAmount;
        CPStorage.load().minStakeAmount = _minStakeAmount;
        emit SetMinStakeAmount(msg.sender, oldMinStakeAmount, _minStakeAmount);
    }

    function addStakeToken(
        address _stakeToken
    ) external override onlyPoolManager positiveAddress(_stakeToken) {
        CPStore storage c = CPStorage.load();
        require(!c.stakeTokens[_stakeToken].active, "stake token is active");
        c.stakeTokens[_stakeToken] = StakeToken(_stakeToken, 0, true);
        emit StakeTokenAdded(msg.sender, _stakeToken, true);
    }

    function removeStakeToken(
        address _stakeToken
    ) external override onlyPoolManager positiveAddress(_stakeToken) {
        CPStore storage c = CPStorage.load();
        StakeToken storage st = c.stakeTokens[_stakeToken];
        require(st.active, "stake token is not active");
        st.active = false;
        emit StakeTokenRemoved(msg.sender, _stakeToken, false);
    }

    function setDisputePeriod(
        uint256 _disputePeriod
    ) external override onlyPoolManager nonZero(_disputePeriod) {
        uint256 oldDisputePeriod = CPStorage.load().disputePeriod;
        CPStorage.load().disputePeriod = _disputePeriod;
        emit SetDisputePeriod(msg.sender, oldDisputePeriod, _disputePeriod);
    }

    function setDisputeStake(
        uint256 _disputeStake
    ) external override onlyPoolManager nonZero(_disputeStake) {
        uint256 oldDisputeStake = CPStorage.load().disputeStake;
        CPStorage.load().disputeStake = _disputeStake;
        emit SetDisputeStake(msg.sender, oldDisputeStake, _disputeStake);
    }

    function withdrawFee(
        address _stakeToken
    ) external override nonReentrant onlyAdmin {
        CPStore storage c = CPStorage.load();
        StakeToken storage st = c.stakeTokens[_stakeToken];
        require(st.accumulatedFee > 0, "no fee to extra");
        uint256 accumulatedFee = st.accumulatedFee;
        st.accumulatedFee = 0;
        LibTransfer._send(_stakeToken, accumulatedFee, msg.sender);
        emit FeeWithdrawn(msg.sender, _stakeToken, msg.sender, accumulatedFee);
    }

    function feeAddress() external view override returns (address) {
        return CPStorage.load().feeAddress;
    }

    function minMaturityPeriod() external view override returns (uint256) {
        return CPStorage.load().minMaturityPeriod;
    }

    function createPoolFee() external view override returns (uint256) {
        return CPStorage.load().createPoolFee;
    }

    function stakeFee() external view override returns (uint256) {
        return CPStorage.load().stakeFee;
    }

    function earlyWithdrawFee() external view override returns (uint256) {
        return CPStorage.load().earlyWithdrawFee;
    }

    function maxOptionsPerPool() external view override returns (uint256) {
        return CPStorage.load().maxOptionsPerPool;
    }

    function maxEventsPerPool() external view override returns (uint256) {
        return CPStorage.load().maxEventsPerPool;
    }

    function minStakeAmount() external view override returns (uint256) {
        return CPStorage.load().minStakeAmount;
    }

    function disputePeriod() external view override returns (uint256) {
        return CPStorage.load().disputePeriod;
    }

    function disputeStake() external view override returns (uint256) {
        return CPStorage.load().disputeStake;
    }

    function challengeId() external view override returns (uint256) {
        return CPStorage.load().challengeId;
    }

    function stakeToken(
        address _token
    ) external view override returns (StakeToken memory) {
        return CPStorage.load().stakeTokens[_token];
    }

    function setStakeAirDrop(
        uint256 _stakeAirDrop
    ) external override onlyPoolManager nonZero(_stakeAirDrop) {
        uint256 oldStakeAirDrop = AirDropStorage.load().stakeAirDrop;
        AirDropStorage.load().stakeAirDrop = _stakeAirDrop;
        emit SetStakeAirDrop(msg.sender, oldStakeAirDrop, _stakeAirDrop);
    }

    function setMaxClaim(
        uint256 _maxClaim
    ) external override onlyPoolManager nonZero(_maxClaim) {
        uint256 oldMaxClaim = AirDropStorage.load().maxClaim;
        AirDropStorage.load().maxClaim = _maxClaim;
        emit SetMaxClaim(msg.sender, oldMaxClaim, _maxClaim);
    }

    function setPaymaster(
        address _paymaster
    ) external override onlyPoolManager positiveAddress(_paymaster) {
        address oldPaymaster = AirDropStorage.load().paymaster;
        AirDropStorage.load().paymaster = _paymaster;
        emit SetPaymaster(msg.sender, oldPaymaster, _paymaster);
    }

    function setMinPoolMaturity(
        uint256 _minPoolMaturity
    ) external override onlyPoolManager {
        uint256 oldMinPoolMaturity = AirDropStorage.load().minPoolMaturity;
        AirDropStorage.load().minPoolMaturity = _minPoolMaturity;
        emit SetMaxClaim(msg.sender, oldMinPoolMaturity, _minPoolMaturity);
    }

    function setGelatoForwarder(
        address _gelatoForwarder
    ) external override onlyPoolManager positiveAddress(_gelatoForwarder) {
        address oldGelatoForwarder = CPStorage.load().gelatoTrustedForwarder;
        CPStorage.load().gelatoTrustedForwarder = _gelatoForwarder;
        emit SetGelatoForwarder(
            msg.sender,
            oldGelatoForwarder,
            _gelatoForwarder
        );
    }
}
