// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/IChallengePoolHandler.sol";

abstract contract ICommunity {
    struct Community {
        string communityId;
        address owner;
        address[] admins;
        uint256 memberCount;
        bool banned;
    }

    event NewCommunity(string communityId, address owner, uint256 createdAt);

    event CommunityBanned(string communityId, address council);
    event CommunityUnBanned(string communityId, address council);
    event AdminAdded(string communityId, address caller, address newAdmin);
    event AdminRemoved(string communityId, address caller, address admin);
    event MemberJoined(string communityId, address member, uint256 timeAt);
    event MemberRemoved(string communityId, address member);
    event CommunityOwnerTransferred(
        string communityId,
        address oldOwner,
        address newOwner
    );
    event EvaluateCommunityChallenge(
        uint256 challengeId,
        address evaluator,
        IChallengePoolHandler.ChallengeState state,
        bytes result
    );
    event MemberIsBanned(string communityId, address user);
    event MemberUnbanned(string communityId, address user);
    event MemberLeftCommunity(string communityId, address user);

    error CommunityIsBanned();
    error UserIsBanned(string communityId, address user);
    error CommunityNotBanned();
    error NotCommunityAdmin();
    error NotCommunityMember();
    error AlreadyCommunityMember();
    error NotCommunityOwner();
    error NotCommunityOwnerOrAdmin(string communityId, address caller);
    error CommunityDoesNotExist(string communityId);
    error AlreadyCommunityAdmin(string communityId, address admin);
    error MustBeCommunityAdmin();
    error CustomChallengeRequiresCommunity();
    error CommunityAlreadyExists();
    error CommunityUserBanned(string communityId, address user);

    /**
     * @dev Creates a new community with the specified name.
     * @param _communityId The id of the community to be created.
     */
    function createCommunity(string calldata _communityId) external virtual;

    /**
     * @dev adds an admin to the community
     * @param _communityId community to add an admin
     * @param _admin the user to make an admin
     */
    function addCommunityAdmin(
        string calldata _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev removes an admin from the community
     * @param _communityId community to remove an admin
     * @param _admin the address of the admin to remove
     */
    function removeCommunityAdmin(
        string calldata _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev ban a community
     * @param _communityId community to ban
     */
    function banCommunity(string calldata _communityId) external virtual;

    /**
     * @dev unban a banned community
     * @param _communityId of the banned community to unban
     */
    function unBanCommunity(string calldata _communityId) external virtual;

    /**
     * @dev ban a user and prevent user from joining community
     * @param _communityId community user belongs to
     * @param _user address of user to ban
     */
    function banMember(
        string calldata _communityId,
        address _user
    ) external virtual;

    /**
     * @dev unban a banned user
     * @param _communityId community user belongs to
     * @param _user address of user to unban
     */
    function unBanMember(
        string calldata _communityId,
        address _user
    ) external virtual;

    /**
     * @dev user joins a community
     * @param _communityId community to join
     */
    function joinCommunity(string calldata _communityId) external virtual;

    /**
     * @dev enables a user to leave a community
     * @param _communityId id of the community the user wants to leave
     */

    function leaveCommunity(string calldata _communityId) external virtual;

    /**
     * @dev removes a user from a community;
     * @param _communityId communityId to remove the user from
     * @param _user the address of the user to remove from community
     */
    function removeCommunityMember(
        string calldata _communityId,
        address _user
    ) external virtual;

    /**
     * @notice Transfers ownership of the specified community to a new owner.
     * @dev Only callable by the current owner or an authorized entity.
     * @param _communityId The unique identifier of the community whose ownership is being transferred.
     * @param _owner The address of the new owner to transfer ownership to.
     */

    function transferCommunityOwner(
        string calldata _communityId,
        address _owner
    ) external virtual;

    function evaluateCustomChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external virtual;
}
