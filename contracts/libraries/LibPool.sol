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

library LibPool {
    function _initPool(
        CPStore storage s,
        address _stakeToken,
        IChallengePoolCommon.ChallengeEvent[] calldata _events,
        bool _multi,
        bytes calldata _prediction,
        uint256 _maturity,
        uint256 _basePrice,
        uint256 _quantity,
        uint256 _totalAmount
    ) internal {
        uint256 rewardPoints = LibPrice._stakeRewardPoints(
            _quantity,
            block.timestamp,
            _maturity
        );
        s.playerOptionSupply[s.challengeId][msg.sender][
            keccak256(_prediction)
        ] = IChallengePoolHandler.PlayerSupply(
            false,
            _quantity,
            _totalAmount,
            rewardPoints
        );
        s.playerSupply[s.challengeId][msg.sender] = IChallengePoolHandler
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
            false,
            0
        );
    }

    function _incrementSupply(
        CPStore storage s,
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _totalAmount,
        uint256 _rewardPoints
    ) internal {
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[_challengeId][msg.sender][
                keccak256(_prediction)
            ];
        playerOptionSupply.stakes += _quantity;
        playerOptionSupply.tokens += _totalAmount;
        playerOptionSupply.rewards += _rewardPoints;
        s.playerSupply[_challengeId][msg.sender].stakes += _quantity;
        s.playerSupply[_challengeId][msg.sender].tokens += _totalAmount;
        s.playerSupply[_challengeId][msg.sender].rewards += _rewardPoints;
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
        uint256 _rewardPoints
    ) internal {
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[_challengeId][msg.sender][
                keccak256(_prediction)
            ];
        playerOptionSupply.stakes -= _quantity;
        playerOptionSupply.tokens -= _totalAmount;
        playerOptionSupply.rewards -= _rewardPoints;
        s.playerSupply[_challengeId][msg.sender].stakes -= _quantity;
        s.playerSupply[_challengeId][msg.sender].tokens -= _totalAmount;
        s.playerSupply[_challengeId][msg.sender].rewards -= _rewardPoints;
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
        IChallengePoolHandler.ChallengeEvent memory _event
    ) internal returns (bytes memory) {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        IDataProvider provider = t.registry[_event.topicId].dataProvider;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(
                IPoolResolver.resolveEvent.selector,
                provider,
                _event
            )
        );
        if (!success) {
            revert DelegateCallFailed("LibPool._resolveEvent");
        }
        return result;
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

    function _withdrawWinnigs(uint256 _challengeId) internal {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, c.outcome)) {
            revert IChallengePoolCommon.InvalidOutcome();
        }
        if (s.playerSupply[_challengeId][msg.sender].stakes == 0) {
            revert IChallengePoolCommon.PlayerNotInPool();
        }
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[_challengeId][msg.sender][keccak256(c.outcome)];
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
        LibTransfer._send(c.stakeToken, totalAmount, msg.sender);
        emit IChallengePoolHandler.WinningsWithdrawn(
            _challengeId,
            msg.sender,
            playerShare,
            totalAmount
        );
    }

    function _withdrawAfterCancelled(uint256 _challengeId) internal {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        if (s.playerSupply[_challengeId][msg.sender].stakes == 0) {
            revert IChallengePoolCommon.PlayerNotInPool();
        }
        if (s.playerSupply[_challengeId][msg.sender].withdrawn) {
            revert IChallengePoolCommon.PlayerAlreadyWithdrawn();
        }
        s.playerSupply[_challengeId][msg.sender].withdrawn = true;
        uint256 totalAmount = s.playerSupply[_challengeId][msg.sender].tokens;
        LibTransfer._send(c.stakeToken, totalAmount, msg.sender);
        emit IChallengePoolHandler.WinningsWithdrawn(
            _challengeId,
            msg.sender,
            0,
            totalAmount
        );
    }

    function _withdraw(uint256 _challengeId) internal {
        IChallengePoolCommon.ChallengeState state = CPStorage
            .load()
            .challenges[_challengeId]
            .state;

        if (state == IChallengePoolCommon.ChallengeState.closed) {
            _withdrawWinnigs(_challengeId);
        } else if (state == IChallengePoolCommon.ChallengeState.cancelled) {
            _withdrawAfterCancelled(_challengeId);
        } else {
            revert IChallengePoolCommon.ActionNotAllowedForState(state);
        }
    }
}
