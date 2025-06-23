// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";

interface ICommunityView {
    function getCommunity(
        bytes32 _communityId
    ) external view returns (ICommunity.Community memory);

    function getIsAdmin(
        bytes32 _communityId,
        address _admin
    ) external view returns (bool);

    function getIsMember(
        bytes32 _communityId,
        address _member
    ) external view returns (bool);

    function getBanStatus(
        bytes32 _communityId
    ) external view returns (bool);

    function getMembersCount(
        bytes32 _communityId
    ) external view returns (uint256);

    function getOwnerAddress(
        bytes32 _communityId
    ) external view returns (address);

    function getPendingOwnerAddress(
        bytes32 _communityId
    ) external view returns (address);
}
