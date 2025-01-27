// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IChallengePoolView.sol";
import "../interfaces/IChallengePoolHandler.sol";
import "../interfaces/IChallengePoolDispute.sol";
import "../libraries/LibData.sol";

contract ChallengePoolView is IChallengePoolView {
    function challenges(
        uint256 _challengeId
    ) external view override returns (IChallengePoolHandler.Challenge memory) {
        return CPStorage.load().challenges[_challengeId];
    }

    function playerOptionSupply(
        address _player,
        uint256 _challengeId,
        bytes calldata _option
    ) external view override returns (IChallengePoolHandler.PlayerSupply memory) {
        return
            CPStorage.load().playerOptionSupply[_player][_challengeId][_option];
    }

    function playerSupply(
        uint256 _challengeId,
        address _player
    ) external view override returns (IChallengePoolHandler.PlayerSupply memory) {
        return CPStorage.load().playerSupply[_player][_challengeId];
    }

    function optionSupply(
        uint256 _challengeId,
        bytes calldata _option
    ) external view override returns (IChallengePoolHandler.OptionSupply memory) {
        return CPStorage.load().optionSupply[_challengeId][_option];
    }

    function poolSupply(
        uint256 _challengeId
    ) external view override returns (IChallengePoolHandler.Supply memory) {
        return CPStorage.load().poolSupply[_challengeId];
    }

    function playerDisputes(
        uint256 _challengeId,
        address _player
    ) external view override returns (IChallengePoolDispute.Dispute memory) {
        return CPStorage.load().playerDisputes[_challengeId][_player];
    }

    function optionDisputes(
        uint256 _challengeId,
        bytes calldata _option
    ) external view override returns (uint256) {
        return CPStorage.load().optionDisputes[_challengeId][_option];
    }

    function poolDisputes(
        uint256 _challengeId
    ) external view override returns (uint256) {
        return CPStorage.load().poolDisputes[_challengeId];
    }
}
