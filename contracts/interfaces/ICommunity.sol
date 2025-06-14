// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/IChallengePoolHandler.sol";

abstract contract ICommunity {
    struct Community {
        string communityId;
        address owner;
        address pendingOwner;
        uint256 memberCount;
        bool banned;
        bytes32 tournamentId;
    }

    event NewCommunity(
        string _communityId,
        bytes32 communityId,
        address owner,
        uint256 memberCount,
        bool bannedStatus,
        uint256 createdAt
    );

    event CommunityBanned(bytes32 communityId, address council, bool banned);
    event CommunityUnBanned(
        bytes32 communityId,
        address council,
        bool unbanned
    );
    event AdminAdded(bytes32 communityId, address caller, address newAdmin);
    event AdminRemoved(bytes32 communityId, address caller, address admin);

    event CommunityOwnerTransferAccepted(
        bytes32 communityId,
        address previousOwner,
        address newOwner,
        uint256 timeAt
    );
    event CommunityOwnerTransferInitiated(
        bytes32 communityId,
        address oldOwner,
        address newOwner,
        uint256 timeAt
    );
    event EvaluateCommunityChallenge(
        uint256 challengeId,
        bytes32 communityId,
        address evaluator,
        IChallengePoolHandler.ChallengeState state,
        bytes result
    );
    event MemberIsBanned(
        bytes32 communityId,
        address user,
        uint256 memberCount,
        uint256 timeAt
    );
    event MemberUnbanned(bytes32 communityId, address user, uint256 timeAt);
    event MemberJoined(
        bytes32 communityId,
        address member,
        uint256 memberCount,
        uint256 timeAt
    );
    event MemberLeftCommunity(
        bytes32 communityId,
        address user,
        uint256 memberCount,
        uint256 timeAt
    );
    event MemberRemoved(
        bytes32 communityId,
        address member,
        uint256 memberCount,
        uint256 timeAt
    );

    error CommunityIsBanned();
    error CommunityNotBanned();
    error NotCommunityAdmin();
    error NotCommunityMember();
    error AlreadyCommunityMember();
    error NotCommunityOwner();
    error NotCommunityOwnerOrAdmin(bytes32 communityId, address caller);
    error CommunityDoesNotExist(bytes32 communityId);
    error AlreadyCommunityAdmin();
    error MustBeCommunityAdmin();
    error CommunityChallengeRequiresCommunity();
    error CommunityAlreadyExists();
    error CommunityUserBanned(bytes communityId, address user);

    /**
     * @dev Creates a new community with the specified name.
     * @param _communityId The id of the community to be created.
     */
    function createCommunity(string calldata _communityId) external virtual;

    /**
     * @dev adds an admin to the community
     * @param _communityId of the community to add an admin
     * @param _admin the user to make an admin
     */
    function addCommunityAdmin(
        bytes32 _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev removes an admin from the community
     * @param _communityId community to remove an admin
     * @param _admin the address of the admin to remove
     */
    function removeCommunityAdmin(
        bytes32 _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev ban a community
     * @param _communityId community to ban
     */
    function banCommunity(bytes32 _communityId) external virtual;

    /**
     * @dev unban a banned community
     * @param _communityId of the banned community to unban
     */
    function unBanCommunity(bytes32 _communityId) external virtual;

    /**
     * @dev ban a user and prevent user from joining community
     * @param _communityId community user belongs to
     * @param _user address of user to ban
     */
    function banMember(bytes32 _communityId, address _user) external virtual;

    /**
     * @dev unban a banned user
     * @param _communityId community user belongs to
     * @param _user address of user to unban
     */
    function unBanMember(bytes32 _communityId, address _user) external virtual;

    /**
     * @dev user joins a community
     * @param _communityId community to join
     */
    function joinCommunity(bytes32 _communityId) external virtual;

    /**
     * @dev enables a user to leave a community
     * @param _communityId id of the community the user wants to leave
     */

    function leaveCommunity(bytes32 _communityId) external virtual;

    /**
     * @dev removes a user from a community;
     * @param _communityId communityId to remove the user from
     * @param _member the address of the member to remove from community
     */
    function removeCommunityMember(
        bytes32 _communityId,
        address _member
    ) external virtual;

    /**
     * @notice Initiate transfer of ownership of the specified community to a new owner.
     * @dev Only callable by the current owner or an authorized entity.
     * @param _communityId The unique identifier of the community whose ownership is being transferred.
     * @param _owner The address of the new owner to transfer ownership to.
     */

    function transferCommunityOwner(
        bytes32 _communityId,
        address _owner
    ) external virtual;

    /**
     * @notice accept pending community ownership transfer
     * @dev only callable by the stored pendingOwner
     * @param _communityId the id of the community to accept ownership transfer
     *
     */
    function acceptCommunityOwnership(bytes32 _communityId) external virtual;

    function evaluateCustomChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external virtual;
}
