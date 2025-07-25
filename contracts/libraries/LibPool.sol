// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolHandler.sol";
import "../interfaces/IChallengePoolCommon.sol";

import "../interfaces/IPoolResolver.sol";
import "../interfaces/IDataProvider.sol";
import "./LibTransfer.sol";
import "./LibPrice.sol";
import "../utils/Helpers.sol";
import "../interfaces/ICommunity.sol";

library LibPool {
    function _initPool(
        address _stakeToken,
        IChallengePoolCommon.ChallengeEvent[] calldata _events,
        bytes[] memory _options,
        bool _multi,
        bytes calldata _prediction,
        uint256 _maturity,
        uint256 _basePrice,
        uint256 _quantity,
        uint256 _totalAmount,
        uint256 _fee,
        address _caller,
        bytes32 _communityId,
        IChallengePoolCommon.ChallengeType _cType
    ) internal {
        CPStore storage s = CPStorage.load();
        uint256 rewardPoints = LibPrice._stakeRewardPoints(
            _quantity,
            block.timestamp,
            _maturity
        );
        s.playerOptionSupply[s.challengeId][_caller][
            keccak256(_prediction)
        ] = IChallengePoolHandler.PlayerSupply(
            false,
            _quantity,
            _totalAmount,
            rewardPoints
        );
        s.playerSupply[s.challengeId][_caller] = IChallengePoolHandler
            .PlayerSupply(false, _quantity, _totalAmount, rewardPoints);
        s.optionSupply[s.challengeId][
            keccak256(_prediction)
        ] = IChallengePoolHandler.OptionSupply(
            true,
            _quantity,
            _totalAmount,
            rewardPoints
        );
        s.poolSupply[s.challengeId] = IChallengePoolHandler.Supply(
            _quantity,
            _totalAmount
        );

        s.challenges[s.challengeId] = IChallengePoolCommon.Challenge(
            IChallengePoolCommon.ChallengeState.open,
            _multi,
            HelpersLib.emptyBytes,
            block.timestamp,
            _maturity,
            _basePrice,
            _stakeToken,
            _events,
            _options,
            false,
            0,
            _communityId,
            _cType
        );
        if (_communityId != bytes32(0)) {
            emit ICommunity.NewCommunityChallenge(
                s.challengeId,
                _caller,
                block.timestamp,
                _maturity,
                IChallengePoolCommon.ChallengeState.open,
                HelpersLib.emptyBytes,
                _basePrice,
                _fee,
                _quantity,
                _totalAmount,
                rewardPoints,
                _prediction,
                _events,
                _options,
                _stakeToken,
                _multi,
                _communityId,
                _cType
            );
        } else {
            emit IChallengePoolHandler.NewChallenge(
                s.challengeId,
                _caller,
                block.timestamp,
                _maturity,
                IChallengePoolCommon.ChallengeState.open,
                HelpersLib.emptyBytes,
                _basePrice,
                _fee,
                _quantity,
                _totalAmount,
                rewardPoints,
                _prediction,
                _events,
                _options,
                _stakeToken,
                _multi
            );
        }

        s.challengeId += 1;
    }

    function _incrementSupply(
        CPStore storage s,
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _totalAmount,
        uint256 _rewardPoints,
        address _caller
    ) internal {
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[_challengeId][_caller][keccak256(_prediction)];
        playerOptionSupply.stakes += _quantity;
        playerOptionSupply.tokens += _totalAmount;
        playerOptionSupply.rewards += _rewardPoints;
        s.playerSupply[_challengeId][_caller].stakes += _quantity;
        s.playerSupply[_challengeId][_caller].tokens += _totalAmount;
        s.playerSupply[_challengeId][_caller].rewards += _rewardPoints;
        s
        .optionSupply[_challengeId][keccak256(_prediction)].stakes += _quantity;
        s
        .optionSupply[_challengeId][keccak256(_prediction)]
            .tokens += _totalAmount;
        s
        .optionSupply[_challengeId][keccak256(_prediction)]
            .rewards += _rewardPoints;
        s.poolSupply[_challengeId].stakes += _quantity;
        s.poolSupply[_challengeId].tokens += _totalAmount;
    }

    function _decrementSupply(
        CPStore storage s,
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _totalAmount,
        uint256 _rewardPoints,
        address _caller
    ) internal {
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[_challengeId][_caller][keccak256(_prediction)];
        playerOptionSupply.stakes -= _quantity;
        playerOptionSupply.tokens -= _totalAmount;
        playerOptionSupply.rewards -= _rewardPoints;
        s.playerSupply[_challengeId][_caller].stakes -= _quantity;
        s.playerSupply[_challengeId][_caller].tokens -= _totalAmount;
        s.playerSupply[_challengeId][_caller].rewards -= _rewardPoints;
        s
        .optionSupply[_challengeId][keccak256(_prediction)].stakes -= _quantity;
        s
        .optionSupply[_challengeId][keccak256(_prediction)]
            .tokens -= _totalAmount;
        s
        .optionSupply[_challengeId][keccak256(_prediction)]
            .rewards -= _rewardPoints;
        s.poolSupply[_challengeId].stakes -= _quantity;
        s.poolSupply[_challengeId].tokens -= _totalAmount;
    }

    function _validateEvent(
        TRStore storage t,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) internal {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        IDataProvider provider = t.registry[_event.topicId].dataProvider;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(
                IPoolResolver.validateEvent.selector,
                provider,
                _event
            )
        );
        if (!success) {
            revert DelegateCallFailed("LibPool._validateEvent");
        }
        bool validParam = abi.decode(result, (bool));
        if (!validParam) {
            revert IChallengePoolCommon.InvalidEventParam();
        }
    }

    function _resolveEvent(
        TRStore storage t,
        IChallengePoolHandler.ChallengeEvent memory _event,
        bytes[] memory _options
    ) internal returns (bytes memory) {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        IDataProvider provider = t.registry[_event.topicId].dataProvider;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(
                IPoolResolver.resolveEvent.selector,
                provider,
                _event,
                _options
            )
        );
        if (!success) {
            revert DelegateCallFailed("LibPool._resolveEvent");
        }
        return abi.decode(result, (bytes));
    }

    function _validateOptions(
        TRStore storage t,
        IChallengePoolHandler.ChallengeEvent calldata _event,
        bytes[] memory _options
    ) internal {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        IDataProvider provider = t.registry[_event.topicId].dataProvider;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(
                IPoolResolver.validateOptions.selector,
                provider,
                _event,
                _options
            )
        );
        if (!success) {
            revert DelegateCallFailed("LibPool._validateOptions");
        }

        bool validParam = abi.decode(result, (bool));
        if (!validParam) {
            revert IChallengePoolCommon.InvalidEventParam();
        }
    }

    function _poolState(
        IChallengePoolHandler.Challenge storage _challenge
    ) internal view returns (IChallengePoolHandler.ChallengeState) {
        if (_challenge.state == IChallengePoolCommon.ChallengeState.open) {
            if (block.timestamp >= _challenge.maturity) {
                return IChallengePoolCommon.ChallengeState.matured;
            }
        }
        return _challenge.state;
    }

    function _recordFee(address _token, uint256 _fee) internal {
        CPStorage.load().stakeTokens[_token].accumulatedFee += _fee;
    }

    function _withdrawWinnigs(uint256 _challengeId, address _caller) internal {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, c.outcome)) {
            revert IChallengePoolCommon.InvalidOutcome();
        }
        if (s.optionSupply[_challengeId][keccak256(c.outcome)].rewards == 0) {
            return _withdrawAfterCancelled(_challengeId, _caller);
        }
        if (s.playerSupply[_challengeId][_caller].stakes == 0) {
            revert IChallengePoolCommon.PlayerNotInPool();
        }
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[_challengeId][_caller][keccak256(c.outcome)];
        if (playerOptionSupply.withdrawn) {
            revert IChallengePoolCommon.PlayerAlreadyWithdrawn();
        }
        if (playerOptionSupply.stakes == 0) {
            revert IChallengePoolCommon.PlayerDidNotWinPool();
        }
        playerOptionSupply.withdrawn = true;
        uint256 playerShare = LibPrice._computeWinnerShare(
            _challengeId,
            playerOptionSupply.rewards
        );
        uint256 totalAmount = playerShare + playerOptionSupply.tokens;
        LibTransfer._send(c.stakeToken, totalAmount, _caller);
        emit IChallengePoolHandler.WinningsWithdrawn(
            _challengeId,
            _caller,
            playerShare,
            totalAmount
        );
    }

    function _withdrawAfterCancelled(
        uint256 _challengeId,
        address _caller
    ) internal {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        if (s.playerSupply[_challengeId][_caller].stakes == 0) {
            revert IChallengePoolCommon.PlayerNotInPool();
        }
        if (s.playerSupply[_challengeId][_caller].withdrawn) {
            revert IChallengePoolCommon.PlayerAlreadyWithdrawn();
        }
        s.playerSupply[_challengeId][_caller].withdrawn = true;
        uint256 totalAmount = s.playerSupply[_challengeId][_caller].tokens;
        LibTransfer._send(c.stakeToken, totalAmount, _caller);
        emit IChallengePoolHandler.WinningsWithdrawn(
            _challengeId,
            _caller,
            0,
            totalAmount
        );
    }

    function _withdraw(uint256 _challengeId, address _caller) internal {
        IChallengePoolCommon.ChallengeState state = CPStorage
            .load()
            .challenges[_challengeId]
            .state;

        if (state == IChallengePoolCommon.ChallengeState.closed) {
            _withdrawWinnigs(_challengeId, _caller);
        } else if (state == IChallengePoolCommon.ChallengeState.cancelled) {
            _withdrawAfterCancelled(_challengeId, _caller);
        } else {
            revert IChallengePoolCommon.ActionNotAllowedForState(state);
        }
    }
}
