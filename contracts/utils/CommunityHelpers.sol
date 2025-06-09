// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";
import "../libraries/LibData.sol";

abstract contract CommunityHelpers {
    modifier communityNotBanned(bytes calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[keccak256(_communityId)];
        if (community.banned) {
            revert ICommunity.CommunityIsBanned();
        }
        _;
    }

    modifier communityBanned(bytes calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[keccak256(_communityId)];
        if (!community.banned) {
            revert ICommunity.CommunityNotBanned();
        }
        _;
    }

    modifier onlyCommunityOwner(bytes calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[keccak256(_communityId)];
        if (msg.sender != s.communities[keccak256(_communityId)].owner) {
            revert ICommunity.NotCommunityOwner();
        }
        _;
    }

    modifier communityOwnerOrAdmin(bytes calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[keccak256(_communityId)];

        if (msg.sender == community.owner) {
            _;
            return;
        }

        if (!s.isAdmin[keccak256(_communityId)][msg.sender]) {
            revert ICommunity.NotCommunityOwnerOrAdmin(
                _communityId,
                msg.sender
            );
        }
        _;
    }

    modifier isCommunityMember(bytes calldata _communityId, address _member) {
        CommunityStore storage s = CommunityStorage.load();
        if (!s.isMember[keccak256(_communityId)][_member]) {
            revert ICommunity.NotCommunityMember();
        }
        _;
    }

    modifier communityExists(bytes calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        if (s.communities[keccak256(_communityId)].owner == address(0)) {
            revert ICommunity.CommunityDoesNotExist(_communityId);
        }
        _;
    }
}
