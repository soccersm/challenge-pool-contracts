// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../libraries/LibData.sol";
import "../interfaces/ITournament.sol";

library LibTournament {

    function _validateTournamentOptions(
        TournamentStore storage _ts,
        bytes32 _tournamentId,
        bytes[] memory _options
    ) internal view {
        ITournament.Tournament storage t = _ts.tournaments[_tournamentId];
        if (t.creator == address(0)) {
            revert ITournament.TournamentDoesNotExist();
        }
        if (t.banned) {
            revert ITournament.TournamentIsBanned();
        }
        if (t.startTime < block.timestamp) {
            revert ITournament.TournamentNotStarted();
        }
        for (uint256 i = 0; i < _options.length; i++) {
            address decodedOption = abi.decode(_options[i], (address));
            if (!_ts.isPlayer[_tournamentId][decodedOption]) {
                revert ITournament.NotTournamentPlayer();
            }
        }
    }

    function _validateTournamentEvent(
        TournamentStore storage _ts,
        bytes32 _tournamentId,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) internal view returns (bool) {
        (uint256 eventId, , ) = abi.decode(
            _event.params,
            (uint256, string, string)
        );
        ITournament.TournamentEvent memory events = _ts.tournamentEvents[
            _tournamentId
        ][eventId];

        if (events.id == eventId && events.endTime >= _event.maturity) {
            return true;
        }
        return false;
    }
}
