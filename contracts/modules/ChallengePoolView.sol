// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IChallengePoolView.sol";
import "../interfaces/IChallengePoolHandler.sol";
import "../interfaces/IChallengePoolDispute.sol";
import "../libraries/LibData.sol";

import "../libraries/LibPrice.sol";

import "../utils/ChallengePoolHelpers.sol";

contract ChallengePoolView is IChallengePoolView, ChallengePoolHelpers {
    function challenges(
        uint256 _challengeId
    ) external view override returns (IChallengePoolHandler.Challenge memory) {
        return CPStorage.load().challenges[_challengeId];
    }

    function playerOptionSupply(
        uint256 _challengeId,
        address _player,
        bytes32 _option
    )
        external
        view
        override
        returns (IChallengePoolHandler.PlayerSupply memory)
    {
        return
            CPStorage.load().playerOptionSupply[_challengeId][_player][_option];
    }

    function playerSupply(
        uint256 _challengeId,
        address _player
    )
        external
        view
        override
        returns (IChallengePoolHandler.PlayerSupply memory)
    {
        return CPStorage.load().playerSupply[_challengeId][_player];
    }

    function optionSupply(
        uint256 _challengeId,
        bytes32 _option
    )
        external
        view
        override
        returns (IChallengePoolHandler.OptionSupply memory)
    {
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
        bytes32 _option
    ) external view override returns (uint256) {
        return CPStorage.load().optionDisputes[_challengeId][_option];
    }

    function poolDisputes(
        uint256 _challengeId
    ) external view override returns (uint256) {
        return CPStorage.load().poolDisputes[_challengeId];
    }

    function dataRequest(
        bytes32 _requestId
    ) external view override returns (IDataProvider.DataRequest memory) {
        return DPStorage.load().dataRequest[_requestId];
    }

    function requestOptions(
        bytes32 _requestId,
        bytes32 _option
    ) external view override returns (bool) {
        return DPStorage.load().requestOptions[_requestId][_option];
    }

    function price(
        uint256 _challengeId
    )
        external
        view
        override
        validChallenge(_challengeId)
        poolInState(_challengeId, IChallengePoolCommon.ChallengeState.open)
        returns (uint256)
    {
        return CPStorage.load().challenges[_challengeId].basePrice;
    }

    function earlyWithdrawFee(
        uint256 _price
    ) external view override returns (uint256 fee, uint256 feePlusPrice) {
        fee = LibPrice._computeEarlyWithdrawFee(_price);
        feePlusPrice = _price + fee;
    }

    function createFee(
        uint256 _price
    ) external view override returns (uint256 fee, uint256 feePlusPrice) {
        fee = LibPrice._computeCreateFee(_price);
        feePlusPrice = _price + fee;
    }

    function stakeFee(
        uint256 _price
    ) external view override returns (uint256 fee, uint256 feePlusPrice) {
        fee = LibPrice._computeStakeFee(_price);
        feePlusPrice = _price + fee;
    }

    function earlyWithdrawPenalty(
        uint256 _challengeId
    )
        external
        view
        override
        validChallenge(_challengeId)
        returns (uint256 penalty, uint256 priceMinusPenalty)
    {
        IChallengePoolCommon.Challenge storage c = CPStorage.load().challenges[
            _challengeId
        ];
        penalty = LibPrice._penalty(c.basePrice, c.createdAt, c.maturity);
        priceMinusPenalty = c.basePrice - penalty;
    }

    function getAccumulatedFee(address _token) external view returns (uint256) {
        return CPStorage.load().stakeTokens[_token].accumulatedFee;
    }

    function winnerShare(
        uint256 _challengeId,
        address _player
    ) external view override returns (uint256) {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, c.outcome)) {
            revert IChallengePoolCommon.InvalidOutcome();
        }
        if (s.optionSupply[_challengeId][keccak256(c.outcome)].rewards == 0) {
            return 0;
        }
        IChallengePoolHandler.PlayerSupply storage playerOption = s
            .playerOptionSupply[_challengeId][_player][keccak256(c.outcome)];
        if (c.state == IChallengePoolCommon.ChallengeState.closed) {
            return
                LibPrice._computeWinnerShare(
                    _challengeId,
                    playerOption.rewards
                );
        } else if (c.state == IChallengePoolCommon.ChallengeState.cancelled) {
            return 0;
        } else {
            revert IChallengePoolCommon.ActionNotAllowedForState(c.state);
        }
    }

    function stakeAirDrop() external view override returns (uint256) {
        return AirDropStorage.load().stakeAirDrop;
    }

    function maxClaim() external view override returns (uint256) {
        return AirDropStorage.load().maxClaim;
    }

    function paymaster() external view override returns (address) {
        return AirDropStorage.load().paymaster;
    }

    function minPoolMaturity() external view override returns (uint256) {
        return AirDropStorage.load().minPoolMaturity;
    }
}
