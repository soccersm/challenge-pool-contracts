// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunityFacet.sol";
import "../../libraries/LibData.sol";
import "../../utils/CommunityFacetHelpers.sol";
import "../../utils/Helpers.sol";
import "../interfaces/SoccersmRoles.sol";
import "../../interfaces/IChallengePoolCommon.sol";
import "../../utils/ChallengePoolHelpers.sol";

contract CommunityFacet is
    ICommunityFacet,
    CommunityFacetHelpers,
    Helpers,
    SoccersmRoles,
    IChallengePoolCommon,
    ChallengePoolHelpers
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
        for (uint i = 0; i < adminLength; i++) {
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

    function transferCommunityOwner(
        uint256 _communityId,
        address _owner
    )
        external
        override
        onlyCommunityOwner(_communityId)
        positiveAddress(_owner)
        communityExists(_communityId)
        isCommunityMember(_communityId, _owner)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunityFacet.Community storage community = s.communities[
            _communityId
        ];
        require(_owner != msg.sender, "Cannot transfer to current owner");
        community.owner = _owner;
        emit CommunityOwnerTransferred(_communityId, msg.sender, _owner);
    }

    function evaluateCustomChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external override poolInState(_challengeId, ChallengeState.matured){
        CommunityStore storage cs = CommunityStorage.load();
        CPStore storage s = CPStorage.load();
        IChallengePool.Challenge storage challenge = s.challenges[_challengeId];
        uint256 communityId = challenge.communityId;
        ICommunityFacet.Community storage community = cs.communities[
            communityId
        ];
        if (challenge.cType != ChallengeType.custom) {
            revert CustomChallengeRequiresCommunity();
        }
        if (community.owner == address(0)) {
            revert CommunityDoesNotExist(communityId);
        }
        if (community.banned) {
            revert CommunityIsBanned();
        }
        bool isAdmin = false;
        for (uint i = 0; i < community.admins.length; i++) {
            if (msg.sender == community.admins[i]) {
                isAdmin = true;
                break;
            }
        }
        if (!isAdmin) {
            revert ICommunityFacet.NotCommunityAdmin();
        }
        challenge.outcome = _results;
        challenge.lastOutcomeSet = block.timestamp; 
        challenge.state = ChallengeState.evaluated;
        emit EvaluateCommunityChallenge(_challengeId, msg.sender, ChallengeState.evaluated, _results);
    }
}
