import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { toUtf8Bytes } from "ethers";
import { deploySoccersm } from "./SoccersmDeployFixture";
import {
  AssetPriceTargetEvent,
  coder,
  prepareAssetPriceProvision,
  prepareAssetPriceTargetEventParam,
  prepareCreateChallenge,
  TopicId,
} from "./lib";
import { btcEvent } from "./mock";

describe("AssetPriceBoundedResolver", async function () {
  async function deployTopicResolvers() {
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
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
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
      DEFAULT_ADMIN_ROLE,
    };
  }

  it("AssetPriceBoundedResolver - validateEvent", async function () {
    const { registryProxy } = await loadFixture(deployTopicResolvers);
    const [topicId, poolResolver, poolDataProvider, state] =
      await registryProxy.getTopic("AssetPriceBounded");

    const resolver = await ethers.getContractAt(
      "AssetPriceBoundedResolver",
      poolResolver
    );
    const dataProvider = await ethers.getContractAt(
      "IDataProvider",
      poolDataProvider
    );

    //validateEvent
    const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

    const assetPriceBound = {
      maturity,
      topicId: TopicId.AssetPriceBounded,
      outcome: "in",
      priceUpperBound: 150000,
      priceLowerBound: 120000,
      assetSymbol: "BTC",
    };
    const eventParams = coder.encode(
      ["string", "uint256", "uint256", "string"],
      [
        assetPriceBound.assetSymbol,
        assetPriceBound.priceLowerBound,
        assetPriceBound.priceUpperBound,
        assetPriceBound.outcome,
      ]
    );
    const event = {
      params: eventParams,
      topicId: assetPriceBound.topicId,
      maturity: assetPriceBound.maturity,
    };

    await expect(resolver.validateEvent(await dataProvider.getAddress(), event))
      .to.not.be.reverted;

    const eventValidated = await resolver.validateEvent.staticCall(
      dataProvider,
      event
    );
    console.log("eventValidated", eventValidated);
    expect(eventValidated).to.be.equal(true);

    //return false for greater priceLowerBound
    const assetPriceBound2 = {
      maturity,
      topicId: TopicId.AssetPriceBounded,
      outcome: "in",
      priceUpperBound: 120000,
      priceLowerBound: 150000,
      assetSymbol: "BTC",
    };
    const eventParams2 = coder.encode(
      ["string", "uint256", "uint256", "string"],
      [
        assetPriceBound2.assetSymbol,
        assetPriceBound2.priceLowerBound,
        assetPriceBound2.priceUpperBound,
        assetPriceBound2.outcome,
      ]
    );
    const event2 = {
      params: eventParams2,
      topicId: assetPriceBound2.topicId,
      maturity: assetPriceBound2.maturity,
    };
    await expect(
      resolver.validateEvent(await dataProvider.getAddress(), event2)
    ).to.not.be.reverted;
    const eventValidated2 = await resolver.validateEvent.staticCall(
      dataProvider,
      event2
    );
    console.log("eventValidated2", eventValidated2);
    expect(eventValidated2).to.be.equal(false);

    //return false for neither in or out
    const assetPriceBound3 = {
      maturity,
      topicId: TopicId.AssetPriceBounded,
      outcome: "invalid",
      priceUpperBound: 150000,
      priceLowerBound: 120000,
      assetSymbol: "BTC",
    };
    const eventParams3 = coder.encode(
      ["string", "uint256", "uint256", "string"],
      [
        assetPriceBound3.assetSymbol,
        assetPriceBound3.priceLowerBound,
        assetPriceBound3.priceUpperBound,
        assetPriceBound3.outcome,
      ]
    );
    const event3 = {
      params: eventParams3,
      topicId: assetPriceBound3.topicId,
      maturity: assetPriceBound3.maturity,
    };
    await expect(
      resolver.validateEvent(await dataProvider.getAddress(), event3)
    ).to.not.be.reverted;
    const eventValidated3 = await resolver.validateEvent.staticCall(
      dataProvider,
      event3
    );
    console.log("eventValidated3", eventValidated3);
    expect(eventValidated3).to.be.equal(false);
  });

  xit("resolveEvent", async function () {
    const {
      registryProxy,
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
    } = await loadFixture(deployTopicResolvers);
    const [topicId, poolResolver, poolDataProvider, state] =
      await registryProxy.getTopic("AssetPriceBounded");

    const resolver = await ethers.getContractAt(
      "AssetPriceBoundedResolver",
      poolResolver
    );
    const dataProvider = await ethers.getContractAt(
      "IDataProvider",
      poolDataProvider
    );

    const btcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );

    await expect(
      (poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;

    //resolveEvent
    const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

    const assetPriceBound = {
      maturity,
      topicId: TopicId.AssetPriceBounded,
      outcome: "in",
      priceUpperBound: 150000,
      priceLowerBound: 120000,
      assetSymbol: "BTC",
    };
    const eventParams = coder.encode(
      ["string", "uint256", "uint256", "string"],
      [
        assetPriceBound.assetSymbol,
        assetPriceBound.priceLowerBound,
        assetPriceBound.priceUpperBound,
        assetPriceBound.outcome,
      ]
    );
    //provide data
    await time.increaseTo(assetPriceBound.maturity);
    const assetPrice = {
      assetSymbol: "BTC",
      price: 130000,
      maturity: assetPriceBound.maturity,
    };
    const assetPriceTarget = 11000000;
    const provideDataParams = prepareAssetPriceProvision(
      btcChallenge.assetSymbol,
      btcChallenge.maturity,
      assetPriceTarget
    );
    await registryProxy.provideData(...provideDataParams);

    const event = {
      params: eventParams,
      topicId: assetPriceBound.topicId,
      maturity: assetPriceBound.maturity,
    };
    await resolver.resolveEvent(dataProvider, event, []); //DelegateCallFailed("BaseResolver._getData")
  });
});
