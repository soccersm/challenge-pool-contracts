// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IPoolResolver.sol";
import "./IDataProvider.sol";

/**
 * @author  .
 * @title   .
 * @dev     Handles logic for registration of pool topics
 * @notice  .
 */

interface ITopicRegistry {
    enum TopicState {
        disabled,
        active
    }
    struct Topic {
        string topicId;
        IPoolResolver poolResolver;
        IDataProvider dataProvider;
        TopicState state;
    }

    event NewTopic(
        string indexed topicId,
        address indexed poolResolver,
        address indexed dataProvider,
        TopicState state
    );

    event TopicDisabled(string indexed topicId, TopicState state);
    event TopicEnabled(string indexed topicId, TopicState state);

    error InvalidTopic();
    error ExistingTopic();

    /**
     * @notice  .
     * @dev     creates a new topic
     * @param   _id  example football-correct-score
     * @param   _poolResolver  address of the pool resolver for this topic
     * @param   _dataProvider  address of the data provider for this topic
     */
    function createTopic(
        string memory _id,
        address _poolResolver,
        address _dataProvider
    ) external;

    /**
     * @notice  .
     * @dev     disable topic.
     * @param   _topicId  .
     */
    function disableTopic(string calldata _topicId) external;

    /**
     * @notice  .
     * @dev     enable topic.
     * @param   _topicId  .
     */
    function enableTopic(string calldata _topicId) external;

    function getTopic(
        string calldata _topicId
    ) external view returns (Topic memory);

    /**
     * @notice  .
     * @dev     offchain oracles call this to provide initially requested data.
     * @param _topicId topic id helps determine which data provider to use
     * @param   _params  decoded and applied based on the event topic type.
     */
    function provideData(
        string calldata _topicId,
        bytes calldata _params
    ) external;
    /**
     * @notice  can only be called by soccersm council
     * @dev     in case of dispute and wrong data provided, this can be called to provide correct data.
     * @param _topicId topic id helps determine which data provider to use
     * @param   _params  decoded and applied based on the event topic type.
     */
    function updateProvision(
        string calldata _topicId,
        bytes calldata _params
    ) external;
    /**
     * @notice  .
     * @dev     sometimes events need to be registered onchain ahead of time before they can be requested this is the case of general statements.
     * @param _topicId topic id helps determine which data provider to use
     * @param   _params  decoded and applied based on the event topic type.
     */

    function registerEvent(
        string calldata _topicId,
        bytes calldata _params
    ) external;
    /**
     * @notice  .
     * @dev     onchain contracts can call this to request provided data.
     * @param _topicId topic id helps determine which data provider to use
     * @param   _params  decoded and applied based on the event topic type..
     * @return  _data  requested data is encoded and sent as calling contract should know how to decode it.
     */
    function getData(
        string calldata _topicId,
        bytes calldata _params
    ) external returns (bytes memory _data);
    /**
     * @notice  .
     * @dev     .
     * @param   _topicId  .
     * @param   _params  .
     * @return  bool  .
     */
    function hasData(
        string calldata _topicId,
        bytes calldata _params
    ) external returns (bool);
}
