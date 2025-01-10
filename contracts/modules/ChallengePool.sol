// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/LibData.sol";
import "../interfaces/IChallengePool.sol";
import "../libraries/LibPrice.sol";

import "../utils/Helpers.sol";
import "../utils/Errors.sol";

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

    function _depositOrPaymaster(
        address _paymaster,
        address _token,
        uint256 _amount
    ) internal {
        if (_paymaster == address(0)) {
            _deposit(_token, _amount);
        } else {
            _depositFromPaymaster(_paymaster, _token, _amount);
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

    function _recordFee(address _token, uint256 _fee) internal {
        CPStorage.load().stakeTokens[_token].accumulatedFee += _fee;
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
            _challengeId,
            msg.sender,
            playerShare,
            totalAmount
        );
    }

    function _withdrawAfterCancelled(uint256 _challengeId) internal {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];

        uint256 totalAmount = 0;
        for (uint i = 0; i < c.options.length; i++) {
            PlayerSupply storage playerSupply = s.playerSupply[msg.sender][
                _challengeId
            ][c.options[i]];
            if (playerSupply.withdrawn) {
                revert PlayerAlreadyWithdrawn();
            }
            if (playerSupply.tokens > 0) {
                playerSupply.withdrawn = true;
                totalAmount += playerSupply.tokens;
            }
        }
        _send(c.stakeToken, totalAmount);
        emit WinningsWithdrawn(_challengeId, msg.sender, 0, totalAmount);
    }

    function _computeStakeFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return basisPoint(_stakePrice, CPStorage.load().stakeFee);
    }

    function _computeCreateFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return basisPoint(_stakePrice, CPStorage.load().createPoolFee);
    }

    function _computeEarlyWithdrawFee(
        uint256 _stakePrice
    ) internal view returns (uint256) {
        return basisPoint(_stakePrice, CPStorage.load().earlyWithdrawFee);
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

    function _resolveEvent(
        TRStore storage t,
        ChallengeEvent memory _event
    ) internal returns (bytes memory) {
        IPoolResolver resolver = t.registry[_event.topicId].poolResolver;
        (bool success, bytes memory result) = address(resolver).delegatecall(
            abi.encodeWithSelector(IPoolResolver.resolveEvent.selector, _event)
        );
        if (!success) {
            revert DelegateCallFailed("_resolveEvent");
        }
        return result;
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
        if (_options.length > s.maxOptionsPerPool) {
            revert InvalidOptionsLength();
        }
        TRStore storage t = TRStorage.load();
        bytes[] memory poolOptions;
        bool multi;
        if (_options.length == 0) {
            multi = false;
            if (_events.length < 1) {
                revert InvalidEventLength();
            }
            if (_events.length > s.maxEventsPerPool) {
                revert InvalidEventLength();
            }
            poolOptions = Helpers.yesNoOptions();
            if (
                !compareBytes(_prediction, yes) ||
                !compareBytes(_prediction, no)
            ) {
                revert InvalidPrediction();
            }
        } else {
            multi = true;
            if (_options.length < 2) {
                revert InvalidOptionsLength();
            }
            if (_events.length != 1) {
                revert InvalidEventLength();
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
        _recordFee(_stakeToken, fee);
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
        _depositOrPaymaster(_paymaster, _stakeToken, totalPrice + fee);
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
    )
        external
        override
        validChallenge(_challengeId)
        validPrediction(_prediction)
        nonZero(_quantity)
        nonZero(_deadline)
        nonZero(_maxPrice)
        poolInState(_challengeId, ChallengeState.open)
    {
        CPStore storage s = CPStorage.load();
        if (_deadline > block.timestamp) {
            revert DeadlineExceeded();
        }
        uint256 currentPrice = _price(
            _challengeId,
            _prediction,
            _quantity,
            PoolAction.stake
        );
        if (currentPrice > _maxPrice) {
            revert MaxPriceExceeded();
        }
        uint256 totalAmount = currentPrice * _quantity;
        uint256 fee = _computeStakeFee(currentPrice);
        _recordFee(s.challenges[_challengeId].stakeToken, fee);
        _depositOrPaymaster(
            _paymaster,
            s.challenges[_challengeId].stakeToken,
            fee + totalAmount
        );
        PlayerSupply storage playerSupply = s.playerSupply[msg.sender][
            _challengeId
        ][_prediction];
        if (playerSupply.stakes < _quantity) {
            revert InsufficientStakes(_quantity, playerSupply.stakes);
        }
        playerSupply.stakes += _quantity;
        playerSupply.tokens += totalAmount;
        s.optionSupply[_challengeId][_prediction].stakes += _quantity;
        s.optionSupply[_challengeId][_prediction].tokens += totalAmount;
        s.poolSupply[_challengeId].stakes += _quantity;
        s.poolSupply[_challengeId].tokens += totalAmount;
        _send(s.challenges[_challengeId].stakeToken, totalAmount);
        emit Stake(
            _challengeId,
            msg.sender,
            _prediction,
            _quantity,
            totalAmount,
            fee
        );
    }

    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _minPrice,
        uint256 _deadline
    )
        external
        override
        validChallenge(_challengeId)
        validPrediction(_prediction)
        nonZero(_quantity)
        nonZero(_deadline)
        nonZero(_minPrice)
        poolInState(_challengeId, ChallengeState.open)
    {
        CPStore storage s = CPStorage.load();
        if (_deadline < block.timestamp) {
            revert DeadlineExceeded();
        }
        uint256 currentPrice = _price(
            _challengeId,
            _prediction,
            _quantity,
            PoolAction.withdraw
        );
        if (currentPrice < _minPrice) {
            revert BelowMinPrie();
        }
        uint256 totalAmount = currentPrice * _quantity;
        uint256 fee = _computeEarlyWithdrawFee(currentPrice);
        _recordFee(s.challenges[_challengeId].stakeToken, fee);
        _deposit(s.challenges[_challengeId].stakeToken, fee);
        PlayerSupply storage playerSupply = s.playerSupply[msg.sender][
            _challengeId
        ][_prediction];
        if (playerSupply.stakes < _quantity) {
            revert InsufficientStakes(_quantity, playerSupply.stakes);
        }
        playerSupply.stakes -= _quantity;
        playerSupply.tokens -= totalAmount;
        s.optionSupply[_challengeId][_prediction].stakes -= _quantity;
        s.optionSupply[_challengeId][_prediction].tokens -= totalAmount;
        s.poolSupply[_challengeId].stakes -= _quantity;
        s.poolSupply[_challengeId].tokens -= totalAmount;
        _send(s.challenges[_challengeId].stakeToken, totalAmount);
        emit Withdraw(
            _challengeId,
            msg.sender,
            _prediction,
            _quantity,
            totalAmount,
            fee
        );
    }

    function withdraw(
        uint256 _challengeId
    ) external override validChallenge(_challengeId) {
        ChallengeState state = CPStorage.load().challenges[_challengeId].state;

        if (state == ChallengeState.closed) {
            _withdrawWinnigs(_challengeId);
        } else if (state == ChallengeState.cancelled) {
            _withdrawAfterCancelled(_challengeId);
        } else {
            revert ActionNotAllowedForState(state);
        }
    }

    function bulkWithdraw(uint256[] calldata _challengeIds) external override {
        for (uint i = 0; i < _challengeIds.length; i++) {
            _withdrawWinnigs(_challengeIds[i]);
        }
    }

    function close(
        uint256 _challengeId
    ) external override poolInState(_challengeId, ChallengeState.open) {
        TRStore storage t = TRStorage.load();
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        if (compareBytes(emptyBytes, c.outcome)) {
            revert InvalidOutcome();
        }
        c.state = ChallengeState.closed;
        bytes memory result = emptyBytes;
        if (c.multi) {
            bool allCorrect = true;
            for (uint i = 0; i < c.events.length; i++) {
                if (
                    t.registry[c.events[i].topicId].state ==
                    ITopicRegistry.TopicState.disabled
                ) {
                    revert InvalidEventTopic();
                }
                if (
                    c.events[i].maturity <
                    (block.timestamp + s.minMaturityPeriod)
                ) {
                    revert InvalidEventMaturity();
                }
                if (compareBytes(no, _resolveEvent(t, c.events[i]))) {
                    allCorrect = false;
                }
            }
            if (allCorrect) {
                c.outcome = yes;
                result = yes;
            } else {
                c.outcome = no;
                result = no;
            }
        } else {
            c.outcome = _resolveEvent(t, c.events[0]);
        }

        emit ClosedChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.closed,
            result
        );
    }

    function cancel(
        uint256 _challengeId
    ) external override poolInState(_challengeId, ChallengeState.open) {
        CPStore storage s = CPStorage.load();
        Challenge storage c = s.challenges[_challengeId];
        c.state = ChallengeState.cancelled;
        emit CancelChallenge(
            _challengeId,
            msg.sender,
            ChallengeState.cancelled
        );
    }

    function price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        PoolAction _action
    )
        external
        view
        override
        poolInState(_challengeId, ChallengeState.open)
        returns (uint256)
    {
        return _price(_challengeId, _option, _quantity, _action);
    }

    function _price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        PoolAction _action
    ) internal view returns (uint256) {
        return _simplePrice(_challengeId, _option, _quantity, _action);
    }

    function _optionPrice(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        PoolAction _action
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
        PoolAction /*_action*/
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
