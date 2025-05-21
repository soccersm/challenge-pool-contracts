// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../diamond/interfaces/ICommunityFacet.sol";
import "../libraries/LibData.sol";

abstract contract CommunityFacetHelpers {
    modifier notBanned(uint256 _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        if (community.banned) {
            revert ICommunityFacet.CommunityIsBanned();
        }
        _;
    }

    modifier onlyCommunityOwner(uint256 _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        if (msg.sender != s.communities[_communityId].owner) {
            revert ICommunityFacet.NotCommunityOwner();
        }
        _;
    }

    modifier communityOwnerOrAdmin(uint256 _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];

        if (msg.sender == community.owner) {
            _;
            return;
        }

        bool isAdmin = false;
        for (uint256 i = 0; i < community.admins.length; i++) {
            if (msg.sender == community.admins[i]) {
                isAdmin = true;
                break;
            }
        }

        if (!isAdmin) {
            revert ICommunityFacet.NotCommunityOwnerOrAdmin(
                _communityId,
                msg.sender
            );
        }
        _;
    }
    modifier onlyCommunityAdmin(uint256 _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        bool isAdmin = false;
        for (uint256 i = 0; i < community.admins.length; i++) {
            if (msg.sender == community.admins[i]) {
                isAdmin = true;
                break;
            }
        }
        if (!isAdmin) {
            revert ICommunityFacet.NotCommunityAdmin();
        }
        _;
    }

    modifier onlyCommunityMember(uint256 _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        if (!s.isMember[_communityId][msg.sender]) {
            revert ICommunityFacet.NotCommunityMember();
        }
        _;
    }

    modifier isCommunityMember(uint256 _communityId, address _member) {
        CommunityStore storage s = CommunityStorage.load();
        if (!s.isMember[_communityId][_member]) {
            revert ICommunityFacet.NotCommunityMember();
        }
        _;
    }

    modifier communityExists(uint256 _communityId) {
        CommunityStore storage s = CommunityStorage.load();
        if (s.communities[_communityId].owner == address(0)) {
            revert ICommunityFacet.CommunityDoesNotExist(_communityId);
        }
        _;
    }

    modifier isCommunityAdmin(uint256 _communityId, address _admin){
        CommunityStore storage s = CommunityStorage.load();
         ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        bool found = false;
        for (uint256 i = 0; i < community.admins.length; i++) {
            if (_admin == community.admins[i]) {
                found = true;
                break;
            }
        }
        if (!found) {
            revert ICommunityFacet.NotCommunityAdmin();
        }
        _;
    }

    modifier isNotCommunityAdmin(uint256 _communityId, address _admin){
        CommunityStore storage s = CommunityStorage.load();
         ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        for (uint256 i = 0; i < community.admins.length; i++) {
            if (_admin == community.admins[i]) {
                revert ICommunityFacet.AlreadyCommunityAdmin(_communityId, _admin);
                break;
            }
        }
        _;
    }
}
