// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
import "contracts/interfaces/ITournament.sol";
import "contracts/utils/TournamentHelpers.sol";
import "../utils/Helpers.sol";
import "../libraries/LibData.sol";
import "contracts/libraries/LibTransfer.sol";
import "contracts/diamond/interfaces/SoccersmRoles.sol";
import "@solidstate/contracts/security/reentrancy_guard/ReentrancyGuard.sol";
import "../utils/ChallengePoolHelpers.sol";
import "../interfaces/IChallengePoolCommon.sol";

contract Tournament is
    ITournament,
    TournamentHelpers,
    Helpers,
    ChallengePoolHelpers,
    IChallengePoolCommon,
    SoccersmRoles,
    ReentrancyGuard
{
    function createTournament(
        string calldata _name,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxTickets
    )
        external
        virtual
        override
        nonEmptyString(_name)
        validPeriod(_startTime, _endTime)
        nonZero(_maxTickets)
    {
        TournamentStore storage ts = TournamentStorage.load();
        bytes32 tournamentId = keccak256(bytes(_name));
        if (ts.tournaments[tournamentId].id != bytes32(0)) {
            revert TournamentAlreadyExists();
        }

        ts.tournaments[tournamentId] = ITournament.Tournament({
            id: tournamentId,
            creator: msg.sender,
            startTime: _startTime,
            endTime: _endTime,
            maxTickets: _maxTickets,
            soldTickets: 0,
            players: 0,
            spectators: 0,
            nextEventId: 0,
            banned: false
        });
        emit NewTournament(
            tournamentId,
            msg.sender,
            _startTime,
            _endTime,
            _maxTickets,
            0,
            0,
            0,
            0,
            false
        );
    }

    function addTournamentAdmin(
        bytes32 _id,
        address _member
    )
        external
        virtual
        override
        positiveAddress(_member)
        tournamentExists(_id)
        onlyTournamentOwner(_id)
        tournamentNotBanned(_id)
    {
        TournamentStore storage ts = TournamentStorage.load();
        if (ts.isAdmin[_id][_member]) {
            revert AlreadyTournamentAdmin();
        }
        ts.isAdmin[_id][_member] = true;
        emit TournamentAdminAdded(_id, _member, true);
    }

    function removeTournamentAdmin(
        bytes32 _id,
        address _member
    )
        external
        virtual
        override
        positiveAddress(_member)
        tournamentExists(_id)
        onlyTournamentOwner(_id)
        tournamentNotBanned(_id)
        tournamentAdmin(_id, _member)
    {
        TournamentStore storage ts = TournamentStorage.load();
        delete ts.isAdmin[_id][_member];
        emit TournamentAdminRemoved(_id, _member, false);
    }

    function updateTournament(
        bytes32 _id,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxTickets
    )
        external
        virtual
        override
        tournamentExists(_id)
        validPeriod(_startTime, _endTime)
        tournamentNotBanned(_id)
        tournamentOwnerOrAdmin(_id)
        pendingTournament(_id)
        nonZero(_maxTickets)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        t.startTime = _startTime;
        t.endTime = _endTime;
        t.maxTickets = _maxTickets;

        emit TournamentUpdated(_id, _startTime, _endTime, _maxTickets);
    }

    function joinTournamentAsPlayer(
        bytes32 _id
    )
        external
        virtual
        override
        tournamentExists(_id)
        pendingTournament(_id)
        tournamentNotBanned(_id)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (ts.isPlayer[_id][msg.sender]) {
            revert AlreadyPlayer();
        }
        require(t.soldTickets < t.maxTickets, "All tickets sold");
        t.soldTickets += 1;
        t.players += 1;
        ts.isPlayer[_id][msg.sender] = true;
        emit TournamentPlayerJoined(
            _id,
            msg.sender,
            true,
            t.soldTickets,
            t.players
        );
    }

    function joinTournamentAsSpectator(
        bytes32 _id
    )
        external
        virtual
        override
        tournamentExists(_id)
        pendingTournament(_id)
        tournamentNotBanned(_id)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (ts.isSpectator[_id][msg.sender]) {
            revert AlreadySpectator();
        }
        t.spectators += 1;
        ts.isSpectator[_id][msg.sender] = true;
        emit TournamentSpectatorJoined(_id, msg.sender, t.spectators);
    }

    function removePlayer(
        bytes32 _id,
        address _player
    )
        external
        virtual
        override
        tournamentExists(_id)
        pendingTournament(_id)
        positiveAddress(_player)
        tournamentOwnerOrAdmin(_id)
        tournamentNotBanned(_id)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (!ts.isPlayer[_id][_player]) {
            revert NotTournamentPlayer();
        }
        t.players -= 1;
        t.soldTickets -= 1;
        delete ts.isPlayer[_id][_player];
        emit TournamentPlayerRemoved(
            _id,
            _player,
            t.players,
            t.soldTickets,
            false
        );
    }

    function leaveTournament(
        bytes32 _id
    )
        external
        virtual
        override
        tournamentExists(_id)
        pendingTournament(_id)
        tournamentNotBanned(_id)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        bool player = ts.isPlayer[_id][msg.sender];
        bool spectator = ts.isSpectator[_id][msg.sender];
        if (!player && !spectator) {
            revert NotPlayerOrSpectator();
        }
        if (player) {
            t.soldTickets -= 1;
            t.players -= 1;
            delete ts.isPlayer[_id][msg.sender];
            emit TournamentPlayerLeft(
                _id,
                msg.sender,
                t.players,
                t.soldTickets,
                false
            );
        } else {
            t.spectators -= 1;
            delete ts.isSpectator[_id][msg.sender];
            emit TournamentSpectatorLeft(_id, msg.sender, t.spectators, false);
        }
    }

    function addEvent(
        bytes32 _id,
        uint256 _startTime,
        uint256 _endTime
    )
        external
        virtual
        override
        tournamentExists(_id)
        tournamentOwnerOrAdmin(_id)
        tournamentNotBanned(_id)
        validPeriod(_startTime, _endTime)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (_startTime < t.startTime || _endTime > t.endTime) {
            revert InvalidEventPeriod();
        }
        uint256 eventId = t.nextEventId;
        ts.tournamentEvents[_id][eventId] = ITournament.TournamentEvent({
            id: eventId,
            startTime: _startTime,
            endTime: _endTime,
            winner: address(0)
        });
        address winner = ts.tournamentEvents[_id][eventId].winner;
        t.nextEventId++;

        emit NewTournamentEvent(_id, eventId, _startTime, _endTime, winner);
    }

    function updateEvent(
        bytes32 _id,
        uint256 _eventId,
        uint256 _startTime,
        uint256 _endTime
    )
        external
        virtual
        override
        tournamentExists(_id)
        tournamentNotBanned(_id)
        tournamentOwnerOrAdmin(_id)
        validPeriod(_startTime, _endTime)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        ITournament.TournamentEvent storage events = ts.tournamentEvents[_id][
            _eventId
        ];
        if (_startTime < t.startTime || _endTime > t.endTime) {
            revert InvalidEventPeriod();
        }
        if (events.id != _eventId) {
            revert TournamentEventNotFound();
        }
        events.startTime = _startTime;
        events.endTime = _endTime;
        emit TournamentEventUpdated(_id, _eventId, _startTime, _endTime);
    }

    function banTournament(
        bytes32 _id
    )
        external
        virtual
        override
        tournamentExists(_id)
        tournamentNotBanned(_id)
        onlySoccersmCouncil
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        t.banned = true;
        emit TournamentBanned(_id, msg.sender, true);
    }

    function unBanTournament(
        bytes32 _id
    ) external virtual override tournamentExists(_id) onlySoccersmCouncil {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        require(t.banned, "Tournament not banned");
        t.banned = false;
        emit TournamentUnbanned(_id, msg.sender, false);
    }

    function setEventWinner(
        bytes32 _id,
        uint256 _eventId,
        address _winner
    )
        external
        virtual
        override
        tournamentNotBanned(_id)
        tournamentExists(_id)
        tournamentOwnerOrAdmin(_id)
        positiveAddress(_winner)
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.TournamentEvent storage events = ts.tournamentEvents[_id][
            _eventId
        ];
        if (block.timestamp < events.endTime) {
            revert EventStillOngoing();
        }
        if (!ts.isPlayer[_id][_winner]) {
            revert NotTournamentPlayer();
        }
        events.winner = _winner;
        emit EventWinnerSet(_id, _eventId, _winner);
    }

    function evaluateTournamentChallenge(
        uint256 _challengeId,
        bytes memory _results
    ) external override poolInState(_challengeId, ChallengeState.matured) {
        CPStore storage s = CPStorage.load();
        IChallengePool.Challenge storage challenge = s.challenges[_challengeId];
        bytes32 tournamentId = challenge.communityId;
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[tournamentId];
        if (t.creator == address(0)) {
            revert TournamentDoesNotExist();
        }
        if (block.timestamp < t.endTime) {
            revert TournamentStillOngoing();
        }
        if (t.banned) {
            revert TournamentIsBanned();
        }
        bool admin = ts.isAdmin[tournamentId][msg.sender];
        bool owner = t.creator == msg.sender;
        if (!owner && !admin) {
            revert NotTournamentOwnerOrAdmin();
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
