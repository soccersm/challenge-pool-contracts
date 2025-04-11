// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibData.sol"; 
import "../interfaces/IStakeAirDropInitView.sol";
contract StakeAirDropInitView is IStakeAirDropInitView {

    function getAirDropStore() external view returns (
        uint256 stakeAirDrop,
        address paymaster,
        uint256 maxClaim,
        uint256 minPoolMaturity
    ) {
        AirDropStore storage s = AirDropStorage.load();
        return (s.stakeAirDrop, s.paymaster, s.maxClaim, s.minPoolMaturity);
    }

    function getStakeAirDrop() external view returns (uint256) {
        return AirDropStorage.load().stakeAirDrop;
    }

    function getPaymaster() external view returns (address) {
        return AirDropStorage.load().paymaster;
    }

    function getMaxClaim() external view returns (uint256) {
        return AirDropStorage.load().maxClaim;
    }

    function getMinPoolMaturity() external view returns (uint256) {
        return AirDropStorage.load().minPoolMaturity;
    }
}
