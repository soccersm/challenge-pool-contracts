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
        address winner;
    }
    struct Tournament {
        bytes32 id;
        address creator;
        uint256 startTime;
        uint256 endTime;
        uint256 maxTickets;
        uint256 soldTickets;
        uint256 players;
        uint256 spectators;
        uint256 nextEventId;
        bool banned;
    }

    event NewTournament(
        bytes32 id,
        address creator,
        uint256 startTime,
        uint256 endTime,
        uint256 maxTickets,
        uint256 soldTickets,
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
        uint256 maxTickets
    );

    event NewTournamentEvent(
        bytes32 id,
        uint256 eventId,
        uint256 startTime,
        uint256 endTime,
        address winner
    );
    event TournamentEventUpdated(
        bytes32 id,
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
        uint256 soldTickets,
        uint256 players
    );
    event TournamentSpectatorJoined(
        bytes32 id,
        address spectator,
        uint256 spectators
    );

    event TournamentPlayerRemoved(
        bytes32 id,
        address player,
        uint256 players,
        uint256 soldTickets,
        bool isPlayer
    );
    event TournamentPlayerLeft(
        bytes32 id,
        address player,
        uint256 players,
        uint256 soldTickets,
        bool isPlayer
    );
    event TournamentSpectatorLeft(
        bytes32 id,
        address spectator,
        uint256 spectators,
        bool isSpectator
    );

    event EventWinnerSet(bytes32 tournamentId, uint256 eventId, address winner);

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
    error EventStillOngoing();
    error NotTournamentWinner();
    error TournamentChallengeRequiresId();
    error TournamentNotStarted();
    error AlreadyTournamentAdmin();

    /**
     * @notice Creates a new tournament with specified parameters.
     * @param _name Name of the tournament.
     * @param _startTime Timestamp when the tournament starts.
     * @param _endTime Timestamp when the tournament ends.
     * @param _maxTickets Maximum number of tickets/participants allowed.
     *
     */
    function createTournament(
        string calldata _name,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxTickets
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
     * @param _maxTickets New max tickets.
     */
    function updateTournament(
        bytes32 _id,
        uint256 _startTime,
        uint256 _endTime,
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
     * @notice admin sets event winner at the end of event
     * @param _id ID of the completed event
     * @param _winner The address of the winner of the event
     */
    function setEventWinner(
        bytes32 _id,
        uint256 _eventId,
        address _winner
    ) external virtual;

    /**
     * @notice evaluate tournament challenge
     * @param _challengeId ID of the challenge to evaluate
     * @param _results Results the admin can provide
     */

    function evaluateTournamentChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external virtual;
}
