// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

/**
 * @author  .
 * @title   .
 * @dev     Handles logic for soccersm tournaments
 * @notice  .
 */

abstract contract ITournament {
    struct TournamentEvent {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
    }
    struct Tournament {
        bytes32 id;
        address creator;
        address stakeToken;
        uint256 startTime;
        uint256 endTime;
        uint256 registrationFee;
        uint256 maxTickets;
        uint256 soldTickets;
        uint256 prizePool;
        address winner;
        bool prizeClaimed;
        uint256 players;
        uint256 spectators;
        uint256 nextEventId;
        bool banned;
    }

    event NewTournament(
        bytes32 id,
        address creator,
        address stakeToken,
        uint256 startTime,
        uint256 endTime,
        uint256 registrationFee,
        uint256 maxTickets,
        uint256 soldTickets,
        uint256 prizePool,
        address winner,
        bool prizeClaimed,
        uint256 players,
        uint256 spectators,
        uint256 nextEventId,
        bool banned
    );
    event TournamentAdminAdded(bytes32 id, address admin, bool status);
    event TournamentAdminRemoved(bytes32 id, address admin, bool status);
    event TournamentUpdated(
        bytes32 id,
        uint256 startTime,
        uint256 endTime,
        uint256 registrationFee,
        uint256 maxTickets
    );

    event NewTournamentEvent(
        bytes32 tournamentId,
        uint256 eventId,
        uint256 startTime,
        uint256 endTime
    );
    event TournamentEventDeleted(bytes32 tournamentId, uint256 eventId);
    event TournamentEventUpdated(
        bytes32 tournamentId,
        uint256 eventId,
        uint256 startTime,
        uint256 endTime
    );

    event TournamentBanned(bytes32 id, address caller, bool status);
    event TournamentUnbanned(bytes32 id, address caller, bool status);
    event TournamentPlayerJoined(
        bytes32 id,
        address player,
        bool isPlayer,
        uint256 prizePool,
        uint256 soldTickets,
        uint256 players
    );
    event TournamentSpectatorJoined(
        bytes32 touramentId,
        address spectator,
        uint256 spectators
    );

    event TournamentPlayerRemoved(
        bytes32 tournamentId,
        address player,
        bool isPlayer
    );
    event TournamentPlayerLeft(
        bytes32 tournamentId,
        address player,
        bool isPlayer
    );
    event TournamentSpectatorLeft(
        bytes32 tournamentId,
        address spectator,
        bool isSpectator
    );

    event TournamentWinnerSet(bytes32 tournamentId, address winner);
    event TournamentPrizeClaimed(
        bytes32 tournamentId,
        address winner,
        uint256 amount, 
        bool claimed
    );

    error InvalidPeriod();
    error TournamentAlreadyExists();
    error TournamentDoesNotExist();
    error MustBeTournamentAdmin();
    error NotTournamentOwner();
    error TournamentHasPlayers();
    error TournamentIsBanned();
    error TournamentAlreadyStarted();
    error NotTournamentOwnerOrAdmin();
    error AlreadySpectator();
    error AlreadyPlayer();
    error NotTournamentPlayer();
    error NotPlayerOrSpectator();
    error InvalidEventPeriod();
    error TournamentEventNotFound();
    error TournamentStillOngoing();
    error NotTournamentWinner();

    /**
     * @notice Creates a new tournament with specified parameters.
     * @param _name Name of the tournament.
     * @param _startTime Timestamp when the tournament starts.
     * @param _endTime Timestamp when the tournament ends.
     * @param _registrationFee Fee required to register for the tournament.
     * @param _maxTickets Maximum number of tickets/participants allowed.
     * @param _stakeToken The token to be used for challenges in the tournament
     */
    function createTournament(
        string calldata _name,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _registrationFee,
        uint256 _maxTickets,
        address _stakeToken
    ) external virtual;

    /**
     * @notice Adds an admin to a tournament.
     * @param _id The ID of the tournament.
     * @param _member The address to grant admin privileges.
     */
    function addTournamentAdmin(bytes32 _id, address _member) external virtual;

    /**
     * @notice Removes an admin from a tournament.
     * @param _id The ID of the tournament.
     * @param _admin The address to revoke admin privileges.
     */
    function removeTournamentAdmin(
        bytes32 _id,
        address _admin
    ) external virtual;

    /**
     * @notice Updates tournament parameters.
     * @param _id The ID of the tournament.
     * @param _startTime New start time.
     * @param _endTime New end time.
     * @param _registrationFee New registration fee.
     * @param _maxTickets New max tickets.
     */
    function updateTournament(
        bytes32 _id,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _registrationFee,
        uint256 _maxTickets
    ) external virtual;

    /**
     * @notice Join a tournament as a player.
     * @param _id ID of the tournament to join.
     */
    function joinTournamentAsPlayer(bytes32 _id) external virtual;

    /**
     * @notice Removes a player from a tournament.
     * @param _id ID of the tournament.
     * @param _player Address of the player to remove.
     */
    function removePlayer(bytes32 _id, address _player) external virtual;

    /**
     * @notice Join a tournament as a spectator.
     * @param _id ID of the tournament.
     */
    function joinTournamentAsSpectator(bytes32 _id) external virtual;

    /**
     * @notice Allows a user to leave a tournament.
     * @param _id ID of the tournament to leave.
     */
    function leaveTournament(bytes32 _id) external virtual;

    /**
     * @notice Adds a new event to a tournament.
     * @param _id ID of the tournament.
     * @param _startTime Start time of the event.
     * @param _endTime End time of the event.
     */
    function addEvent(
        bytes32 _id,
        uint256 _startTime,
        uint256 _endTime
    ) external virtual;

    /**
     * @notice Updates an existing tournament event.
     * @param _id ID of the tournament.
     * @param _eventId ID of the event to update.
     * @param _startTime New start time.
     * @param _endTime New end time.
     */
    function updateEvent(
        bytes32 _id,
        uint256 _eventId,
        uint256 _startTime,
        uint256 _endTime
    ) external virtual;

    /**
     * @notice Deletes a specific event from a tournament.
     * @param _id ID of the tournament.
     * @param _eventId ID of the event to delete.
     */
    function deleteEvent(bytes32 _id, uint256 _eventId) external virtual;

    /**
     * @notice Bans a tournament from further participation or activity.
     * @param _id ID of the tournament to ban.
     */
    function banTournament(bytes32 _id) external virtual;

    /**
     * @notice Removes ban status from a tournament.
     * @param _id ID of the tournament to unban.
     */
    function unBanTournament(bytes32 _id) external virtual;

    /**
     * @notice admin sets tournament winner at the end of tournament
     * @param _id ID of the completed tournament
     * @param _winner The address of the winner of the tournament
     */
    function setTournamentWinner(bytes32 _id, address _winner) external virtual;

    /**
     * @notice Tournament winner claim's prize
     * @param _id ID of the tournament winner can claim prize
     */
    function claimTournamentPrize(bytes32 _id) external virtual;
}
