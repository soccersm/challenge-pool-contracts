// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "./IChallengePoolHandler.sol";

import "./IDataProvider.sol";
interface IPoolResolver {
    /**
     * @notice  .
     * @dev     successfully identify what was the outcome of an event.
     * @param   _event  .
     */
    function resolveEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event,
        bytes[] calldata _options
    ) external returns (bytes memory);

    /**
     * @notice  .
     * @dev     validate event from pool. this is necessary to ensure invalid event
     * @param   _event  event from pool.
     * @return  bool  true if event is valid.
     */
    function validateEvent(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event
    ) external returns (bool);

    /**
     * @notice  .
     * @dev     validate options from pool. this is neccessary to prevent invalid options
     * @param   _options  options from a pool.
     * @return  bool  true if all options are valid.
     */
    function validateOptions(
        IDataProvider dataProvider,
        IChallengePoolHandler.ChallengeEvent calldata _event,
        bytes[] calldata _options
    ) external returns (bool);
}
