// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolCommon.sol";
abstract contract IChallengePoolHandler is IChallengePoolCommon {
    
    struct Supply {
        uint256 stakes;
        uint256 tokens;
    }
    struct OptionSupply {
        bool exists;
        uint256 stakes;
        uint256 tokens;
    }
    struct PlayerSupply {
        bool withdrawn;
        uint256 stakes;
        uint256 tokens;
    }

    event NewChallenge(
        uint256 challengeId,
        address creator,
        uint256 createdAt,
        uint256 maturity,
        ChallengeState state,
        bytes result,
        uint256 basePrice,
        uint256 fee,
        uint256 quantity,
        bytes prediction,
        ChallengeEvent[] events,
        bytes[] options,
        address stakeToken,
        address paymaster,
        bool multi
    );
    event Stake(
        uint256 challengeId,
        address participant,
        bytes option,
        uint256 stakes,
        uint256 amount,
        uint256 fee
    );
    event WinningsWithdrawn(
        uint256 challengeId,
        address participant,
        uint256 amountWon,
        uint256 amountWithdrawn
    );
    event Withdraw(
        uint256 challengeId,
        address participant,
        bytes option,
        uint256 stakes,
        uint256 amount,
        uint256 fee
    );

    enum PoolAction {
        stake,
        withdraw
    }
    /**
     * @notice  .
     * @dev     create a new challenge
     * @param   _events  events in the challenge, maximum of one event if _options is not empty
     * @param   _options  challenge options, if empty then it is a yes or no pool
     * @param   _stakeToken  token used for staking on this challenge
     * @param   _prediction  prediction of user creating the challenge
     * @param   _quantity  how many stakes user is purchasing for this prediction
     * @param   _basePrice  the base price of a stake. total amount to be transferred is _basePrice * _quantity
     * @param   _paymaster  a contract the pays the total amount on behalf of the user set to 0x if none
     */
    function createChallenge(
        ChallengeEvent[] calldata _events,
        bytes[] calldata _options,
        address _stakeToken,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _basePrice,
        address _paymaster
    ) external virtual;
    /**
     * @notice  .
     * @dev     stake on a pool
     * @param   _challengeId  .
     * @param   _prediction  .
     * @param   _quantity  how many stakes user is purchasing for this prediction
     * @param   _maxPrice  the maximum price user is willing to pay.
     * @param   _deadline  time after which this stake transaction will revert
     * @param   _paymaster  a contract the pays the total amount on behalf of the user set to 0x if none
     */
    function stake(
        uint256 _challengeId,
        bytes calldata _prediction,
        uint256 _quantity,
        uint256 _maxPrice,
        uint256 _deadline,
        address _paymaster
    ) external virtual;
    /**
     * @notice  .
     * @dev     withdraw winnings from pool, reverts if user lost
     * @param   _challengeId  .
     */
    function withdraw(uint256 _challengeId) external virtual;
    /**
     * @notice  .
     * @dev     bulk withdrawal
     * @param   _challengeIds  .
     */
    function bulkWithdraw(uint256[] calldata _challengeIds) external virtual;
    /**
     * @notice  .
     * @dev     early withdrawal allows player to get out of their stake. price of option calculated accordingly and applied
     * @param   _challengeId  .
     * @param   _option  option to withdraw from
     * @param   _quantity  of stakes to withdraw.
     * @param   _minPrice  minumum price user is willing to accept for selling their position.
     * @param   _deadline  ime after which this early withdraw transaction will revert
     */
    function earlyWithdraw(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        uint256 _minPrice,
        uint256 _deadline
    ) external virtual;
    /**
     * @notice  .
     * @dev     price calculation for a pool option
     * @param   _challengeId  .
     * @param   _option  .
     * @param   _quantity  .
     * @return  uint256  .
     */
    function price(
        uint256 _challengeId,
        bytes calldata _option,
        uint256 _quantity,
        PoolAction _action
    ) external view virtual returns (uint256);
    /**
     * @notice  .
     * @dev     returns the Challenge struct.
     * @param   _challengeId  id of the challenge to return.
     * @return  Challenge  .
     */
    function getChallenge(
        uint256 _challengeId
    ) external view virtual returns (Challenge memory);

    function earlyWithdrawFee(
        uint256 _price
    ) external view virtual returns (uint256 fee, uint256 feePlusPrice);

    function createFee(
        uint256 _price
    ) external view virtual returns (uint256 fee, uint256 feePlusPrice);

    function stakeFee(
        uint256 _price
    ) external view virtual returns (uint256 fee, uint256 feePlusPrice);
}
