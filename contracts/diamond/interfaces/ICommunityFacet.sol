// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ICommunityFacet {
    struct Community {
        string name;
        address owner;
        address[] admins;
        uint256 memberCount;
        bool banned;
    }

    event NewCommunity(
        uint256 communityId,
        address owner,
        uint256 createdAt,
        string name
    );

    event CommunityBanned(uint256 communityId, address council);
    event AdminAdded(uint256 communityId, address caller, address newAdmin);
    event AdminRemoved(uint256 communityId, address caller, address admin);
    event MemberJoined(uint256 communityId, address member, uint256 timeAt);
    event MemberRemoved(uint256 communityId, address member);

    error CommunityIsBanned();
    error NotCommunityAdmin();
    error NotCommunityMember();
    error NotCommunityOwner();
    error NotCommunityOwnerOrAdmin(uint256 id, address caller);
    error CommunityDoesNotExist(uint256 id);
    error AlreadyCommunityAdmin(uint256 id, address admin);

    /**
     * @dev Creates a new community with the specified name.
     * @param _name The name of the community to be created.
     */
    function createCommunity(string memory _name) external virtual;

    /**
     * @dev adds an admin to the community
     * @param _communityId community to add an admin
     * @param _admin the user to make an admin
     */
    function addCommunityAdmin(
        uint256 _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev removes an admin from the community
     * @param _communityId community to remove an admin
     * @param _admin the address of the admin to remove
     */
    function removeCommunityAdmin(
        uint256 _communityId,
        address _admin
    ) external virtual;

    /**
     * @dev ban a community
     * @param _communityId community to ban
     */
    function banCommunity(uint256 _communityId) external virtual;

    /**
     * @dev user joins a community
     * @param _communityId community to join
     */
    function joinCommunity(uint256 _communityId) external virtual;

    /**
     * @dev removes a user from a community;
     * @param _communityId communityId to remove the user from
     * @param _user the address of the user to remove from community
     */
    function removeCommunityMember(
        uint256 _communityId,
        address _user
    ) external virtual;
}
