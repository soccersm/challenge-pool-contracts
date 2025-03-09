// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../libraries/LibData.sol";
import "hardhat/console.sol";

contract ChallengePoolInit {
    function init() external {
        CPStore storage s = CPStorage.load();
        s.challengeId = 0;
        s.stakeFee = 300;
        s.earlyWithdrawFee = 100;
        s.createPoolFee = 500;
        s.minStakeAmount = 1e18;
        s.maxOptionsPerPool = 100;
        s.maxEventsPerPool = 100;
        s.minMaturityPeriod = 1 hours;
        s.feeAddress = msg.sender;
        s.disputePeriod = 1 hours;
        s.disputeStake = 5e18;
        AirDropStore storage a = AirDropStorage.load();
        a.stakeAirDrop = 5e18;
        a.paymaster = address(0);
        a.maxClaim = 2;
        a.minPoolMaturity = 7 days;
    }
}
