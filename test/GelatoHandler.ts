import { BallsToken } from './../typechain-types/contracts/tokens/Balls.sol/BallsToken';
import { ChallengePoolView } from './../typechain-types/contracts/modules/ChallengePoolView';
import { prepareCreateChallenge } from "./lib";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { toUtf8Bytes } from "ethers";
import { btcEvent } from "./mock";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { FacetCutAction, functionSelectors } from '../ignition/lib';

describe("GelatoHandler", async function () {
  async function deployGelatoHandler() {
    const {
      poolViewProxy,
      poolHandlerProxy,
      poolManagerProxy,
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
      paymaster,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
      DEFAULT_ADMIN_ROLE,
      ballsToken,
      oneGrand,
      baller,
      gelatoHandler,
      gelatoHandlerProxy
    };
  }

  it("Should Deploy and add GelatoHandler to Diamond", async function() {
    const {gelatoHandler, owner, gelatoHandlerProxy, cutProxy} = await loadFixture(deployGelatoHandler); 
    expect (await gelatoHandler.getAddress()).to.be.properAddress;
    
        expect(gelatoHandlerProxy.interface.hasFunction("createChallengeRelay")).to.be.true;
        expect(gelatoHandlerProxy.interface.hasFunction("stakeRelay")).to.be.true;
        expect(gelatoHandlerProxy.interface.hasFunction("withdrawRelay"))
          .to.be.true;
        expect(gelatoHandlerProxy.interface.hasFunction("bulkWithdrawRelay")).to
          .be.true;
        expect(gelatoHandlerProxy.interface.hasFunction("nonExisting"))
          .to.be.false;
  });

  it("Should createChallengeRelay", async function() {
    const {
      gelatoHandlerProxy,
      ballsToken,
      oneGrand,
      baller,
      poolHandlerProxy,
      poolViewProxy,
      poolManagerProxy,
    } = await loadFixture(deployGelatoHandler);
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

    await expect((gelatoHandlerProxy.connect(baller) as any).createChallengeRelay(
      ...(preparedBTCChallenge as any)
    )).to.not.be.reverted;
    expect(await poolManagerProxy.challengeId()).to.equals(1);
  })

});
