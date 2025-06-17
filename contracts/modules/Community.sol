// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ICommunity.sol";
import "../libraries/LibData.sol";
import "../utils/CommunityHelpers.sol";
import "../utils/Helpers.sol";
import "../diamond/interfaces/SoccersmRoles.sol";
import "../interfaces/IChallengePoolCommon.sol";
import "../utils/ChallengePoolHelpers.sol";
import "../interfaces/IChallengePoolHandler.sol";

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
        bytes32 communityId = keccak256(bytes(_communityId));
        if (bytes(s.communities[communityId].communityId).length > 0) {
            revert CommunityAlreadyExists();
        }
        s.communities[communityId] = ICommunity.Community({
            communityId: _communityId,
            owner: msg.sender,
            pendingOwner: address(0),
            memberCount: 1,
            banned: false,
            tournamentId: bytes32(0)
        });
        s.isMember[communityId][msg.sender] = true;
        uint256 memberCount = s.communities[communityId].memberCount;
        bool bannedStatus = s.communities[communityId].banned;
        emit NewCommunity(
            _communityId,
            communityId,
            msg.sender,
            memberCount,
            bannedStatus,
            block.timestamp
        );
    }

    function addCommunityAdmin(
        bytes32 _communityId,
        address _admin
    )
        external
        override
        positiveAddress(_admin)
        communityExists(_communityId)
        communityNotBanned(_communityId)
        onlyCommunityOwner(_communityId)
        isCommunityMember(_communityId, _admin)
    {
        CommunityStore storage s = CommunityStorage.load();
        if (s.isAdmin[_communityId][_admin]) {
            revert ICommunity.AlreadyCommunityAdmin();
        }
        s.isAdmin[_communityId][_admin] = true;
        emit AdminAdded(_communityId, msg.sender, _admin);
    }

    function removeCommunityAdmin(
        bytes32 _communityId,
        address _admin
    )
        external
        override
        positiveAddress(_admin)
        communityExists(_communityId)
        communityNotBanned(_communityId)
        onlyCommunityOwner(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        if (!s.isAdmin[_communityId][_admin]) {
            revert MustBeCommunityAdmin();
        }
        delete s.isAdmin[_communityId][_admin];
        emit AdminRemoved(_communityId, msg.sender, _admin);
    }

    function banCommunity(
        bytes32 _communityId
    )
        external
        override
        onlySoccersmCouncil
        communityExists(_communityId)
        communityNotBanned(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        community.banned = true;
        emit CommunityBanned(_communityId, msg.sender, community.banned);
    }

    function unBanCommunity(
        bytes32 _communityId
    )
        external
        override
        onlySoccersmCouncil
        communityExists(_communityId)
        communityBanned(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        community.banned = false;
        emit CommunityUnBanned(_communityId, msg.sender, community.banned);
    }

    function banMember(
        bytes32 _communityId,
        address _user
    )
        external
        virtual
        override
        communityExists(_communityId)
        communityNotBanned(_communityId)
        positiveAddress(_user)
        communityOwnerOrAdmin(_communityId)
        isCommunityMember(_communityId, _user)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(_user != community.owner, "Cannot ban or unban owner");
        s.memberBanned[_communityId][_user] = true;
        if (s.isMember[_communityId][_user]) {
            s.isMember[_communityId][_user] = false;
            if (community.memberCount > 0) {
                community.memberCount -= 1;
            }
        }
        emit MemberIsBanned(
            _communityId,
            _user,
            community.memberCount,
            block.timestamp
        );
    }

    function unBanMember(
        bytes32 _communityId,
        address _user
    )
        external
        virtual
        override
        communityExists(_communityId)
        communityNotBanned(_communityId)
        positiveAddress(_user)
        communityOwnerOrAdmin(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(_user != community.owner, "Cannot ban or unban owner");
        require(s.memberBanned[_communityId][_user], "Member must be banned");
        s.memberBanned[_communityId][_user] = false;
        emit MemberUnbanned(_communityId, _user, block.timestamp);
    }

    function joinCommunity(
        bytes32 _communityId
    )
        external
        override
        communityExists(_communityId)
        communityNotBanned(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(!s.memberBanned[_communityId][msg.sender], "Member is banned");
        if (s.isMember[_communityId][msg.sender]) {
            revert AlreadyCommunityMember();
        }
        s.isMember[_communityId][msg.sender] = true;
        community.memberCount += 1;
        emit MemberJoined(
            _communityId,
            msg.sender,
            community.memberCount,
            block.timestamp
        );
    }

    function leaveCommunity(
        bytes32 _communityId
    )
        external
        override
        communityExists(_communityId)
        communityNotBanned(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(msg.sender != community.owner, "Owner cannot leave community");
        require(s.isMember[_communityId][msg.sender], "Must be a member");
        if (s.isAdmin[_communityId][msg.sender]) {
            delete s.isAdmin[_communityId][msg.sender];
        }
        delete s.isMember[_communityId][msg.sender];
        if (community.memberCount > 0) {
            community.memberCount -= 1;
        }
        emit MemberLeftCommunity(
            _communityId,
            msg.sender,
            community.memberCount,
            block.timestamp
        );
    }

    function removeCommunityMember(
        bytes32 _communityId,
        address _member
    )
        external
        override
        positiveAddress(_member)
        communityExists(_communityId)
        communityNotBanned(_communityId)
        isCommunityMember(_communityId, _member)
        communityOwnerOrAdmin(_communityId)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(_member != community.owner, "Cannot remove owner");
        require(!s.isAdmin[_communityId][_member], "Cannot remove admin");
        delete s.isMember[_communityId][_member];
        if (community.memberCount > 0) {
            community.memberCount -= 1;
        }
        emit MemberRemoved(
            _communityId,
            _member,
            community.memberCount,
            block.timestamp
        );
    }

    function transferCommunityOwner(
        bytes32 _communityId,
        address _newOwner
    )
        external
        override
        positiveAddress(_newOwner)
        communityExists(_communityId)
        onlyCommunityOwner(_communityId)
        isCommunityMember(_communityId, _newOwner)
    {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(
            _newOwner != msg.sender,
            "Cannot initiate transfer to current owner"
        );
        community.pendingOwner = _newOwner;
        emit CommunityOwnerTransferInitiated(
            _communityId,
            msg.sender,
            _newOwner,
            block.timestamp
        );
    }

    function acceptCommunityOwnership(
        bytes32 _communityId
    ) external override communityExists(_communityId) {
        CommunityStore storage s = CommunityStorage.load();
        ICommunity.Community storage community = s.communities[_communityId];
        require(msg.sender == community.pendingOwner, "Not pending owner");
        address previousOwner = community.owner;
        community.owner = msg.sender;
        delete community.pendingOwner;
        emit CommunityOwnerTransferAccepted(
            _communityId,
            previousOwner,
            msg.sender,
            block.timestamp
        );
    }

    function evaluateCustomChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external override poolInState(_challengeId, ChallengeState.matured) {
        CommunityStore storage cs = CommunityStorage.load();
        CPStore storage s = CPStorage.load();
        IChallengePool.Challenge storage challenge = s.challenges[_challengeId];
        bytes32 communityId = challenge.communityId;
        ICommunity.Community storage community = cs.communities[communityId];
        if (challenge.cType != ChallengeType.community) {
            revert CommunityChallengeRequiresCommunity();
        }
        if (community.owner == address(0)) {
            revert CommunityDoesNotExist(communityId);
        }
        if (community.banned) {
            revert CommunityIsBanned();
        }

        if (
            !cs.isAdmin[communityId][msg.sender] &&
            community.owner != msg.sender
        ) {
            revert NotCommunityOwnerOrAdmin(communityId, msg.sender);
        }
        challenge.outcome = _results;
        challenge.lastOutcomeSet = block.timestamp;
        challenge.state = ChallengeState.evaluated;
        emit IChallengePoolHandler.EvaluateChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.evaluated,
            _results
        );
    }
}
