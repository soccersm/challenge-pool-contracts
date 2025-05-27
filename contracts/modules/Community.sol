// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";
import "../libraries/LibData.sol";
import "../utils/CommunityHelpers.sol";
import "../utils/Helpers.sol";
import "../diamond/interfaces/SoccersmRoles.sol";
import "../interfaces/IChallengePoolCommon.sol";
import "../utils/ChallengePoolHelpers.sol";

contract Community is
    ICommunity,
    CommunityHelpers,
    Helpers,
    SoccersmRoles,
    IChallengePoolCommon,
    ChallengePoolHelpers
{
    function createCommunity(
        string calldata _communityId
    ) external override nonEmptyString(_communityId) {
        CommunityStore storage s = CommunityStorage.load();
        if (bytes(s.communities[_communityId].communityId).length > 0) {
            revert CommunityAlreadyExists();
        }
        s.communities[_communityId] = ICommunity.Community({
            communityId: _communityId,
            owner: msg.sender,
            admins: new address[](0),
            memberCount: 1,
            banned: false
        });
        s.isMember[_communityId][msg.sender] = true;
        emit NewCommunity(_communityId, msg.sender, block.timestamp);
    }

    function addCommunityAdmin(
        string calldata _communityId,
        address _admin
    )
        external
        override
        positiveAddress(_admin)
        communityExists(_communityId)
        notBanned(_communityId)
        communityOwnerOrAdmin(_communityId)
        isCommunityMember(_communityId, _admin)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        if (s.isAdmin[_communityId][_admin]) {
            revert ICommunity.AlreadyCommunityAdmin(_communityId, _admin);
        }
        s.isAdmin[_communityId][_admin] = true;
        community.admins.push(_admin);
        emit AdminAdded(_communityId, msg.sender, _admin);
    }

    function removeCommunityAdmin(
        string calldata _communityId,
        address _admin
    )
        external
        override
        positiveAddress(_admin)
        communityExists(_communityId)
        notBanned(_communityId)
        communityOwnerOrAdmin(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        if (!s.isAdmin[_communityId][_admin]) {
            revert MustBeCommunityAdmin();
        }
        s.isAdmin[_communityId][_admin] == false;
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
        string calldata _communityId
    )
        external
        override
        onlySoccersmCouncil
        communityExists(_communityId)
        notBanned(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[
            _communityId
        ];
        community.banned = true;
        emit CommunityBanned(_communityId, msg.sender);
    }

    function joinCommunity(
        string calldata _communityId
    ) external override communityExists(_communityId) notBanned(_communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[
            _communityId
        ];
        if(s.isMember[_communityId][msg.sender]){
            revert AlreadyCommunityMember(); 
        }
        s.isMember[_communityId][msg.sender] = true;
        community.memberCount += 1;
        emit MemberJoined(_communityId, msg.sender, block.timestamp);
    }

    function removeCommunityMember(
        string calldata _communityId,
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
        ICommunity.Community storage community = s.communities[
            _communityId
        ];
        s.isMember[_communityId][_user] = false;
        if (community.memberCount > 0) {
            community.memberCount -= 1;
        }
        emit MemberRemoved(_communityId, _user);
    }

    function transferCommunityOwner(
        string calldata _communityId,
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
        ICommunity.Community storage community = s.communities[
            _communityId
        ];
        require(_owner != msg.sender, "Cannot transfer to current owner");
        community.owner = _owner;
        emit CommunityOwnerTransferred(_communityId, msg.sender, _owner);
    }

    function evaluateCustomChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external override poolInState(_challengeId, ChallengeState.matured) {
        CommunityStore storage cs = CommunityStorage.load();
        CPStore storage s = CPStorage.load();
        IChallengePool.Challenge storage challenge = s.challenges[_challengeId];
        string memory communityId = challenge.communityId;
        ICommunity.Community storage community = cs.communities[
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
        
        if (!cs.isAdmin[communityId][msg.sender]) {
            revert NotCommunityAdmin();
        }
        challenge.outcome = _results;
        challenge.lastOutcomeSet = block.timestamp;
        challenge.state = ChallengeState.evaluated;
        emit EvaluateCommunityChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.evaluated,
            _results
        );
    }
}
