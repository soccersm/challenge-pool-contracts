// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePool.sol";
interface IChallengePoolView {
    function challenges(
        uint256 _challengeId
    ) external view returns (IChallengePool.Challenge memory);

    function playerOptionSupply(
        address _player,
        uint256 _challengeId,
        bytes calldata _option
    ) external view returns (IChallengePool.PlayerSupply memory);
    function playerSupply(
        uint256 _challengeId,
        address _player
    ) external view returns (IChallengePool.PlayerSupply memory);
    function optionSupply(
        uint256 _challengeId,
        bytes calldata _option
    ) external view returns (IChallengePool.OptionSupply memory);
    function poolSupply(
        uint256 _challengeId
    ) external view returns (IChallengePool.Supply memory);
    function playerDisputes(
        uint256 _challengeId,
        address _player
    ) external view returns (IChallengePool.Dispute memory);
    function optionDisputes(
        uint256 _challengeId,
        bytes calldata _option
    ) external view returns (uint256);
    function poolDisputes(uint256 _challengeId) external view returns (uint256);
}
