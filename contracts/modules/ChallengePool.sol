// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/LibData.sol";
import "../interfaces/IChallengePool.sol";
import "../libraries/LibPrice.sol";

import "../utils/Helpers.sol";

import "./TopicRegistry.sol";

contract ChallengePool is IChallengePool, Helpers {
    modifier validChallenge(uint256 _challengeId) {
        if (_challengeId >= CPStorage.load().challengeId) {
            revert InvalidChallenge();
        }
        _;
    }

    modifier poolInState(uint256 _challengeId, ChallengeState _state) {
        ChallengeState currentState = _poolState(
            CPStorage.load().challenges[_challengeId]
        );
        if (currentState != _state) {
            revert ActionNotAllowedForState(currentState);
        }
        _;
    }

    modifier validStake(uint256 _stake) {
        if (_stake < CPStorage.load().minStakeAmount) {
            revert StakeLowerThanMinimum();
        }
        _;
    }

    modifier validPrediction(bytes memory _prediction) {
        if (compareBytes(_prediction, emptyBytes)) {
            revert InvalidPrediction();
        }
        _;
    }

    modifier supportedToken(address _token) {
        if (!CPStorage.load().stakeTokens[_token].active) {
            revert UnsupportedToken(_token);
        }
        _;
    }

    function _poolState(
        Challenge storage _challenge
    ) internal view returns (ChallengeState) {
        if (_challenge.state == ChallengeState.open) {
            if (block.timestamp >= _challenge.maturity) {
                return ChallengeState.matured;
            }
        }
        return _challenge.state;
    }

    function _deposit(address _token, uint256 _amount) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(_token),
            msg.sender,
            address(this),
            _amount
        );
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _depositFromPaymaster(
        address _paymaster,
        address _token,
        uint256 _amount
    ) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        IPaymaster(_paymaster).payFor(_token, msg.sender, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _send(address _token, uint256 _amount) internal {
        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(_token), msg.sender, _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _computeWinnerShare(
        uint256 _challengeId,
        uint256 stakes
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        uint256 winnerStakes = s.optionSupply[_challengeId][c.outcome].stakes;
        uint256 winnerTokens = s.optionSupply[_challengeId][c.outcome].tokens;
        uint256 looserTokens = s.poolSupply[_challengeId].tokens - winnerTokens;
        return Math.mulDiv(looserTokens, stakes, winnerStakes);
    }

    function _withdrawWinnigs(uint256 _challengeId) internal {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (compareBytes(emptyBytes, c.outcome)) {
            revert InvalidOutcome();
        }
        PlayerSupply storage playerSupply = s.playerSupply[msg.sender][
            _challengeId
        ][c.outcome];
        if (playerSupply.withdrawn) {
            revert PlayerAlreadyWithdrawn();
        }
        if (playerSupply.stakes == 0) {
            revert PlayerDidNotWinPool();
        }
        playerSupply.withdrawn = true;
        uint256 playerShare = _computeWinnerShare(
            _challengeId,
            playerSupply.stakes
        );
        uint256 totalAmount = playerShare + playerSupply.tokens;
        _send(c.stakeToken, totalAmount);
        emit WinningsWithdrawn(
            msg.sender,
            _challengeId,
            playerShare,
            totalAmount
        );
    }

    function _computeJoinFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return basisPoint(_stakePrice, CPStorage.load().joinPoolFee);
    }

    function _computeCreateFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return basisPoint(_stakePrice, CPStorage.load().createPoolFee);
    }

    function _validateEvent(
        TRStore storage t,
        ChallengeEvent memory _event
    ) internal {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(IPoolResolver.validateEvent.selector, _event)
        );
        if (!success) {
            revert DelegateCallFailed("_validateEvent");
        }
        bool validParam = abi.decode(result, (bool));
        if (!validParam) {
            revert InvalidEventParam();
        }
    }

    function _validateOptions(
        TRStore storage t,
        ChallengeEvent memory _event,
        bytes[] memory _options
    ) internal {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        IDataProvider provider = t.registry[_event.topicId].dataProvider;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(
                IPoolResolver.validateOptions.selector,
                provider,
                _options
            )
        );
        if (!success) {
            revert DelegateCallFailed("_validateOptions");
        }
        bool validParam = abi.decode(result, (bool));
        if (!validParam) {
            revert InvalidEventParam();
        }
    }

    function createChallenge(
        ChallengeEvent[] calldata _events,
        bytes[] calldata _options,
        address _stakeToken,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _basePrice,
        address _paymaster
    )
        external
        override
        nonZero(_quantity)
        nonZero(_basePrice)
        positiveAddress(_stakeToken)
        supportedToken(_stakeToken)
        validStake(_basePrice)
        validPrediction(_prediction)
    {
        CPStore storage s = CPStorage.load();
        if (_events.length == 0) {
            revert InvalidEventLength();
        }
        if (_options.length > s.maxOptionsPerPool) {
            revert InvalidOptionsLength();
        }
        TRStore storage t = TRStorage.load();
        bytes[] memory poolOptions;
        bool multi;
        if (_options.length == 0) {
            multi = false;
            if (_events.length > 1) {
                revert InvalidEventLength();
            }
            poolOptions = Helpers.yesNoOptions();
            if (
                !compareBytes(_prediction, poolOptions[0]) ||
                !compareBytes(_prediction, poolOptions[1])
            ) {
                revert InvalidPrediction();
            }
        } else {
            multi = true;
            if (_options.length == 1) {
                revert InvalidOptionsLength();
            }
            poolOptions = _options;
            _validateOptions(t, _events[0], poolOptions);
            bool predictionExists = false;
            for (uint i = 0; i < _options.length; i++) {
                if (compareBytes(emptyBytes, poolOptions[i])) {
                    revert InvalidPoolOption();
                }
                if (compareBytes(_prediction, poolOptions[i])) {
                    predictionExists = true;
                }
                s.optionSupply[s.challengeId][poolOptions[i]].exists = true;
            }
            if (!predictionExists) {
                revert InvalidPrediction();
            }
        }
        uint256 maturity;
        for (uint i = 0; i < _events.length; i++) {
            if (
                t.registry[_events[i].topicId].state ==
                ITopicRegistry.TopicState.disabled
            ) {
                revert InvalidEventTopic();
            }
            if (_events[i].maturity < (block.timestamp + s.minMaturityPeriod)) {
                revert InvalidEventMaturity();
            }
            _validateEvent(t, _events[i]);
        }
        uint256 fee = _computeCreateFee(_basePrice);
        uint256 totalPrice = _basePrice * _quantity;
        s.poolSupply[s.challengeId] = Supply(_quantity, totalPrice);
        s.optionSupply[s.challengeId][_prediction] = OptionSupply(
            false,
            _quantity,
            totalPrice
        );
        s.playerSupply[msg.sender][s.challengeId][_prediction] = PlayerSupply(
            false,
            _quantity,
            totalPrice
        );
        if (_paymaster == address(0)) {
            _deposit(_stakeToken, totalPrice + fee);
        } else {
            _depositFromPaymaster(_paymaster, _stakeToken, totalPrice + fee);
        }
        s.challenges[s.challengeId] = Challenge(
            ChallengeState.open,
            multi,
            emptyBytes,
            _quantity,
            block.timestamp,
            maturity,
            _basePrice,
            _stakeToken,
            _events,
            poolOptions
        );
        s.challengeId += 1;
        emit NewChallenge(
            s.challengeId,
            msg.sender,
            block.timestamp,
            maturity,
            ChallengeState.open,
            emptyBytes,
            _basePrice,
            fee,
            _quantity,
            _prediction,
            _events,
            poolOptions,
            _stakeToken,
            _paymaster
        );
    }

    function stake(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _maxPrice,
        uint256 _deadline,
        address _paymaster
    ) external override poolInState(_challengeId, ChallengeState.open) {
        CPStore storage s = CPStorage.load();
    }

    function withdraw(
        uint256 _challengeId
    )
        external
        override
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.closed)
    {
        _withdrawWinnigs(_challengeId);
    }

    function bulkWithdraw(uint256[] calldata _challengeIds) external override {
        for (uint i = 0; i < _challengeIds.length; i++) {
            _withdrawWinnigs(_challengeIds[i]);
        }
    }

    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _minPrice,
        uint256 _deadline
    ) external override {
        CPStore storage s = CPStorage.load();
    }

    function price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity
    ) external view override returns (uint256) {
        if (
            CPStorage.load().challenges[_challengeId].maturity >=
            block.timestamp
        ) {
            revert ChallengePoolClosed();
        }
        return _simplePrice(_challengeId, _option, _quantity);
    }

    function _price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        return
            LibPrice.computeOptionPrice(
                s.challenges[_challengeId].basePrice,
                s.poolSupply[_challengeId].stakes,
                s.optionSupply[_challengeId][_option].stakes,
                s.challenges[_challengeId].maturity - block.timestamp,
                _quantity
            );
    }

    function _simplePrice(
        uint256 _challengeId,
        bytes calldata /*_option*/,
        uint256 /*_quantity*/
    ) internal view returns (uint256) {
        CPStore storage s = CPStorage.load();
        return LibPrice.simplePrice(s.challenges[_challengeId].basePrice);
    }

    function getChallenge(
        uint256 _challengeId
    ) external view validChallenge(_challengeId) returns (Challenge memory) {
        return CPStorage.load().challenges[_challengeId];
    }
}
