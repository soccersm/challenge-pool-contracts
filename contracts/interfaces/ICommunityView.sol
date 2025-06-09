// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";

interface ICommunityView {
    function getCommunity(
        bytes calldata _communityId
    ) external view returns (ICommunity.Community memory);

    function getIsAdmin(
        bytes calldata _communityId,
        address _admin
    ) external view returns (bool);

    function getIsMember(
        bytes calldata _communityId,
        address _member
    ) external view returns (bool);

    function getBanStatus(
        bytes calldata _communityId
    ) external view returns (bool);

    function getMembersCount(
        bytes calldata _communityId
    ) external view returns (uint256);

    function getOwnerAddress(
        bytes calldata _communityId
    ) external view returns (address);

    function getPendingOwnerAddress(
        bytes calldata _communityId
    ) external view returns (address);
}
