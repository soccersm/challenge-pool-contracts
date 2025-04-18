import {
  MultiFootBallCorrectScoreEvent,
  prepareCreateChallenge,
  TopicId,
} from "./lib";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { toUtf8Bytes } from "ethers";
import { btcEvent, multiCorrectScore } from "./mock";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { FacetCutAction, functionSelectors } from "../ignition/lib";

describe("GelatoHandler: createChallengeRelay", async function () {
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
      baller,
      gelatoHandler,
      gelatoHandlerProxy,
    };
  }

  async function testCreateChallengeRelay(
    params: {
      stakeToken?: string;
      quantity?: number;
      basePrice?: BigInt;
      paymaster?: string;
      deadline?: number;
    },
    fixture: Awaited<ReturnType<typeof deployGelatoHandler>>
  ) {
    const { stakeToken, quantity, basePrice, paymaster, deadline } = params;

    const {
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
      baller,
      oneGrand,
    } = fixture;

    //defaults
    const stakeTokenAddress = stakeToken || (await ballsToken.getAddress());
    const quantityVal = quantity ?? 1;
    const basePriceVal = basePrice ?? oneGrand;
    const paymasterVal = paymaster ?? ethers.ZeroAddress;

    // Generate challenge
    const btcChallenge = btcEvent(
      stakeTokenAddress,
      quantityVal,
      basePriceVal,
      paymasterVal,
      deadline
    );
    const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);

    //fee
    const fee = (await poolViewProxy.createFee(basePriceVal))[1];

    // Approve fee
    await ballsToken
      .connect(baller)
      .approve(await poolHandlerProxy.getAddress(), fee);

    return (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
      ...preparedBTCChallenge
    );
  }

  it("Should Deploy and add GelatoHandler to Diamond", async function () {
    const { gelatoHandler, gelatoHandlerProxy } = await loadFixture(
      deployGelatoHandler
    );
    expect(await gelatoHandler.getAddress()).to.be.properAddress;
    expect(gelatoHandlerProxy.interface.hasFunction("createChallengeRelay")).to
      .be.true;
    expect(gelatoHandlerProxy.interface.hasFunction("stakeRelay")).to.be.true;
    expect(gelatoHandlerProxy.interface.hasFunction("withdrawRelay")).to.be
      .true;
    expect(gelatoHandlerProxy.interface.hasFunction("bulkWithdrawRelay")).to.be
      .true;
    expect(gelatoHandlerProxy.interface.hasFunction("nonExisting")).to.be.false;
  });

  it("Should createChallengeRelay", async function () {
    const fixture = await loadFixture(deployGelatoHandler);
    const { poolManagerProxy } = fixture;

    await testCreateChallengeRelay({}, fixture);
    expect(await poolManagerProxy.challengeId()).to.equals(1);
  });

  it("Should Modifier Reverts for createChallengeRelay", async function () {
    const fixture = await loadFixture(deployGelatoHandler);
    //revert for whenNotPaused
    const { psProxy, gelatoHandlerProxy } = fixture;
    await psProxy.pause();

    await expect(
      testCreateChallengeRelay({}, fixture)
    ).to.be.revertedWithCustomError(psProxy, "Pausable__Paused");

    await psProxy.unpause();

    //revert for Zero quantity
    await expect(
      testCreateChallengeRelay({ quantity: 0 }, fixture)
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "ZeroNumber");

    //revert for zero basePrice
    await expect(testCreateChallengeRelay({ basePrice: 0n }, fixture)).to.be
      .reverted;

    //revert for positiveAddress and supportedToken
    await expect(
      testCreateChallengeRelay({ stakeToken: ethers.ZeroAddress }, fixture)
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "ZeroAddress");

    await expect(
      testCreateChallengeRelay(
        { stakeToken: ethers.Wallet.createRandom().address },
        fixture
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "UnsupportedToken");

    //revert for validStake
    const halfGrand = BigInt(5e17);
    await expect(
      testCreateChallengeRelay({ basePrice: halfGrand }, fixture)
    ).to.be.revertedWithCustomError(
      gelatoHandlerProxy,
      "StakeLowerThanMinimum"
    );
  });

  it("Should revert for createChallengeRelay", async function () {
    const fixture = await loadFixture(deployGelatoHandler);
    const {
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
      registryProxy,
    } = fixture;

    const btcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );

    const invalidEventChallenge = structuredClone(btcChallenge.challenge);
    invalidEventChallenge.events = [];

    const invalidEventsPreparedBTCChallenge = prepareCreateChallenge(
      invalidEventChallenge
    );

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
        ...invalidEventsPreparedBTCChallenge
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidEventLength");

    //revert InvalidEventMaturity
    const invalidMaturityEvent = structuredClone(btcChallenge.challenge);
    invalidMaturityEvent.events[0].maturity =
      Math.floor(Date.now() / 1000) + 60;

    const invalidMaturityPreparedBTCChallenge =
      prepareCreateChallenge(invalidMaturityEvent);

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...invalidMaturityPreparedBTCChallenge
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidEventMaturity");

    //disable btc Event topic
    await registryProxy.disableTopic(TopicId.AssetPriceBounded);
    await registryProxy.disableTopic(TopicId.AssetPriceTarget);

    //revert InvalidEventTopic
    await expect(
      testCreateChallengeRelay({}, fixture)
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidEventTopic");
  });

  it("Should revert for createChallengeRelay: multi", async function () {
    const {
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
    } = await loadFixture(deployGelatoHandler);

    //multi event
    const multiCorrectScoreChallenge = multiCorrectScore(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const preparedMultiCorrectScoreChallenge = prepareCreateChallenge(
      multiCorrectScoreChallenge.challenge
    );
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
        ...preparedMultiCorrectScoreChallenge
      )
    ).to.not.be.reverted;

    //revert InvalidOptionsLength
    const invalidOptionsMulti = structuredClone(
      multiCorrectScoreChallenge.challenge
    );
    invalidOptionsMulti.options = [[1, 2]];
    const preparedInvalidMulti = prepareCreateChallenge(invalidOptionsMulti);

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...(preparedInvalidMulti as any)
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidOptionsLength");

    //revert for event > 1
    //events
    const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const multiFootBallCorrectScore: MultiFootBallCorrectScoreEvent = {
      maturity,
      topicId: TopicId.MultiFootBallCorrectScore,
      matchId: "xyz",
    };
    const invalidEventMulti = structuredClone(
      multiCorrectScoreChallenge.challenge
    );
    invalidEventMulti.events = [
      multiFootBallCorrectScore,
      multiFootBallCorrectScore,
    ];
    const invalidPreparedMulti = prepareCreateChallenge(invalidEventMulti);

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...(invalidPreparedMulti as any)
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidEventLength");

    //revert invalid prediction
    const invalidPredictionMulti = structuredClone(
      multiCorrectScoreChallenge.challenge
    );
    invalidPredictionMulti.prediction = [0, 0];
    const invalidPreparedPredictionMulti = prepareCreateChallenge(
      invalidPredictionMulti
    );

    await expect(
      (gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
        ...invalidPreparedPredictionMulti
      )
    ).to.be.revertedWithCustomError(gelatoHandlerProxy, "InvalidPrediction");
  });
});
