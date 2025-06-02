// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";

interface ICommunityView {
    function getCommunity(
        string calldata _communityId
    ) external view returns (ICommunity.Community memory);

    function getIsAdmin(
        string calldata _communityId,
        address _admin
    ) external view returns (bool);

    function getIsMember(
        string calldata _communityId,
        address _member
    ) external view returns (bool);

    function getBanStatus(
        string calldata _communityId
    ) external view returns (bool);

    function getMembersCount(
        string calldata _communityId
    ) external view returns (uint256);

    function getOwnerAddress(
        string calldata _communityId
    ) external view returns (address);
}
