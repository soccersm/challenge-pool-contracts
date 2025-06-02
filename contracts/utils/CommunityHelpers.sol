// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";
import "../libraries/LibData.sol";

abstract contract CommunityHelpers {
    modifier communityNotBanned(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        if (community.banned) {
            revert ICommunity.CommunityIsBanned();
        }
        _;
    }

    modifier communityBanned(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        if (!community.banned) {
            revert ICommunity.CommunityNotBanned();
        }
        _;
    }

    modifier memberBanned(string calldata _communityId, address _user){
        CommunityStore storage s = CommunityStorage.load();
        if(s.isBanned[_communityId][_user]){
            revert ICommunity.UserIsBanned(_communityId, _user);
        }
        _;
    }

    modifier onlyCommunityOwner(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        if (msg.sender != s.communities[_communityId].owner) {
            revert ICommunity.NotCommunityOwner();
        }
        _;
    }

    modifier communityOwnerOrAdmin(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];

        if (msg.sender == community.owner) {
            _;
            return;
        }

        if (!s.isAdmin[_communityId][msg.sender]) {
            revert ICommunity.NotCommunityOwnerOrAdmin(
                _communityId,
                msg.sender
            );
        }
        _;
    }
    modifier onlyCommunityAdmin(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        if (!s.isAdmin[_communityId][msg.sender]) {
            revert ICommunity.NotCommunityAdmin();
        }
        _;
    }

    modifier onlyCommunityMember(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        if (!s.isMember[_communityId][msg.sender]) {
            revert ICommunity.NotCommunityMember();
        }
        _;
    }

    modifier isCommunityMember(string calldata _communityId, address _member) {
        CommunityStore storage s = CommunityStorage.load();
        if (!s.isMember[_communityId][_member]) {
            revert ICommunity.NotCommunityMember();
        }
        _;
    }

    modifier communityExists(string calldata _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        if (s.communities[_communityId].owner == address(0)) {
            revert ICommunity.CommunityDoesNotExist(_communityId);
        }
        _;
    }
}
