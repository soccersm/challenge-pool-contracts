import {
  ASSET_PRICES_MULTIPLIER,
  coder,
  encodeMultiOptionByTopic,
  prepareAssetPriceProvision,
  prepareCreateChallenge,
  prepareStatementEventParam,
  prepareStatementProvision,
  TopicId,
  yesNo,
} from "./lib";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { toUtf8Bytes } from "ethers";
import { btcEvent, ethPriceRange } from "./mock";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { FacetCutAction, functionSelectors } from "../ignition/lib";

describe("GelatoHandler: stakeRelay, withdrawRelay", async function () {
  async function deployGelatoHandler() {
    const {
      poolViewProxy,
      poolHandlerProxy,
      poolManagerProxy,
      registryProxy,
      psProxy,
      cutProxy,
      paymaster,
      ballsToken,
      oneGrand,
      oneMil,
      baller,
    } = await loadFixture(deploySoccersm);
    const [owner, user] = await ethers.getSigners();
    const CHALLENGE_POOL_MANAGER = ethers.keccak256(
      toUtf8Bytes("CHALLENGE_POOL_MANAGER")
    );
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

    const GelatoHandler = await ethers.getContractFactory("GelatoHandler");
    const gelatoHandler = await GelatoHandler.deploy();

    // Prepare cut
    const selectors = functionSelectors("GelatoHandler");

    const cut = [
      {
        facetAddress: await gelatoHandler.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: selectors,
      },
    ];

    await cutProxy.diamondCut(cut, ethers.ZeroAddress, "0x");

    //verify GelatoHandler is added to Diamond
    const gelatoHandlerProxy = GelatoHandler.attach(
      await cutProxy.getAddress()
    );

    return {
      poolViewProxy,
      poolManagerProxy,
      poolHandlerProxy,
      cutProxy,
      psProxy,
      registryProxy,
      paymaster,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
      DEFAULT_ADMIN_ROLE,
      ballsToken,
      oneGrand,
      oneMil,
      baller,
      gelatoHandler,
      gelatoHandlerProxy,
    };
  }

  it("Should createChallengeRelay and stakeRelay", async function () {
    const {
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
      poolManagerProxy,
      oneMil,
    } = await loadFixture(deployGelatoHandler);

    //create BTC challenge
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
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;
    expect(await poolManagerProxy.challengeId()).to.equals(1);

    //stake
    const prediction = coder.encode(["string"], ["yes"]);

    const stakeParams = {
      challengeId: 0,
      prediction: prediction,
      quantity: 1,
      paymaster: ethers.ZeroAddress,
    };

    await ballsToken
      .connect(baller)
      .approve(await gelatoHandlerProxy.getAddress(), oneMil);

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).stakeRelay(
        stakeParams.challengeId,
        stakeParams.prediction,
        stakeParams.quantity,
        stakeParams.paymaster
      )
    ).to.emit(poolHandlerProxy, "Stake");
  });

  it("Should reverts for stake", async function () {
    const {
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      psProxy,
      gelatoHandlerProxy,
      poolManagerProxy,
      oneMil,
    } = await loadFixture(deployGelatoHandler);
    //create BTC challenge
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
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;

    //revert for when paused
    await psProxy.pause();
    const prediction = coder.encode(["string"], ["yes"]);
    const stakeParams = {
      challengeId: 0,
      prediction: prediction,
      quantity: 1,
      paymaster: ethers.ZeroAddress,
    };
    await ballsToken
      .connect(baller)
      .approve(await gelatoHandlerProxy.getAddress(), oneMil);

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).stakeRelay(
        stakeParams.challengeId,
        stakeParams.prediction,
        stakeParams.quantity,
        stakeParams.paymaster
      )
    ).to.be.revertedWithCustomError(psProxy, "Pausable__Paused");
    await psProxy.unpause();

    //revert for invalidChallenge
    await expect(
      (gelatoHandlerProxy.connect(baller) as any).stakeRelay(
        (stakeParams.challengeId = 10),
        stakeParams.prediction,
        stakeParams.quantity,
        stakeParams.paymaster
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidChallenge");

    //revert for invalidPrediction
    const invalidPrediction = coder.encode(["string"], ["none"]);

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).stakeRelay(
        (stakeParams.challengeId = 0),
        invalidPrediction,
        stakeParams.quantity,
        stakeParams.paymaster
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidPrediction");

    //revert for nonZero
    await expect(
      (gelatoHandlerProxy.connect(baller) as any).stakeRelay(
        stakeParams.challengeId,
        stakeParams.prediction,
        (stakeParams.quantity = 0),
        stakeParams.paymaster
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "ZeroNumber");
  });

  it("Should withdrawRelay", async function () {
    const {
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
      poolManagerProxy,
      psProxy,
      registryProxy,
      oneMil,
    } = await loadFixture(deployGelatoHandler);

    //create -> stake -> close -> withdraw
    //create BTC challenge
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
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;
    //stake
    const prediction = yesNo.no;

    const stakeParams = {
      challengeId: 0,
      prediction: prediction,
      quantity: 1,
      paymaster: ethers.ZeroAddress,
    };

    await ballsToken
      .connect(baller)
      .approve(await gelatoHandlerProxy.getAddress(), oneMil);

    await (gelatoHandlerProxy.connect(baller) as any).stakeRelay(
      stakeParams.challengeId,
      stakeParams.prediction,
      stakeParams.quantity,
      stakeParams.paymaster
    );

    //register, evaluate, close
    await time.increaseTo(btcChallenge.maturity);
    const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    const provideDataParams = prepareAssetPriceProvision(
      btcChallenge.assetSymbol,
      btcChallenge.maturity,
      assetPrice
    );
    await registryProxy.provideData(...provideDataParams);

    await poolHandlerProxy.evaluate(0);
    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);

    //revert invalidChallengeId
    await expect(
      (gelatoHandlerProxy.connect(baller) as any).withdrawRelay(1)
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidChallenge");

    //revert on pause
    await psProxy.pause();
    await expect(
      (gelatoHandlerProxy.connect(baller) as any).withdrawRelay(0)
    ).to.be.revertedWithCustomError(psProxy, "Pausable__Paused");
    await psProxy.unpause();

    //withdraw
    await expect((gelatoHandlerProxy.connect(baller) as any).withdrawRelay(0))
      .to.not.be.reverted;
  });

  it("Should bulkWithdrawRelay", async function () {
    const {
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
      poolManagerProxy,
      psProxy,
      registryProxy,
      oneMil,
    } = await loadFixture(deployGelatoHandler);

    //create -> stake -> close -> withdraw
    //create BTC challenge
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
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;

    //create ETH challenge
    const ethPriceRangeChallenge = ethPriceRange(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const preparedETHChallenge = prepareCreateChallenge(
      ethPriceRangeChallenge.challenge
    );
    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await(poolHandlerProxy.connect(baller) as any).createChallenge(
      ...(preparedETHChallenge as any)
    );

    //stake btc
    const prediction = yesNo.no;

    const stakeParams = {
      challengeId: 0,
      prediction: prediction,
      quantity: 1,
      paymaster: ethers.ZeroAddress,
    };

    await ballsToken
      .connect(baller)
      .approve(await gelatoHandlerProxy.getAddress(), oneMil);

    await(gelatoHandlerProxy.connect(baller) as any).stakeRelay(
      stakeParams.challengeId,
      stakeParams.prediction,
      stakeParams.quantity,
      stakeParams.paymaster
    );

    //stake eth
    const ethPrediction = encodeMultiOptionByTopic(
      TopicId.MultiAssetRange,
      [6000, 7000]
    );
    await(gelatoHandlerProxy.connect(baller) as any).stakeRelay(
      1,
      ethPrediction,
      2,
      ethers.ZeroAddress
    );

    //btc: register, evaluate, close
    await time.increaseTo(btcChallenge.maturity);
    const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    const provideDataParams = prepareAssetPriceProvision(
      btcChallenge.assetSymbol,
      btcChallenge.maturity,
      assetPrice
    );
    await registryProxy.provideData(...provideDataParams);

    await poolHandlerProxy.evaluate(0);
    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);

    //eth: register, evaluate, close
    const ethAssetPrice = 6500 * ASSET_PRICES_MULTIPLIER;
    const ethProvideDataPrams = prepareAssetPriceProvision(
      ethPriceRangeChallenge.assetSymbol,
      ethPriceRangeChallenge.maturity,
      ethAssetPrice
    );
    await registryProxy.provideData(...ethProvideDataPrams);

    await poolHandlerProxy.evaluate(1);
    await time.increase(60 * 60);
    await poolHandlerProxy.close(1);

    //bulkwithdraw

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).bulkWithdrawRelay([0, 1])
    ).to.not.be.reverted;

    //revert for InvalidChallenge
    await expect(
      (gelatoHandlerProxy.connect(baller) as any).bulkWithdrawRelay([2, 3])
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidChallenge");
  });
});
