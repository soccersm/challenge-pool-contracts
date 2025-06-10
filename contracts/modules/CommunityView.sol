// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/ICommunityView.sol";
import "../libraries/LibData.sol";
import "../utils/CommunityHelpers.sol";

contract CommunityView is ICommunityView {
    function getCommunity(
        bytes32 _communityId
    ) external view override returns (ICommunity.Community memory) {
        return CommunityStorage.load().communities[_communityId];
    }

    function getIsAdmin(
        bytes32 _communityId,
        address _admin
    ) external view override returns (bool) {
        return CommunityStorage.load().isAdmin[_communityId][_admin];
    }
    function getIsMember(
        bytes32 _communityId,
        address _member
    ) external view override returns (bool) {
        return CommunityStorage.load().isMember[_communityId][_member];
    }

    function getBanStatus(
        bytes32 _communityId
    ) external view returns (bool) {
        return CommunityStorage.load().communities[_communityId].banned;
    }

    function getMembersCount(
        bytes32 _communityId
    ) external view override returns (uint256) {
        return CommunityStorage.load().communities[_communityId].memberCount;
    }

    function getOwnerAddress(
        bytes32 _communityId
    ) external view returns (address) {
        return CommunityStorage.load().communities[_communityId].owner;
    }

    function getPendingOwnerAddress(
        bytes32 _communityId
    ) external view returns (address) {
        return CommunityStorage.load().communities[_communityId].pendingOwner;
    }
}
