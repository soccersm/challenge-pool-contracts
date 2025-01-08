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
        active,
        disabled
    }
    struct Topic {
        string topicId;
        string name;
        IPoolResolver poolResolver;
        IDataProvider dataProvider;
        TopicState state;
    }

    event NewTopic(
        string indexed topicId,
        address indexed poolResolver,
        address indexed dataProvider,
        string name,
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
     * @param   _name  example Football Correct Score
     * @param   _poolResolver  address of the pool resolver for this topic
     * @param   _dataProvider  address of the data provider for this topic
     */
    function createTopic(
        string memory _id,
        string memory _name,
        address _poolResolver,
        address _dataProvider
    ) external;

    function disableTopic(string calldata topicId) external;

    function enableTopic(string calldata topicId) external;

    function getTopic(string calldata topicId) external view returns (Topic memory);
}
