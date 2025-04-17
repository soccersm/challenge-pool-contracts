import { prepareCreateChallenge } from "./lib";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { toUtf8Bytes } from "ethers";
import { btcEvent } from "./mock";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { FacetCutAction, functionSelectors } from "../ignition/lib";

describe("GelatoHandler", async function () {
  async function deployGelatoHandler() {
    const {
      poolViewProxy,
      poolHandlerProxy,
      poolManagerProxy,
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
      expectedError?: string;
    },
    fixture: Awaited<ReturnType<typeof deployGelatoHandler>>
  ) {
    const { stakeToken, quantity, basePrice, paymaster, deadline } = params;

    const {
      ballsToken,
      poolHandlerProxy,
      poolViewProxy,
      gelatoHandlerProxy,
      poolManagerProxy,
      baller,
      oneGrand,
    } = fixture;

    // params or defaults
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
    await testCreateChallengeRelay({}, fixture);
    expect(await fixture.poolManagerProxy.challengeId()).to.equals(1);
  });

  it("Should Reverts for createChallengeRelay", async function () {
    const fixture = await loadFixture(deployGelatoHandler);
    //revert for whenNotPaused
    const { psProxy } = fixture;
    await psProxy.pause();

    await expect(
      testCreateChallengeRelay({}, fixture)
    ).to.be.revertedWithCustomError(psProxy, "Pausable__Paused");

    //revert for nonZero quantity
  });
});
