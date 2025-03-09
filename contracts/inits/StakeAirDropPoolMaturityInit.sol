// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../libraries/LibData.sol";
contract StakeAirDropPoolMaturityInit {
    function init() external {
        AirDropStore storage a = AirDropStorage.load();
        a.minPoolMaturity = 7 days;
    }
}
