// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibData.sol";

import "../interfaces/ITopicRegistry.sol";

import "../interfaces/IPoolResolver.sol";
import "../interfaces/IDataProvider.sol";
import "../utils/Helpers.sol";

import "../utils/Errors.sol";

import "../diamond/interfaces/SoccersmRoles.sol";

import "hardhat/console.sol";

contract TopicRegistry is ITopicRegistry, SoccersmRoles, Helpers {
    modifier validTopic(string calldata _topicId) {
        TRStore storage t = TRStorage.load();
        console.log(bytes(t.registry[_topicId].topicId).length );
        if (bytes(t.registry[_topicId].topicId).length == 0) {
            revert ITopicRegistry.InvalidTopic();
        }
        _;
    }

    function createTopic(
        string calldata _topicId,
        address _poolResolver,
        address _dataProvider
    )
        external
        override
        onlyTopicRegistrar
        nonEmptyString(_topicId)
        positiveAddress(_poolResolver)
        positiveAddress(_dataProvider)
    {
        TRStore storage t = TRStorage.load();
        if (bytes(t.registry[_topicId].topicId).length > 0) {
            revert ITopicRegistry.ExistingTopic();
        }
        t.registry[_topicId] = ITopicRegistry.Topic({
            topicId: _topicId,
            poolResolver: IPoolResolver(_poolResolver),
            dataProvider: IDataProvider(_dataProvider),
            state: ITopicRegistry.TopicState.active
        });
        emit ITopicRegistry.NewTopic(
            _topicId,
            _poolResolver,
            _dataProvider,
            ITopicRegistry.TopicState.active
        );
    }

    function disableTopic(
        string calldata _topicId
    ) external override validTopic(_topicId) onlyTopicRegistrar {
        TRStore storage t = TRStorage.load();
        t.registry[_topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.TopicDisabled(
            _topicId,
            ITopicRegistry.TopicState.disabled
        );
    }

    function enableTopic(
        string calldata _topicId
    ) external override validTopic(_topicId) onlyTopicRegistrar {
        TRStore storage t = TRStorage.load();
        t.registry[_topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.TopicDisabled(
            _topicId,
            ITopicRegistry.TopicState.disabled
        );
    }

    function getTopic(
        string calldata _topicId
    ) external view override validTopic(_topicId) returns (Topic memory) {
        TRStore storage t = TRStorage.load();
        return t.registry[_topicId];
    }

    function provideData(
        string calldata _topicId,
        bytes calldata _params
    ) external override onlyOracle {
        TRStore storage t = TRStorage.load();
        IDataProvider provider = t.registry[_topicId].dataProvider;
        (bool success, ) = address(provider).delegatecall(
            abi.encodeWithSelector(IDataProvider.provideData.selector, _params)
        );
        if (!success) {
            revert DelegateCallFailed("TopicRegistry.provideData");
        }
    }

    function updateProvision(
        string calldata _topicId,
        bytes calldata _params
    ) external override onlySoccersmCouncil {
        TRStore storage t = TRStorage.load();
        IDataProvider provider = t.registry[_topicId].dataProvider;
        (bool success, ) = address(provider).delegatecall(
            abi.encodeWithSelector(
                IDataProvider.updateProvision.selector,
                _params
            )
        );
        if (!success) {
            revert DelegateCallFailed("TopicRegistry.updateProvision");
        }
    }

    function registerEvent(
        string calldata _topicId,
        bytes calldata _params
    ) external override onlyAdmin {
        TRStore storage t = TRStorage.load();
        IDataProvider provider = t.registry[_topicId].dataProvider;
        (bool success, ) = address(provider).delegatecall(
            abi.encodeWithSelector(
                IDataProvider.registerEvent.selector,
                _params
            )
        );
        if (!success) {
            revert DelegateCallFailed("TopicRegistry.registerEvent");
        }
    }

    function getData(
        string calldata _topicId,
        bytes calldata _params
    ) external override returns (bytes memory) {
        TRStore storage t = TRStorage.load();
        IDataProvider provider = t.registry[_topicId].dataProvider;
        (bool success, bytes memory result) = address(provider).delegatecall(
            abi.encodeWithSelector(IDataProvider.getData.selector, _params)
        );
        if (!success) {
            revert DelegateCallFailed("TopicRegistry.getData");
        }
        return result;
    }

    function hasData(
        string calldata _topicId,
        bytes calldata _params
    ) external override returns (bool) {
        TRStore storage t = TRStorage.load();
        IDataProvider provider = t.registry[_topicId].dataProvider;
        (bool success, bytes memory result) = address(provider).delegatecall(
            abi.encodeWithSelector(IDataProvider.hasData.selector, _params)
        );
        if (!success) {
            revert DelegateCallFailed("TopicRegistry.hasData");
        }
        return abi.decode(result, (bool));
    }
}
