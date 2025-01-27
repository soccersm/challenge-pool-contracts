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
    function _recordFee(address _token, uint256 _fee) internal {
        CPStorage.load().stakeTokens[_token].accumulatedFee += _fee;
    }

    function _computeWinnerShare(
        uint256 _challengeId,
        uint256 stakes
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        uint256 winnerStakes = s.optionSupply[_challengeId][c.outcome].stakes;
        uint256 winnerTokens = s.optionSupply[_challengeId][c.outcome].tokens;
        uint256 looserTokens = s.poolSupply[_challengeId].tokens - winnerTokens;
        return Math.mulDiv(looserTokens, stakes, winnerStakes);
    }

    function _withdrawWinnigs(uint256 _challengeId) internal {
        CPStore storage s = CPStorage.load();
        IChallengePoolHandler.Challenge storage c = s.challenges[_challengeId];
        if (HelpersLib.compareBytes(HelpersLib.emptyBytes, c.outcome)) {
            revert IChallengePoolCommon.InvalidOutcome();
        }
        if (s.playerSupply[msg.sender][_challengeId].stakes == 0) {
            revert IChallengePoolCommon.PlayerNotInPool();
        }
        IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
            .playerOptionSupply[msg.sender][_challengeId][c.outcome];
        if (playerOptionSupply.withdrawn) {
            revert IChallengePoolCommon.PlayerAlreadyWithdrawn();
        }
        if (playerOptionSupply.stakes == 0) {
            revert IChallengePoolCommon.PlayerDidNotWinPool();
        }
        playerOptionSupply.withdrawn = true;
        uint256 playerShare = _computeWinnerShare(
            _challengeId,
            playerOptionSupply.stakes
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
        if (s.playerSupply[msg.sender][_challengeId].stakes == 0) {
            revert IChallengePoolCommon.PlayerNotInPool();
        }
        if (s.playerSupply[msg.sender][_challengeId].withdrawn) {
            revert IChallengePoolCommon.PlayerAlreadyWithdrawn();
        }
        s.playerSupply[msg.sender][_challengeId].withdrawn = true;
        uint256 totalAmount = s.playerSupply[msg.sender][_challengeId].tokens;
        LibTransfer._send(c.stakeToken, totalAmount, msg.sender);
        emit IChallengePoolHandler.WinningsWithdrawn(
            _challengeId,
            msg.sender,
            0,
            totalAmount
        );
    }

    function _computeStakeFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return HelpersLib.basisPoint(_stakePrice, CPStorage.load().stakeFee);
    }

    function _computeCreateFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return
            HelpersLib.basisPoint(_stakePrice, CPStorage.load().createPoolFee);
    }

    function _computeEarlyWithdrawFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return
            HelpersLib.basisPoint(
                _stakePrice,
                CPStorage.load().earlyWithdrawFee
            );
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

    function _depositOrPaymaster(
        address _paymaster,
        address _token,
        uint256 _amount
    ) internal {
        if (_paymaster == address(0)) {
            LibTransfer._receive(_token, _amount);
        } else {
            LibTransfer._depositFromPaymaster(_paymaster, _token, _amount);
        }
    }

    function _price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        IChallengePoolHandler.PoolAction _action
    ) internal view returns (uint256) {
        return _simplePrice(_challengeId, _option, _quantity, _action);
    }

    function _optionPrice(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        IChallengePoolHandler.PoolAction _action
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        return
            LibPrice.computeOptionPrice(
                s.challenges[_challengeId].basePrice,
                s.poolSupply[_challengeId].stakes,
                s.optionSupply[_challengeId][_option].stakes,
                s.challenges[_challengeId].maturity - block.timestamp,
                _quantity,
                _action
            );
    }

    function _simplePrice(
        uint256 _challengeId,
        bytes calldata /*_option*/,
        uint256 /*_quantity*/,
        IChallengePoolHandler.PoolAction /*_action*/
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        return LibPrice.simplePrice(s.challenges[_challengeId].basePrice);
    }
}
