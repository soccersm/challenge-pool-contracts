// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../libraries/LibData.sol";
contract ChallengePoolInit {
    function init(address _feeAddress) external {
        CPStore storage s = CPStorage.load();
        s.challengeId = 0;
        s.stakeFee = 30;
        s.earlyWithdrawFee = 10;
        s.createPoolFee = 50;
        s.minStakeAmount = 1e18;
        s.maxOptionsPerPool = 100;
        s.maxEventsPerPool = 100;
        s.minMaturityPeriod = 1 hours;
        s.feeAddress = _feeAddress;
        s.disputePeriod = 3 hours;
        s.disputeStake = 5e18;
    }
}
