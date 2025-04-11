// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStakeAirDropInitView {

    function getAirDropStore() external view returns (
        uint256 stakeAirDrop,
        address paymaster,
        uint256 maxClaim,
        uint256 minPoolMaturity
    );

    function getStakeAirDrop() external view returns (uint256);

    function getPaymaster() external view returns (address);

    function getMaxClaim() external view returns (uint256);

    function getMinPoolMaturity() external view returns (uint256);
}
