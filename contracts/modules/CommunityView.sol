// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/ICommunityView.sol";
import "../libraries/LibData.sol";
import "../utils/CommunityHelpers.sol";

contract CommunityView is ICommunityView {
    function getCommunity(
        bytes calldata _communityId
    ) external view override returns (ICommunity.Community memory) {
        return CommunityStorage.load().communities[keccak256(_communityId)];
    }

    function getIsAdmin(
        bytes calldata _communityId,
        address _admin
    ) external view override returns (bool) {
        return CommunityStorage.load().isAdmin[keccak256(_communityId)][_admin];
    }
    function getIsMember(
        bytes calldata _communityId,
        address _member
    ) external view override returns (bool) {
        return CommunityStorage.load().isMember[keccak256(_communityId)][_member];
    }

    function getBanStatus(
        bytes calldata _communityId
    ) external view returns (bool) {
        return CommunityStorage.load().communities[keccak256(_communityId)].banned;
    }

    function getMembersCount(
        bytes calldata _communityId
    ) external view override returns (uint256) {
        return CommunityStorage.load().communities[keccak256(_communityId)].memberCount;
    }

    function getOwnerAddress(
        bytes calldata _communityId
    ) external view returns (address) {
        return CommunityStorage.load().communities[keccak256(_communityId)].owner;
    }

    function getPendingOwnerAddress(
        bytes calldata _communityId
    ) external view returns (address) {
        return CommunityStorage.load().communities[keccak256(_communityId)].pendingOwner;
    }
}
