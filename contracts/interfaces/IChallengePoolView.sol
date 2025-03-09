// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolHandler.sol";
import "./IChallengePoolDispute.sol";
import "./IDataProvider.sol";
interface IChallengePoolView {
    function challenges(
        uint256 _challengeId
    ) external view returns (IChallengePoolHandler.Challenge memory);

    function playerOptionSupply(
        uint256 _challengeId,
        address _player,
        bytes32 _option
    ) external view returns (IChallengePoolHandler.PlayerSupply memory);
    function playerSupply(
        uint256 _challengeId,
        address _player
    ) external view returns (IChallengePoolHandler.PlayerSupply memory);
    function optionSupply(
        uint256 _challengeId,
        bytes32 _option
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
        bytes32 _option
    ) external view returns (uint256);
    function poolDisputes(uint256 _challengeId) external view returns (uint256);

    function dataRequest(
        bytes32 _requestId
    ) external view returns (IDataProvider.DataRequest memory);
    function requestOptions(
        bytes32 _requestId,
        bytes32 _option
    ) external view returns (bool);
    /**
     * @notice  .
     * @dev     price calculation for a pool option
     * @param   _challengeId  .
     * @return  uint256  .
     */
    function price(uint256 _challengeId) external view returns (uint256);

    function earlyWithdrawPenalty(
        uint256 _challengeId
    ) external view returns (uint256 penalty, uint256 priceMinusPenalty);

    function earlyWithdrawFee(
        uint256 _price
    ) external view returns (uint256 fee, uint256 feePlusPrice);

    function createFee(
        uint256 _price
    ) external view returns (uint256 fee, uint256 feePlusPrice);

    function stakeFee(
        uint256 _price
    ) external view returns (uint256 fee, uint256 feePlusPrice);
    function winnerShare(
        uint256 _challengeId,
        address _player
    ) external view returns (uint256);

    function stakeAirDrop() external view returns (uint256);
    function maxClaim() external view returns (uint256);
    function paymaster() external view returns (address);
    function minPoolMaturity() external view returns (uint256);
}
