// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
import "contracts/interfaces/ITournament.sol";
import "contracts/utils/TournamentHelpers.sol";
import "../utils/Helpers.sol";
import "../libraries/LibData.sol";
import "contracts/libraries/LibTransfer.sol";
import "contracts/diamond/interfaces/SoccersmRoles.sol";

contract Tournament is ITournament, TournamentHelpers, Helpers, SoccersmRoles {
    function createTournament(
        string calldata _name,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _registrationFee,
        uint256 _maxTickets,
        address _stakeToken
    )
        external
        virtual
        override
        nonEmptyString(_name)
        validPeriod(_startTime, _endTime)
        positiveAddress(_stakeToken)
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
            stakeToken: _stakeToken,
            startTime: _startTime,
            endTime: _endTime,
            registrationFee: _registrationFee,
            maxTickets: _maxTickets,
            soldTickets: 0,
            prizePool: 0,
            winner: address(0),
            prizeClaimed: false,
            players: 0,
            spectators: 0,
            nextEventId: 0,
            banned: false
        });
        emit NewTournament(
            tournamentId,
            msg.sender,
            _stakeToken,
            _startTime,
            _endTime,
            _registrationFee,
            _maxTickets,
            0,
            0,
            address(0),
            false,
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
        if(ts.isAdmin[_id][_member]){
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
        uint256 _registrationFee,
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
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (t.prizePool != 0) {
            require(
                _registrationFee == t.registrationFee,
                "Players already entered"
            );
        }
        t.startTime = _startTime;
        t.endTime = _endTime;
        t.registrationFee = _registrationFee;
        t.maxTickets = _maxTickets;

        emit TournamentUpdated(
            _id,
            _startTime,
            _endTime,
            _registrationFee,
            _maxTickets
        );
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
        require(t.soldTickets <= t.maxTickets, "All tickets sold");
        t.soldTickets += 1;
        t.players += 1;
        if (t.registrationFee > 0) {
            t.prizePool += t.registrationFee;
            LibTransfer._receive(t.stakeToken, t.registrationFee, msg.sender);
        }
        ts.isPlayer[_id][msg.sender] = true;
        emit TournamentPlayerJoined(
            _id,
            msg.sender,
            true,
            t.prizePool,
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
        delete ts.isPlayer[_id][_player];
        if (t.registrationFee > 0) {
            t.prizePool -= t.registrationFee;
            LibTransfer._send(t.stakeToken, t.registrationFee, _player);
        }
        emit TournamentPlayerRemoved(_id, _player, false);
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
            if (t.registrationFee > 0) {
                t.prizePool -= t.registrationFee;
                LibTransfer._send(t.stakeToken, t.registrationFee, msg.sender);
            }
        } else {
            t.spectators -= 1;
            delete ts.isSpectator[_id][msg.sender];
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
        ts.tournamentEvents[_id].push(
            ITournament.TournamentEvent({
                id: eventId,
                startTime: _startTime,
                endTime: _endTime
            })
        );

        t.nextEventId++;

        emit NewTournamentEvent(_id, eventId, _startTime, _endTime);
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
        ITournament.TournamentEvent[] storage events = ts.tournamentEvents[_id];
        if (_startTime < t.startTime || _endTime > t.endTime) {
            revert InvalidEventPeriod();
        }
        bool found = false;
        uint256 eventLength = events.length;

        for (uint256 i = 0; i < eventLength; i++) {
            if (events[i].id == _eventId) {
                events[i].startTime = _startTime;
                events[i].endTime = _endTime;
                found = true;

                emit TournamentEventUpdated(
                    _id,
                    _eventId,
                    _startTime,
                    _endTime
                );
                break;
            }
        }
        if (!found) {
            revert TournamentEventNotFound();
        }
    }

    function deleteEvent(
        bytes32 _id,
        uint256 _eventId
    ) external virtual override tournamentExists(_id) tournamentNotBanned(_id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.TournamentEvent[] storage events = ts.tournamentEvents[_id];

        uint256 eventsLength = events.length;
        bool found = false;

        for (uint256 i = 0; i < eventsLength; i++) {
            if (events[i].id == _eventId) {
                events[i] = events[eventsLength - 1];
                events.pop();
                found = true;

                emit TournamentEventDeleted(_id, _eventId);
                break;
            }
        }

        if (!found) {
            revert TournamentEventNotFound();
        }
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
    )
        external
        virtual
        override
        tournamentExists(_id)
        onlySoccersmCouncil
    {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        require(t.banned, "Tournament not banned");
        t.banned = false;
        emit TournamentUnbanned(_id, msg.sender, false);
    }

    function setTournamentWinner(
        bytes32 _id,
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
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (t.endTime <= block.timestamp) {
            revert TournamentStillOngoing();
        }
        if (!ts.isPlayer[_id][_winner]) {
            revert NotTournamentPlayer();
        }
        t.winner = _winner;
        emit TournamentWinnerSet(_id, _winner);
    }

    function claimTournamentPrize(
        bytes32 _id
    ) external virtual override tournamentExists(_id) tournamentNotBanned(_id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (t.endTime <= block.timestamp) {
            revert TournamentStillOngoing();
        }
        if (!ts.isPlayer[_id][msg.sender]) {
            revert NotTournamentPlayer();
        }
        if (t.winner != msg.sender) {
            revert NotTournamentWinner();
        }
        t.prizeClaimed = true;
        uint256 amount;
        if (t.prizePool > 0) {
            amount = t.prizePool;
            t.prizePool = 0;
            LibTransfer._send(t.stakeToken, t.prizePool, msg.sender);
        }

        emit TournamentPrizeClaimed(_id, msg.sender, amount, true);
    }
}
