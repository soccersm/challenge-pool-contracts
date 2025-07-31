// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;
import "contracts/interfaces/ITournament.sol";
import "contracts/libraries/LibData.sol";

abstract contract TournamentHelpers {
    modifier tournamentExists(bytes32 _id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (t.id == bytes32(0)) {
            revert ITournament.TournamentDoesNotExist();
        }
        _;
    }

    modifier validPeriod(uint256 _startTime, uint256 _endTime) {
        if (_startTime < block.timestamp || _endTime < block.timestamp) {
            revert ITournament.InvalidPeriod();
        }
        if (_endTime <= _startTime) {
            revert ITournament.InvalidPeriod();
        }
        _;
    }

    modifier pendingTournament(bytes32 _id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if(block.timestamp >= t.startTime) {
            revert ITournament.TournamentAlreadyStarted();
        }
        _;
    }

    modifier tournamentAdmin(bytes32 _id, address _admin) {
        TournamentStore storage ts = TournamentStorage.load();
        if (!ts.isAdmin[_id][_admin]) {
            revert ITournament.MustBeTournamentAdmin();
        }
        _;
    }

    modifier onlyTournamentOwner(bytes32 _id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (t.creator != msg.sender) {
            revert ITournament.NotTournamentOwner();
        }
        _;
    }

    modifier tournamentOwnerOrAdmin(bytes32 _id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        bool admin = ts.isAdmin[_id][msg.sender];
        bool owner = t.creator == msg.sender;
        if (!owner && !admin) {
            revert ITournament.NotTournamentOwnerOrAdmin();
        }
        _;
    }

    modifier tournamentNotBanned(bytes32 _id) {
        TournamentStore storage ts = TournamentStorage.load();
        ITournament.Tournament storage t = ts.tournaments[_id];
        if (t.banned) {
            revert ITournament.TournamentIsBanned();
        }
        _;
    }
}
