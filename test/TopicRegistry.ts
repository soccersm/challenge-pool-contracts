import { toUtf8Bytes } from "ethers";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { expect } from "chai";
import { ethers } from "hardhat";
import { TopicState } from "./test_helpers";
import { coder } from "./lib";

describe("Topic Registry", async function () {
  async function deployTopicRegistry() {
    const {
      registryProxy,
      oracle,
      poolHandlerProxy,
      oneGrand,
      oneMil,
      ballsToken,
      poolViewProxy,
      baller,
    } = await loadFixture(deploySoccersm);
    const TOPIC_REGISTRAR = ethers.keccak256(toUtf8Bytes("TOPIC_REGISTRAR"));
    const ORACLE_ROLE = ethers.keccak256(toUtf8Bytes("ORACLE_ROLE"));
    const SOCCERSM_COUNCIL = ethers.keccak256(toUtf8Bytes("SOCCERSM_COUNCIL"));
    return {
      registryProxy,
      poolViewProxy,
      poolHandlerProxy,
      oneGrand,
      oneMil,
      ballsToken,
      baller,
      oracle,
      TOPIC_REGISTRAR,
      ORACLE_ROLE,
      SOCCERSM_COUNCIL,
    };
  }
  it("Should createTopic", async function () {
    const { registryProxy } = await loadFixture(deployTopicRegistry);
    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    await expect(registryProxy.createTopic(topicName, resolver, dataProvider))
      .to.emit(registryProxy, "NewTopic")
      .withArgs(topicName, resolver, dataProvider, TopicState.active);

    const topic = await registryProxy.getTopic(topicName);
    expect(topic[0]).to.equal("TestTopicName");
  });

  it("Should reverts for createTopic", async function () {
    const { registryProxy, oracle, TOPIC_REGISTRAR } = await loadFixture(
      deployTopicRegistry
    );
    const topicName = "Topic1";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    //revert empty topic name
    await expect(
      registryProxy.createTopic("", resolver, dataProvider)
    ).to.be.revertedWithCustomError(registryProxy, "EmptyString");

    //revert zero address resolver, dataProvider
    await expect(
      registryProxy.createTopic(topicName, ethers.ZeroAddress, dataProvider)
    ).to.be.revertedWithCustomError(registryProxy, "ZeroAddress");

    await expect(
      registryProxy.createTopic(topicName, resolver, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(registryProxy, "ZeroAddress");

    //revert onlyTopicRegistrar
    await expect(
      (registryProxy.connect(oracle) as any).createTopic(
        topicName,
        resolver,
        dataProvider
      )
    ).to.be.revertedWith(
      `AccessControl: account ${oracle.address.toLowerCase()} is missing role ${TOPIC_REGISTRAR}`
    );

    //revert topic already exists
    await registryProxy.createTopic(topicName, resolver, dataProvider);
    await expect(
      registryProxy.createTopic(topicName, resolver, dataProvider)
    ).to.be.revertedWithCustomError(registryProxy, "ExistingTopic");
  });

  it("Should updateTopic", async function () {
    const { registryProxy } = await loadFixture(deployTopicRegistry);
    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    await registryProxy.createTopic(topicName, resolver, dataProvider);
    const newResolver = ethers.Wallet.createRandom().address;
    const newDataProvider = ethers.Wallet.createRandom().address;
    await expect(
      registryProxy.updateTopic(topicName, newResolver, newDataProvider)
    )
      .to.emit(registryProxy, "UpdateTopic")
      .withArgs(topicName, newResolver, newDataProvider, TopicState.active);
  });

  it("Should reverts for updateTopic", async function () {
    const { registryProxy, oracle, TOPIC_REGISTRAR } = await loadFixture(
      deployTopicRegistry
    );
    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    await registryProxy.createTopic(topicName, resolver, dataProvider);
    const newResolver = ethers.Wallet.createRandom().address;
    const newDataProvider = ethers.Wallet.createRandom().address;

    await expect(
      registryProxy.updateTopic(topicName, newResolver, newDataProvider)
    )
      .to.emit(registryProxy, "UpdateTopic")
      .withArgs(topicName, newResolver, newDataProvider, TopicState.active);

    //revert validTopic
    await expect(
      registryProxy.updateTopic("Invalidtopic", newResolver, newDataProvider)
    ).to.be.revertedWithCustomError(registryProxy, "InvalidTopic");

    //revert onlyTopicRegistrar
    await expect(
      (registryProxy.connect(oracle) as any).updateTopic(
        topicName,
        newResolver,
        newDataProvider
      )
    ).to.be.revertedWith(
      `AccessControl: account ${oracle.address.toLowerCase()} is missing role ${TOPIC_REGISTRAR}`
    );

    //revert zero address resolver, dataProvider
    await expect(
      registryProxy.updateTopic(topicName, ethers.ZeroAddress, newDataProvider)
    ).to.be.revertedWithCustomError(registryProxy, "ZeroAddress");
    await expect(
      registryProxy.updateTopic(topicName, newResolver, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(registryProxy, "ZeroAddress");
  });

  it("should disableTopic", async function () {
    const { registryProxy } = await loadFixture(deployTopicRegistry);
    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    await expect(registryProxy.createTopic(topicName, resolver, dataProvider))
      .to.emit(registryProxy, "NewTopic")
      .withArgs(topicName, resolver, dataProvider, TopicState.active);

    //disable topic
    await expect(registryProxy.disableTopic(topicName))
      .to.emit(registryProxy, "TopicDisabled")
      .withArgs(topicName, TopicState.disabled);
    const getTopic = await registryProxy.getTopic(topicName);
    expect(getTopic[3]).to.equal(TopicState.disabled);
  });

  it("should revert for disableTopic", async function () {
    const { registryProxy, oracle, TOPIC_REGISTRAR } = await loadFixture(
      deployTopicRegistry
    );
    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    await expect(registryProxy.createTopic(topicName, resolver, dataProvider))
      .to.emit(registryProxy, "NewTopic")
      .withArgs(topicName, resolver, dataProvider, TopicState.active);

    //disable topic
    await expect(registryProxy.disableTopic(topicName))
      .to.emit(registryProxy, "TopicDisabled")
      .withArgs(topicName, TopicState.disabled);
    const getTopic = await registryProxy.getTopic(topicName);
    expect(getTopic[3]).to.equal(TopicState.disabled);

    //revert onlyTopicRegistrar
    await expect(
      (registryProxy.connect(oracle) as any).disableTopic(topicName)
    ).to.be.revertedWith(
      `AccessControl: account ${oracle.address.toLowerCase()} is missing role ${TOPIC_REGISTRAR}`
    );

    //revert validTopic
    await expect(
      registryProxy.updateTopic("Invalidtopic", resolver, dataProvider)
    ).to.be.revertedWithCustomError(registryProxy, "InvalidTopic");
  });

  it("should enableTopic", async function () {
    const { registryProxy, oracle, TOPIC_REGISTRAR } = await loadFixture(
      deployTopicRegistry
    );
    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;

    await expect(registryProxy.createTopic(topicName, resolver, dataProvider))
      .to.emit(registryProxy, "NewTopic")
      .withArgs(topicName, resolver, dataProvider, TopicState.active);

    //disable topic
    await expect(registryProxy.disableTopic(topicName))
      .to.emit(registryProxy, "TopicDisabled")
      .withArgs(topicName, TopicState.disabled);
    const getTopic = await registryProxy.getTopic(topicName);
    expect(getTopic[3]).to.equal(TopicState.disabled);

    //enable topic
    await expect(registryProxy.enableTopic(topicName))
      .to.emit(registryProxy, "TopicEnabled")
      .withArgs(topicName, TopicState.active);
    const getTopicState = await registryProxy.getTopic(topicName);
    expect(getTopicState[3]).to.equal(TopicState.active);

    //revert onlyTopicRegistrar
    await expect(
      (registryProxy.connect(oracle) as any).enableTopic(topicName)
    ).to.be.revertedWith(
      `AccessControl: account ${oracle.address.toLowerCase()} is missing role ${TOPIC_REGISTRAR}`
    );
    //revert validTopic
    await expect(
      registryProxy.enableTopic("Invalidtopic")
    ).to.be.revertedWithCustomError(registryProxy, "InvalidTopic");
  });

  it("Should provideData", async function () {
    const { registryProxy, baller, ORACLE_ROLE } = await loadFixture(
      deployTopicRegistry
    );

    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;
    await registryProxy.createTopic(topicName, resolver, dataProvider);

    const assetParams = coder.encode(
      ["string", "uint256", "uint256"],
      ["TEST", await time.latest(), 1000000]
    );
    await expect(registryProxy.provideData(topicName, assetParams)).to.not.be
      .reverted;

    await expect(
      (registryProxy.connect(baller) as any).provideData(topicName, assetParams)
    ).to.be.revertedWith(
      `AccessControl: account ${baller.address.toLowerCase()} is missing role ${ORACLE_ROLE}`
    );

    //revert delegatedCall: invalid assetParams for topicName
    await expect(registryProxy.provideData("AssetPriceBounded", assetParams))
      .to.be.revertedWithCustomError(registryProxy, "DelegateCallFailed")
      .withArgs("TopicRegistry.provideData");
  });

  it("Should updateProvision", async function () {
    const { registryProxy, baller, SOCCERSM_COUNCIL } = await loadFixture(
      deployTopicRegistry
    );

    const topicName = "TestTopicName";
    const resolver = ethers.Wallet.createRandom().address;
    const dataProvider = ethers.Wallet.createRandom().address;
    await registryProxy.createTopic(topicName, resolver, dataProvider);

    const assetParams = coder.encode(
      ["string", "uint256", "uint256"],
      ["TEST", await time.latest(), 1000000]
    );
    await expect(registryProxy.provideData(topicName, assetParams)).to.not.be
      .reverted;

   const updateAssetParams = coder.encode(
      ["string", "uint256", "uint256"],
      ["TEST", await time.latest(), 2000000]
    );
    await expect(
      registryProxy.updateProvision(topicName, updateAssetParams)
    ).to.not.be.reverted;

    //revert delegatedCall
    await expect(registryProxy.updateProvision("AssetPriceBounded", updateAssetParams))
      .to.be.revertedWithCustomError(registryProxy, "DelegateCallFailed")
      .withArgs("TopicRegistry.updateProvision");

    //revert onlySoccersmCouncil
    await expect(
      (registryProxy.connect(baller) as any).updateProvision(
        "AssetPriceBound",
        updateAssetParams
      )
    ).to.be.revertedWith(
      `AccessControl: account ${baller.address.toLowerCase()} is missing role ${SOCCERSM_COUNCIL}`
    );
  });
});
