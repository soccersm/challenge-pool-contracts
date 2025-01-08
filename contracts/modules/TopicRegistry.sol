// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ITopicRegistry.sol";
import "../interfaces/IPoolResolver.sol";
import "../interfaces/IDataProvider.sol";
import "../utils/Helpers.sol";
import "../diamond/facets/OwnershipFacet.sol";

contract TopicRegistry is ITopicRegistry, Helpers, OwnershipFacet {
    bytes32 constant TOPIC_REGISTRY_STORAGE_POSITION =
        keccak256("soccersm.topic.registry");

    struct TopicRegistryStore {
        mapping(string => ITopicRegistry.Topic) registry;
    }

    function store() internal pure returns (TopicRegistryStore storage s) {
        bytes32 position = TOPIC_REGISTRY_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    modifier validTopic(string calldata _topicId) {
        TopicRegistryStore storage s = store();
        if (bytes(s.registry[_topicId].name).length == 0) {
            revert ITopicRegistry.InvalidTopic();
        }
        _;
    }

    function createTopic(
        string memory _topicId,
        string memory _name,
        address _poolResolver,
        address _dataProvider
    )
        external
        override
        onlyOwner
        nonEmptyString(_topicId)
        nonEmptyString(_name)
        positiveAddress(_poolResolver)
        positiveAddress(_dataProvider)
    {
        TopicRegistryStore storage s = store();
        if (bytes(s.registry[_topicId].name).length > 0) {
            revert ITopicRegistry.ExistingTopic();
        }
        s.registry[_topicId] = ITopicRegistry.Topic({
            topicId: _topicId,
            name: _name,
            poolResolver: IPoolResolver(_poolResolver),
            dataProvider: IDataProvider(_dataProvider),
            state: ITopicRegistry.TopicState.active
        });
        emit ITopicRegistry.NewTopic(
            _topicId,
            _poolResolver,
            _dataProvider,
            _name,
            ITopicRegistry.TopicState.active
        );
    }

    function disableTopic(
        string calldata _topicId
    ) external override onlyOwner validTopic(_topicId) {
        TopicRegistryStore storage s = store();
        s.registry[_topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.TopicDisabled(
            _topicId,
            ITopicRegistry.TopicState.disabled
        );
    }

    function enableTopic(
        string calldata _topicId
    ) external override onlyOwner validTopic(_topicId) {
        TopicRegistryStore storage s = store();
        s.registry[_topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.TopicDisabled(
            _topicId,
            ITopicRegistry.TopicState.disabled
        );
    }

    function getTopic(
        string calldata _topicId
    ) external view override validTopic(_topicId) returns (Topic memory) {
        TopicRegistryStore storage s = store();
        return s.registry[_topicId];
    }
}
