// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "../interfaces/IChallengePoolCommon.sol";
import "../libraries/LibData.sol";
import "../libraries/LibPool.sol";

abstract contract ChallengePoolHelpers {
    modifier validChallenge(uint256 _challengeId) {
        if (_challengeId >= CPStorage.load().challengeId) {
            revert IChallengePoolCommon.InvalidChallenge();
        }
        _;
    }

    modifier poolInState(
        uint256 _challengeId,
        IChallengePoolCommon.ChallengeState _state
    ) {
        IChallengePoolCommon.ChallengeState currentState = LibPool._poolState(
            CPStorage.load().challenges[_challengeId]
        );
        if (currentState != _state) {
            revert IChallengePoolCommon.ActionNotAllowedForState(currentState);
        }
        _;
    }

    modifier validStake(uint256 _stake) {
        if (_stake < CPStorage.load().minStakeAmount) {
            revert IChallengePoolCommon.StakeLowerThanMinimum();
        }
        _;
    }

    modifier validPrediction(bytes memory _prediction) {
        if (HelpersLib.compareBytes(_prediction, HelpersLib.emptyBytes)) {
            revert IChallengePoolCommon.InvalidPrediction();
        }
        _;
    }

    modifier supportedToken(address _token) {
        if (!CPStorage.load().stakeTokens[_token].active) {
            revert IChallengePoolCommon.UnsupportedToken(_token);
        }
        _;
    }
}
