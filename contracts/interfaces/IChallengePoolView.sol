// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolHandler.sol";
import "./IChallengePoolDispute.sol";
interface IChallengePoolView {
    function challenges(
        uint256 _challengeId
    ) external view returns (IChallengePoolHandler.Challenge memory);

    function playerOptionSupply(
        uint256 _challengeId,
        address _player,
        bytes calldata _option
    ) external view returns (IChallengePoolHandler.PlayerSupply memory);
    function playerSupply(
        uint256 _challengeId,
        address _player
    ) external view returns (IChallengePoolHandler.PlayerSupply memory);
    function optionSupply(
        uint256 _challengeId,
        bytes calldata _option
    ) external view returns (IChallengePoolHandler.OptionSupply memory);
    function poolSupply(
        uint256 _challengeId
    ) external view returns (IChallengePoolHandler.Supply memory);
    function playerDisputes(
        uint256 _challengeId,
        address _player
    ) external view returns (IChallengePoolDispute.Dispute memory);
    function optionDisputes(
        uint256 _challengeId,
        bytes calldata _option
    ) external view returns (uint256);
    function poolDisputes(uint256 _challengeId) external view returns (uint256);
}
