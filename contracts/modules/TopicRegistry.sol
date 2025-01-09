// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibData.sol";

import "../interfaces/ITopicRegistry.sol";

import "../interfaces/IPoolResolver.sol";
import "../interfaces/IDataProvider.sol";
import "../utils/Helpers.sol";

contract TopicRegistry is ITopicRegistry, Helpers {
    modifier validTopic(string calldata _topicId) {
        TRStore storage s = TRStorage.load();
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
        nonEmptyString(_topicId)
        nonEmptyString(_name)
        positiveAddress(_poolResolver)
        positiveAddress(_dataProvider)
    {
        TRStore storage s = TRStorage.load();
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
    ) external override validTopic(_topicId) {
        TRStore storage s = TRStorage.load();
        s.registry[_topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.TopicDisabled(
            _topicId,
            ITopicRegistry.TopicState.disabled
        );
    }

    function enableTopic(
        string calldata _topicId
    ) external override validTopic(_topicId) {
        TRStore storage s = TRStorage.load();
        s.registry[_topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.TopicDisabled(
            _topicId,
            ITopicRegistry.TopicState.disabled
        );
    }

    function getTopic(
        string calldata _topicId
    ) external view override validTopic(_topicId) returns (Topic memory) {
        TRStore storage s = TRStorage.load();
        return s.registry[_topicId];
    }

    function provideData(
        string calldata _topicId,
        bytes calldata _params
    ) external override {}

    function registerEvent(
        string calldata _topicId,
        bytes calldata _params
    ) external override {}

    function getData(
        string calldata _topicId,
        bytes calldata _params
    ) external override returns (bytes memory _data) {}

    function disputeData(
        string calldata _topicId,
        bytes calldata _params
    ) external override {}

    function settleDispute(
        string calldata _topicId,
        bytes calldata _params
    ) external override {}

    function hasData(
        string calldata _topicId,
        bytes calldata _params
    ) external view override returns (bool) {}
}
