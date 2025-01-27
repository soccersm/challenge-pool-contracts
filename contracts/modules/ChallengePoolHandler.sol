// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolHandler.sol";
import "../libraries/LibPrice.sol";
import "../libraries/LibTransfer.sol";
import "../libraries/LibPool.sol";

import "../utils/Helpers.sol";
import "../utils/Errors.sol";

import "./TopicRegistry.sol";

import "../diamond/interfaces/SoccersmRoles.sol";

contract ChallengePoolHandler is IChallengePoolHandler, SoccersmRoles, Helpers {
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
                !compareBytes(_prediction, yes) &&
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
            LibPool._validateOptions(t, _events[0], poolOptions);
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
            if (maturity < _events[i].maturity) {
                maturity = _events[i].maturity;
            }
            LibPool._validateEvent(t, _events[i]);
        }
        uint256 fee = LibPool._computeCreateFee(_basePrice);
        LibPool._recordFee(_stakeToken, fee);
        uint256 totalPrice = _basePrice * _quantity;
        s.poolSupply[s.challengeId] = Supply(_quantity, totalPrice);
        s.optionSupply[s.challengeId][_prediction] = OptionSupply(
            false,
            _quantity,
            totalPrice
        );
        s.playerOptionSupply[msg.sender][s.challengeId][
            _prediction
        ] = PlayerSupply(false, _quantity, totalPrice);
        LibPool._depositOrPaymaster(_paymaster, _stakeToken, totalPrice + fee);
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
            poolOptions,
            false,
            0
        );
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
            // multi,
        );
        s.challengeId += 1;
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
        if (_deadline < block.timestamp) {
            revert DeadlineExceeded();
        }
        uint256 currentPrice = LibPool._price(
            _challengeId,
            _prediction,
            _quantity,
            PoolAction.stake
        );
        if (currentPrice > _maxPrice) {
            revert MaxPriceExceeded();
        }
        // if (!s.optionSupply[_challengeId][_prediction].exists) {
        //     revert InvalidPrediction();
        // }
        uint256 totalAmount = currentPrice * _quantity;
        uint256 fee = LibPool._computeStakeFee(currentPrice);
        PlayerSupply storage playerOptionSupply = s.playerOptionSupply[
            msg.sender
        ][_challengeId][_prediction];
        playerOptionSupply.stakes += _quantity;
        playerOptionSupply.tokens += totalAmount;
        s.playerSupply[msg.sender][_challengeId].stakes += _quantity;
        s.playerSupply[msg.sender][_challengeId].tokens += totalAmount;
        s.optionSupply[_challengeId][_prediction].stakes += _quantity;
        s.optionSupply[_challengeId][_prediction].tokens += totalAmount;
        s.poolSupply[_challengeId].stakes += _quantity;
        s.poolSupply[_challengeId].tokens += totalAmount;
        LibPool._recordFee(s.challenges[_challengeId].stakeToken, fee);
        LibPool._depositOrPaymaster(
            _paymaster,
            s.challenges[_challengeId].stakeToken,
            fee + totalAmount
        );
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
        uint256 currentPrice = LibPool._price(
            _challengeId,
            _prediction,
            _quantity,
            PoolAction.withdraw
        );
        if (currentPrice < _minPrice) {
            revert BelowMinPrie();
        }
        // if (!s.optionSupply[_challengeId][_prediction].exists) {
        //     revert InvalidPrediction();
        // }
        uint256 totalAmount = currentPrice * _quantity;
        uint256 fee = LibPool._computeEarlyWithdrawFee(currentPrice);
        PlayerSupply storage playerOptionSupply = s.playerOptionSupply[
            msg.sender
        ][_challengeId][_prediction];
        if (playerOptionSupply.stakes < _quantity) {
            revert InsufficientStakes(_quantity, playerOptionSupply.stakes);
        }
        playerOptionSupply.stakes -= _quantity;
        playerOptionSupply.tokens -= totalAmount;
        s.playerSupply[msg.sender][_challengeId].stakes -= _quantity;
        s.playerSupply[msg.sender][_challengeId].tokens -= totalAmount;
        s.optionSupply[_challengeId][_prediction].stakes -= _quantity;
        s.optionSupply[_challengeId][_prediction].tokens -= totalAmount;
        s.poolSupply[_challengeId].stakes -= _quantity;
        s.poolSupply[_challengeId].tokens -= totalAmount;
        LibPool._recordFee(s.challenges[_challengeId].stakeToken, fee);
        LibTransfer._receive(s.challenges[_challengeId].stakeToken, fee);

        LibTransfer._send(
            s.challenges[_challengeId].stakeToken,
            totalAmount,
            msg.sender
        );
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
            LibPool._withdrawWinnigs(_challengeId);
        } else if (state == ChallengeState.cancelled) {
            LibPool._withdrawAfterCancelled(_challengeId);
        } else {
            revert ActionNotAllowedForState(state);
        }
    }

    function bulkWithdraw(uint256[] calldata _challengeIds) external override {
        for (uint i = 0; i < _challengeIds.length; i++) {
            LibPool._withdrawWinnigs(_challengeIds[i]);
        }
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
        validChallenge(_challengeId)
        poolInState(_challengeId, ChallengeState.open)
        returns (uint256)
    {
        return LibPool._price(_challengeId, _option, _quantity, _action);
    }

    function getChallenge(
        uint256 _challengeId
    )
        external
        view
        override
        validChallenge(_challengeId)
        returns (Challenge memory)
    {
        return CPStorage.load().challenges[_challengeId];
    }

    function earlyWithdrawFee(
        uint256 _price
    )
        external
        view
        virtual
        override
        returns (uint256 fee, uint256 feePlusPrice)
    {
        fee = LibPool._computeEarlyWithdrawFee(_price);
        feePlusPrice = _price + fee;
    }

    function createFee(
        uint256 _price
    )
        external
        view
        virtual
        override
        returns (uint256 fee, uint256 feePlusPrice)
    {
        fee = LibPool._computeCreateFee(_price);
        feePlusPrice = _price + fee;
    }

    function stakeFee(
        uint256 _price
    )
        external
        view
        virtual
        override
        returns (uint256 fee, uint256 feePlusPrice)
    {
        fee = LibPool._computeStakeFee(_price);
        feePlusPrice = _price + fee;
    }
}
