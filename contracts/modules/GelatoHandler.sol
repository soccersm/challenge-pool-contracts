// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@solidstate/contracts/security/pausable/PausableInternal.sol";
import "@solidstate/contracts/security/reentrancy_guard/ReentrancyGuard.sol";

import "../libraries/LibData.sol";
import "../interfaces/IChallengePoolHandler.sol";
import "../interfaces/IGelatoHandler.sol";
import "../libraries/LibPrice.sol";
import "../libraries/LibTransfer.sol";
import "../libraries/LibPool.sol";

import "../utils/Helpers.sol";
import "../utils/Errors.sol";

import "./TopicRegistry.sol";

import "../diamond/interfaces/SoccersmRoles.sol";
import "../utils/ChallengePoolHelpers.sol";
import "../utils/ERC2771Context.sol";

contract GelatoHandler is
    IGelatoHandler,
    SoccersmRoles,
    Helpers,
    ChallengePoolHelpers,
    PausableInternal,
    ReentrancyGuard,
    ERC2771Context
{
    function createChallengeRelay(
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
        whenNotPaused
        nonZero(_quantity)
        nonZero(_basePrice)
        positiveAddress(_stakeToken)
        supportedToken(_stakeToken)
        validStake(_basePrice)
        validPrediction(_prediction)
    {
        CPStore storage s = CPStorage.load();
        if (_events.length < 1) {
            revert InvalidEventLength();
        }
        if (_events.length > s.maxEventsPerPool) {
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
            poolOptions = HelpersLib.yesNoOptions();
        } else {
            multi = true;
            if (_options.length < 2) {
                revert InvalidOptionsLength();
            }
            if (_events.length > 1) {
                revert InvalidEventLength();
            }
            poolOptions = _options;
            LibPool._validateOptions(t, _events[0], poolOptions);
        }
        bool predictionExists = false;
        for (uint i = 0; i < poolOptions.length; i++) {
            if (
                HelpersLib.compareBytes(HelpersLib.emptyBytes, poolOptions[i])
            ) {
                revert InvalidPoolOption();
            }
            if (HelpersLib.compareBytes(_prediction, poolOptions[i])) {
                predictionExists = true;
            }
            s
            .optionSupply[s.challengeId][keccak256(poolOptions[i])]
                .exists = true;
        }
        if (!predictionExists) {
            revert InvalidPrediction();
        }
        uint256 maturity = HelpersLib.largestInt;
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
            if (maturity > _events[i].maturity) {
                maturity = _events[i].maturity;
            }
            LibPool._validateEvent(t, _events[i]);
        }
        uint256 fee = LibPrice._computeCreateFee(_basePrice);
        LibPool._recordFee(_stakeToken, fee);
        uint256 totalAmount = _basePrice * _quantity;

        LibPool._initPool(
            _stakeToken,
            _events,
            poolOptions,
            multi,
            _prediction,
            maturity,
            _basePrice,
            _quantity,
            totalAmount,
            fee,
            msg.sender
        );
        LibTransfer._depositOrPaymaster(
            _paymaster,
            _stakeToken,
            totalAmount + fee,
            msg.sender
        );
    }

    function stakeRelay(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        address _paymaster
    )
        external
        override
        whenNotPaused
        validChallenge(_challengeId)
        validPrediction(_prediction)
        nonZero(_quantity)
        poolInState(_challengeId, ChallengeState.open)
    {
        CPStore storage s = CPStorage.load();

        uint256 currentPrice = s.challenges[_challengeId].basePrice;

        if (!s.optionSupply[_challengeId][keccak256(_prediction)].exists) {
            revert InvalidPrediction();
        }
        uint256 totalAmount = currentPrice * _quantity;
        uint256 fee = LibPrice._computeStakeFee(currentPrice);
        uint256 rewardPoints = LibPrice._stakeRewardPoints(
            _quantity,
            s.challenges[_challengeId].createdAt,
            s.challenges[_challengeId].maturity
        );
        LibPool._incrementSupply(
            s,
            _challengeId,
            _prediction,
            _quantity,
            totalAmount,
            rewardPoints,
            msg.sender
        );
        LibPool._recordFee(s.challenges[_challengeId].stakeToken, fee);
        LibTransfer._depositOrPaymaster(
            _paymaster,
            s.challenges[_challengeId].stakeToken,
            fee + totalAmount,
            msg.sender
        );
        LibTransfer._stakeAirDrop(
            _paymaster,
            s.challenges[_challengeId].stakeToken,
            msg.sender,
            s.challenges[_challengeId].maturity
        );
        emit IChallengePoolHandler.Stake(
            _challengeId,
            msg.sender,
            _prediction,
            _quantity,
            currentPrice,
            totalAmount,
            fee,
            rewardPoints
        );
    }

    function earlyWithdrawRelay(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _deadline
    )
        external
        override
        whenNotPaused
        nonReentrant
        validChallenge(_challengeId)
        validPrediction(_prediction)
        nonZero(_quantity)
        nonZero(_deadline)
        poolInState(_challengeId, ChallengeState.open)
    {
        revert NotImplemented();
        // CPStore storage s = CPStorage.load();
        // if (_deadline < block.timestamp) {
        //     revert DeadlineExceeded();
        // }
        // if (!s.optionSupply[_challengeId][keccak256(_prediction)].exists) {
        //     revert InvalidPrediction();
        // }
        // IChallengePoolHandler.PlayerSupply storage playerOptionSupply = s
        //     .playerOptionSupply[_challengeId][msg.sender][
        //         keccak256(_prediction)
        //     ];
        // if (playerOptionSupply.stakes < _quantity) {
        //     revert IChallengePoolCommon.InsufficientStakes(
        //         _quantity,
        //         playerOptionSupply.stakes
        //     );
        // }
        // uint256 basePrice = s.challenges[_challengeId].basePrice;
        // uint256 penalty = LibPrice._penalty(
        //     basePrice,
        //     s.challenges[_challengeId].createdAt,
        //     s.challenges[_challengeId].maturity
        // );
        // uint256 currentPrice = basePrice - penalty;
        // uint256 totalAmount = basePrice * _quantity;
        // uint256 fee = LibPrice._computeEarlyWithdrawFee(basePrice);
        // uint256 rewardPoints = LibPrice._earlyWithdrawRewardPoints(
        //     playerOptionSupply.rewards,
        //     playerOptionSupply.stakes,
        //     _quantity
        // );
        // LibPool._decrementSupply(
        //     s,
        //     _challengeId,
        //     _prediction,
        //     _quantity,
        //     totalAmount,
        //     rewardPoints
        // );
        // LibPool._recordFee(s.challenges[_challengeId].stakeToken, fee);
        // LibTransfer._receive(s.challenges[_challengeId].stakeToken, fee);

        // LibTransfer._send(
        //     s.challenges[_challengeId].stakeToken,
        //     totalAmount,
        //     msg.sender
        // );
        // emit Withdraw(
        //     _challengeId,
        //     msg.sender,
        //     _prediction,
        //     _quantity,
        //     currentPrice,
        //     penalty,
        //     totalAmount,
        //     fee,
        //     rewardPoints
        // );
    }

    function withdrawRelay(
        uint256 _challengeId
    )
        external
        override
        whenNotPaused
        nonReentrant
        validChallenge(_challengeId)
    {
        LibPool._withdraw(_challengeId, msg.sender);
    }

    function bulkWithdrawRelay(
        uint256[] calldata _challengeIds
    ) external override {
        for (uint i = 0; i < _challengeIds.length; i++) {
            if (_challengeIds[i] >= CPStorage.load().challengeId) {
                revert IChallengePoolCommon.InvalidChallenge();
            }
            LibPool._withdraw(_challengeIds[i], msg.sender);
        }
    }
}
