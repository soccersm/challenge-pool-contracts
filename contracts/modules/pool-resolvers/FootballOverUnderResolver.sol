// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseResolver.sol";

contract FootballOverUnderResolver is BaseResolver {
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent memory _event
    ) external override returns (bool) {
        (
            string memory matchId,
            uint256 predictedTotal,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, string));
        if (!HelpersLib.compareStrings(outcome, OVER) && !HelpersLib.compareStrings(outcome, UNDER)) {
            return false;
        }
        if (predictedTotal < 1) {
            return false;
        }
        return _requestData(dataProvider, abi.encode(matchId));
    }

    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent memory _event,
        bytes[] calldata /*_options*/
    ) external override returns (bytes memory) {
        (
            string memory matchId,
            uint256 predictedTotal,
            string memory outcome
        ) = abi.decode(_event.params, (string, uint256, string));
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            _getData(dataProvider, abi.encode(matchId)),
            (uint256, uint256)
        );
        uint256 actualTotal = homeScore + awayScore;
        if (HelpersLib.compareStrings(outcome, OVER)) {
            if (actualTotal > predictedTotal) {
                return yes;
            }
        } else if (HelpersLib.compareStrings(outcome, UNDER)) {
            if (actualTotal < predictedTotal) {
                return yes;
            }
        } else {
            revert ProtocolInvariantCheckFailed();
        }
        return no;
    }

    function validateOptions(
        IDataProvider /*dataProvider*/,
        IChallengePoolHandler.ChallengeEvent memory /*_event*/,
        bytes[] calldata /*_options*/
    ) external pure override returns (bool) {
        revert NotImplemented();
    }
}
