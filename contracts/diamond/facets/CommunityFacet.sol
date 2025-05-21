// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunityFacet.sol";
import "../../libraries/LibData.sol";
import "../../utils/CommunityFacetHelpers.sol";
import "../../utils/Helpers.sol";
import "../interfaces/SoccersmRoles.sol";

contract CommunityFacet is
    ICommunityFacet,
    CommunityFacetHelpers,
    Helpers,
    SoccersmRoles
{
    function createCommunity(
        string memory _name
    ) external override nonEmptyString(_name) {
        CommunityStore storage s = CommunityStorage.load();
        uint256 communityId = ++s.nextCommunityId;
        s.communities[communityId] = ICommunityFacet.Community(
            _name,
            msg.sender,
            new address[](0),
            1,
            false
        );
        s.isMember[communityId][msg.sender] = true;

        emit NewCommunity(communityId, msg.sender, block.timestamp, _name);
    }

    function addCommunityAdmin(
        uint256 _communityId,
        address _admin
    )
        external
        override
        positiveAddress(_admin)
        communityExists(_communityId)
        notBanned(_communityId)
        communityOwnerOrAdmin(_communityId)
        isCommunityMember(_communityId, _admin)
        isNotCommunityAdmin(_communityId, _admin)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        community.admins.push(_admin);
        community.memberCount += 1;

        emit AdminAdded(_communityId, msg.sender, _admin);
    }

    function removeCommunityAdmin(
        uint256 _communityId,
        address _admin
    )
        external
        override
        positiveAddress(_admin)
        communityExists(_communityId)
        notBanned(_communityId)
        communityOwnerOrAdmin(_communityId)
        isCommunityAdmin(_communityId, _admin)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        uint256 adminLength = community.admins.length;
        for (uint256 i = 0; i < adminLength; i++) {
            if (_admin == community.admins[i]) {
                community.admins[i] = community.admins[adminLength - 1];
                community.admins.pop();
                emit AdminRemoved(_communityId, msg.sender, _admin);
                break;
            }
        }
    }

    function banCommunity(
        uint256 _communityId
    )
        external
        override
        onlySoccersmCouncil
        communityExists(_communityId)
        notBanned(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        community.banned = true;
        emit CommunityBanned(_communityId, msg.sender);
    }

    function joinCommunity(
        uint256 _communityId
    ) external override communityExists(_communityId) notBanned(_communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        require(
            !s.isMember[_communityId][msg.sender],
            "Already a community member"
        );
        s.isMember[_communityId][msg.sender] = true;
        community.memberCount += 1;
        emit MemberJoined(_communityId, msg.sender, block.timestamp);
    }

    function removeCommunityMember(
        uint256 _communityId,
        address _user
    )
        external
        override
        positiveAddress(_user)
        communityExists(_communityId)
        notBanned(_communityId)
        isCommunityMember(_communityId, _user)
        communityOwnerOrAdmin(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        s.isMember[_communityId][_user] = false;
        if (community.memberCount > 0) {
            community.memberCount -= 1;
        }
        emit MemberRemoved(_communityId, _user);
    }
}
