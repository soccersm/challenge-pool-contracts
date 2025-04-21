
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
  TopicId,
} from "./lib";

describe("Resolvers", async function () {
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

  it("AssetPriceTargetResolver - validateEvent", async function () {
    const { registryProxy } = await loadFixture(deployTopicResolvers);
    const [topicId, poolResolvler, dataProvier, state] =
      await registryProxy.getTopic("AssetPriceTarget");

    const resolver = await ethers.getContractAt(
      "AssetPriceTargetResolver",
      poolResolvler
    );
    const dataProvider = await ethers.getContractAt(
      "IDataProvider",
      dataProvier
    );

    //validateEvent
    const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const assetPriceTarget: AssetPriceTargetEvent = {
      maturity,
      topicId: TopicId.AssetPriceTarget,
      price: 100000,
      outcome: "above",
      assetSymbol: "BTC",
    };
    const assetPriceTargetParams = coder.encode(
      ["string", "uint256", "string"],
      [
        assetPriceTarget.assetSymbol,
        assetPriceTarget.price,
        assetPriceTarget.outcome,
      ]
    );
    const event = {
      params: assetPriceTargetParams,
      topicId: assetPriceTarget.topicId,
      maturity: assetPriceTarget.maturity,
    };

    await expect(resolver.validateEvent(await dataProvider.getAddress(), event))
      .to.not.be.reverted;

    const eventValidated = await resolver.validateEvent.staticCall(
      dataProvier,
      event
    );
    expect(eventValidated).to.be.true;

    //return false for invalid outcome
    const invalidOutcome = coder.encode(
      ["string", "uint256", "string"],
      [assetPriceTarget.assetSymbol, assetPriceTarget.price, "invalid"]
    );

    const invalidEvent = {
      params: invalidOutcome,
      topicId: assetPriceTarget.topicId,
      maturity: assetPriceTarget.maturity,
    };

    expect(
      await resolver.validateEvent.staticCall(
        await dataProvider.getAddress(),
        invalidEvent
      )
    ).to.be.false;

    //return false for zero price
    const zeroPrice = coder.encode(
      ["string", "uint256", "string"],
      [assetPriceTarget.assetSymbol, 0, assetPriceTarget.outcome]
    );
    const zeroPriceEvent = {
      params: zeroPrice,
      topicId: assetPriceTarget.topicId,
      maturity: assetPriceTarget.maturity,
    };
    expect(
      await resolver.validateEvent.staticCall(
        await dataProvider.getAddress(),
        zeroPriceEvent
      )
    ).to.be.false;
  });

  xit("AssetPriceTargetResolver - resolveEvent", async function () {
    const { registryProxy } = await loadFixture(deployTopicResolvers);
    const [topicId, poolResolvler, dataProvier, state] =
      await registryProxy.getTopic("AssetPriceTarget");

    const resolver = await ethers.getContractAt(
      "AssetPriceTargetResolver",
      poolResolvler
    );
    const dataProvider = await ethers.getContractAt(
      "IDataProvider",
      dataProvier
    );

    //resolveEvent: above outcome = no
    const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const assetPriceTarget: AssetPriceTargetEvent = {
      maturity,
      topicId: TopicId.AssetPriceTarget,
      price: 100000,
      outcome: "above",
      assetSymbol: "BTC",
    };
    const assetPriceTargetParams = coder.encode(
      ["string", "uint256", "string"],
      [
        assetPriceTarget.assetSymbol,
        assetPriceTarget.price * 100,
        assetPriceTarget.outcome,
      ]
    );
    const event = {
      params: assetPriceTargetParams,
      topicId: assetPriceTarget.topicId,
      maturity: assetPriceTarget.maturity,
    };

    await time.increaseTo(event.maturity);

    //provideData
    const provideDataParams = coder.encode(
      ["string", "uint256", "uint256"],
      [
        assetPriceTarget.assetSymbol,
        BigInt(assetPriceTarget.maturity),
        BigInt(assetPriceTarget.price),
      ]
    );
    await registryProxy.provideData(event.topicId, provideDataParams); //reverting: DelegateCallFailed("TopicRegistry.provideData")

    await expect(
      resolver.resolveEvent(await dataProvider.getAddress(), event, [])
    ).to.not.be.reverted;

    const eventResolved = await resolver.resolveEvent.staticCall(
      dataProvier,
      event,
      []
    );
    console.log("eventResolved", eventResolved);
    expect(eventResolved).to.be.equal("no");
  });
});
