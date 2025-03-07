// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../libraries/LibData.sol";
contract StakeAirDropInit {
    function init(address _paymaster) external {
        AirDropStore storage a = AirDropStorage.load();
        a.stakeAirDrop = 5e18;
        a.paymaster = _paymaster;
        a.maxClaim = 2;
    }
}
