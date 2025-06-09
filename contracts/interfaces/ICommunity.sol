// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/IChallengePoolHandler.sol";

abstract contract ICommunity {
    struct Community {
        bytes communityId;
        address owner;
        address pendingOwner;
        uint256 memberCount;
        bool banned;
    }

    event NewCommunity(bytes communityId, address owner, uint256 memberCount, bool bannedStatus, uint256 createdAt);

    event CommunityBanned(bytes communityId, address council);
    event CommunityUnBanned(bytes communityId, address council);
    event AdminAdded(bytes communityId, address caller, address newAdmin);
    event AdminRemoved(bytes communityId, address caller, address admin);
    event MemberJoined(bytes communityId, address member, uint256 timeAt);
    event MemberRemoved(bytes communityId, address member, uint256 timeAt);
    event CommunityOwnerTransferAccepted(
        bytes communityId,
        address previousOwner,
        address newOwner,
        uint256 timeAt
    );
    event CommunityOwnerTransferInitiated(
        bytes communityId,
        address oldOwner,
        address newOwner,
        uint256 timeAt
    );
    event EvaluateCommunityChallenge(
        uint256 challengeId,
        address evaluator,
        IChallengePoolHandler.ChallengeState state,
        bytes result
    );
    event MemberIsBanned(bytes communityId, address user, uint256 timeAt);
    event MemberUnbanned(bytes communityId, address user, uint256 timeAt);
    event MemberLeftCommunity(bytes communityId, address user, uint256 timeAt);

    error CommunityIsBanned();
    error CommunityNotBanned();
    error NotCommunityAdmin();
    error NotCommunityMember();
    error AlreadyCommunityMember();
    error NotCommunityOwner();
    error NotCommunityOwnerOrAdmin(bytes communityId, address caller);
    error CommunityDoesNotExist(bytes communityId);
    error AlreadyCommunityAdmin(bytes communityId, address admin);
    error MustBeCommunityAdmin();
    error CommunityChallengeRequiresCommunity();
    error CommunityAlreadyExists();
    error CommunityUserBanned(bytes communityId, address user);

    /**
     * @dev Creates a new community with the specified name.
     * @param _communityId The id of the community to be created.
     */
    function createCommunity(bytes calldata _communityId) external virtual;

    /**
     * @dev adds an admin to the community
     * @param _communityId community to add an admin
     * @param _admin the user to make an admin
     */
    function addCommunityAdmin(
        bytes calldata _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev removes an admin from the community
     * @param _communityId community to remove an admin
     * @param _admin the address of the admin to remove
     */
    function removeCommunityAdmin(
        bytes calldata _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev ban a community
     * @param _communityId community to ban
     */
    function banCommunity(bytes calldata _communityId) external virtual;

    /**
     * @dev unban a banned community
     * @param _communityId of the banned community to unban
     */
    function unBanCommunity(bytes calldata _communityId) external virtual;

    /**
     * @dev ban a user and prevent user from joining community
     * @param _communityId community user belongs to
     * @param _user address of user to ban
     */
    function banMember(
        bytes calldata _communityId,
        address _user
    ) external virtual;

    /**
     * @dev unban a banned user
     * @param _communityId community user belongs to
     * @param _user address of user to unban
     */
    function unBanMember(
        bytes calldata _communityId,
        address _user
    ) external virtual;

    /**
     * @dev user joins a community
     * @param _communityId community to join
     */
    function joinCommunity(bytes calldata _communityId) external virtual;

    /**
     * @dev enables a user to leave a community
     * @param _communityId id of the community the user wants to leave
     */

    function leaveCommunity(bytes calldata _communityId) external virtual;

    /**
     * @dev removes a user from a community;
     * @param _communityId communityId to remove the user from
     * @param _user the address of the user to remove from community
     */
    function removeCommunityMember(
        bytes calldata _communityId,
        address _user
    ) external virtual;

    /**
     * @notice Initiate transfer of ownership of the specified community to a new owner.
     * @dev Only callable by the current owner or an authorized entity.
     * @param _communityId The unique identifier of the community whose ownership is being transferred.
     * @param _owner The address of the new owner to transfer ownership to.
     */

    function transferCommunityOwner(
        bytes calldata _communityId,
        address _owner
    ) external virtual;

    /**
     * @notice accept pending community ownership transfer
     * @dev only callable by the stored pendingOwner
     * @param _communityId the id of the community to accept ownership transfer
     * 
     */
    function acceptCommunityOwnership(
        bytes calldata _communityId
    ) external virtual;

    function evaluateCustomChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external virtual;
}
