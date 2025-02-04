import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";

import {
  btcEvent,
  ethPriceRange,
  ghanaElectionEvent,
  matchEvent,
  multiCorrectScore,
  multiOutcome,
  multiTotalExact,
  soccersmEvent,
} from "./mock";
import {
  ASSET_PRICES_MULTIPLIER,
  coder,
  encodeMultiOptionByTopic,
  prepareAssetPriceProvision,
  prepareCreateChallenge,
  yesNo,
} from "./lib";
import {
  getChallenge,
  getChallengeState,
  getOptionDisputes,
  getPlayerDisputes,
  getPlayerOptionSupply,
  getPoolDisputes,
} from "./test_helpers";
import { bigint } from "hardhat/internal/core/params/argumentTypes";

describe("ChallengePool - Dispute", function () {
  it("Should [Dispute]", async function () {
    const {
      oneGrand,
      oneMil,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Dispute: Setup
      /* create challenge
      stake challenge
      mature challenge
      dispute challenge
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const loosingPrediction2 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await (poolHandlerProxy.connect(keeper) as any).stake(
          0,
          winningPrediction,
          2,
          ethers.ZeroAddress
        );
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);
    
        await poolHandlerProxy.evaluate(0);

        //striker disputes
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.not.be.reverted;

        const strikerChallengeState =  await getChallengeState(poolViewProxy, 0, await striker.getAddress(), ethers.keccak256(loosingPrediction1));
        const strikerDispute = await getPlayerDisputes(poolViewProxy, 0, await striker.getAddress());
        
        expect(strikerDispute.dispute).to.equal(strikerChallengeState.playerDispute.dispute);
        expect(strikerDispute.released).to.equal(strikerChallengeState.playerDispute.released);
        expect(strikerDispute.stakes).to.equal(strikerChallengeState.playerDispute.stakes);
  });
  it("Should [Revert Invalid Dispute Conditions]", async function () {
    const {
      oneGrand,
      oneMil,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Dispute: Setup
      /* create challenge
      stake challenge
      mature challenge
      invalidate dispute challenge
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const loosingPrediction2 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);

        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);

        //revert for not evaluated
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.be.revertedWithCustomError(poolDisputeProxy, "ActionNotAllowedForState");

        //evaluate
        await poolHandlerProxy.evaluate(0);

        //revert keeper disputes(no stakes)
        await expect((poolDisputeProxy.connect(keeper) as any).dispute(0, loosingPrediction1)).to.be.revertedWithCustomError(poolDisputeProxy, "PlayerNotInPool");

        //revert for invalid outcome
        const invalidOutcome = coder.encode(["string"], ["invalid"]);
         await expect((poolDisputeProxy.connect(keeper) as any).dispute(0, invalidOutcome)).to.be.revertedWithCustomError(poolDisputeProxy, "InvalidOutcome");

        //revert for past time for dispute(1hour)
        await time.increase(60 * 60);
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.be.revertedWithCustomError(poolDisputeProxy, "DisputePeriodElapsed");

  });

   it("Should [Settle]", async function () {
    const {
      oneGrand,
      oneMil,
      owner,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Settle: Setup
      /* create challenge
      stake challenge
      mature challenge
      dispute
      settle 
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const loosingPrediction2 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);

        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);
    
        //evaluate
        await poolHandlerProxy.evaluate(0);

        //dispute
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.not.be.reverted;
        //Settle
        await expect((poolDisputeProxy.settle(0, loosingPrediction1))).to.not.be.reverted;

  });

   it("Should [Revert with Invalid Settle Conditions]", async function () {
    const {
      oneGrand,
      oneMil,
      owner,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Settle: Setup
      /* create challenge
      stake challenge
      mature challenge
      dispute 
      invalid settle conditions
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);

        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);
    
        //evaluate
        await poolHandlerProxy.evaluate(0);

        //reverts for settle: non-disputed state
        await expect((poolDisputeProxy.settle(0, loosingPrediction1))).to.be.revertedWithCustomError(poolDisputeProxy, "ActionNotAllowedForState");

        //dispute
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.not.be.reverted;

        //reverts for settle: invalid challengeId
        await expect((poolDisputeProxy.settle(1, loosingPrediction1))).to.be.revertedWithCustomError(poolDisputeProxy, "InvalidChallenge");

        //reverts for settle: invalid outcome
        // const invalidOutcome = coder.encode(["string"], ["invalid"]);
        // await expect((poolDisputeProxy.settle(0, invalidOutcome))).to.be.reverted; //not reverting

        //reverts for settle: non-council
        await expect(((poolDisputeProxy.connect(keeper) as any).settle(1, loosingPrediction1))).to.be.reverted;
  });

   it("Should [releaseDispute]", async function () {
    const {
      oneGrand,
      oneMil,
      owner,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Dispute: Setup
      /* create challenge
      stake challenge
      mature challenge
      dispute
      settle 
      close
      releaseDispute
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);

        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);
    
        //evaluate
        await poolHandlerProxy.evaluate(0);

        //striker dispute
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.not.be.reverted;

        //Settle
        await expect((poolDisputeProxy.settle(0, loosingPrediction1))).to.not.be.reverted;
        await time.increase(60 * 60);
        //close 
        await expect((poolHandlerProxy.close(0))).to.not.be.reverted;
        
        //striker releaseDispute
        await expect((poolDisputeProxy.connect(striker)as any).releaseDispute(0)).to.not.be.reverted;
  });

   it("Should [revert releaseDispute with Invalid Conditions]", async function () {
    const {
      oneGrand,
      oneMil,
      owner,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Dispute: Setup
      /* create challenge
      stake challenge
      mature challenge
      dispute
      settle 
      close
      releaseDispute with invalid conditions
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);

        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);
    
        //evaluate
        await poolHandlerProxy.evaluate(0);

        //striker dispute
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.not.be.reverted;

        //Settle
        await expect((poolDisputeProxy.settle(0, winningPrediction))).to.not.be.reverted;

        //revert with pool not closed
        await expect((poolDisputeProxy.connect(striker)as any).releaseDispute(0)).be.revertedWithCustomError(poolDisputeProxy, "ActionNotAllowedForState");

        //close: revert with dispute period
        await expect((poolHandlerProxy.close(0))).to.be.revertedWithCustomError(poolHandlerProxy, "DisputePeriod");

        await time.increase(60 * 60);

        //revert with not closed state
        await expect((poolDisputeProxy.connect(striker)as any).releaseDispute(0)).to.be.reverted;

        //close
        await expect((poolHandlerProxy.close(0))).to.not.be.reverted;

        //revert with player not in pool
        await expect((poolDisputeProxy.connect(keeper)as any).releaseDispute(0)).be.revertedWithCustomError(poolDisputeProxy, "PlayerNotInPool");

        //revert with player did not dispute
        await expect((poolDisputeProxy.connect(baller)as any).releaseDispute(0)).be.revertedWithCustomError(poolDisputeProxy, "PlayerDidNotDispute");

        //revert with striker lost dispute 
        await expect((poolDisputeProxy.connect(striker)as any).releaseDispute(0)).be.revertedWithCustomError(poolDisputeProxy, "PlayerLostDispute");
  });
   it("Should [cancel]", async function () {
    const {
      oneGrand,
      oneMil,
      baller,
      striker,
      ballsToken,
      poolHandlerProxy,
      registryProxy,
      poolViewProxy,
      poolDisputeProxy,
      poolManagerProxy,
      keeper,
      paymaster,
    } = await loadFixture(deploySoccersm);

    // Dispute: Setup
      /* create challenge
      stake challenge
      mature challenge
      Can cancel at any other state
      */

    // create challenge
    const ch = btcEvent(
          await ballsToken.getAddress(),
          1,
          oneGrand,
          ethers.ZeroAddress
        );
    
        const winningPrediction = yesNo.no;
        const loosingPrediction1 = yesNo.yes;
        const assetPrice = 110000 * ASSET_PRICES_MULTIPLIER;
    
        const preparedMultiStementChallenge = prepareCreateChallenge(ch.challenge);
    
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            (
              await poolViewProxy.createFee(oneGrand)
            )[1]
          );
        await (poolHandlerProxy.connect(baller) as any).createChallenge(
          ...(preparedMultiStementChallenge as any)
        );
        expect(await poolManagerProxy.challengeId()).to.equal(1);

        await ballsToken
          .connect(baller)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        //striker can stake
        await ballsToken
          .connect(striker)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
        await (poolHandlerProxy.connect(striker) as any).stake(
          0,
          loosingPrediction1,
          2,
          ethers.ZeroAddress
        );
    
        await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);

        //baller can stake again
        await (poolHandlerProxy.connect(baller) as any).stake(
          0,
          winningPrediction,
          1,
          ethers.ZeroAddress
        );
    
        await ballsToken.transfer(keeper, oneMil);
        await ballsToken
          .connect(keeper)
          .approve(await poolHandlerProxy.getAddress(), oneMil);
    
        await time.increaseTo(ch.maturity);
        const provideDataParams = prepareAssetPriceProvision(
          ch.assetSymbol,
          ch.maturity,
          assetPrice
        );
        await registryProxy.provideData(...provideDataParams);
    
        //evaluate
        await poolHandlerProxy.evaluate(0);

        //striker dispute
        await expect((poolDisputeProxy.connect(striker) as any).dispute(0, loosingPrediction1)).to.not.be.reverted;

        //Settle
        await expect((poolDisputeProxy.settle(0, winningPrediction))).to.not.be.reverted;

        //can cancel after Settle or any state
        await expect((poolDisputeProxy.cancel(0))).to.not.be.reverted;

        //revert for not soccersmCouncil
        await expect(((poolDisputeProxy.connect(baller) as any).cancel(0))).to.be.reverted;

        //revert for invalid challengeId
        await expect((poolDisputeProxy.cancel(1))).to.be.revertedWithCustomError(poolDisputeProxy, "InvalidChallenge");
  });
});
