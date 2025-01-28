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
  coder,
  encodeMultiOptionByTopic,
  prepareCreateChallenge,
} from "./lib";

describe("ChallengePool - Create Challenge", function () {
    it("Should [Create]", async function () {
          const {
            oneGrand,
            baller,
            ballsToken,
            poolHandlerProxy,
            registryProxy,
            poolViewProxy,
            poolManagerProxy,
            keeper,
            paymaster,
          } = await loadFixture(deploySoccersm);

          const btcChallenge = btcEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          const preparedBTCChallenge = prepareCreateChallenge(
            btcChallenge.challenge
          );
    
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge as any)
          );
          const matchChallenge = matchEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          const preparedMatchChallenge = prepareCreateChallenge(
            matchChallenge.challenge
          );
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedMatchChallenge as any)
          );
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
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedETHChallenge as any)
          );
    
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
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedMultiCorrectScoreChallenge as any)
          );
    
          const multiOutcomeChallenge = multiOutcome(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          const preparedMultiOutcomeChallenge = prepareCreateChallenge(
            multiOutcomeChallenge.challenge
          );
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedMultiOutcomeChallenge as any)
          );
    
          const multiTotalExactChallenge = multiTotalExact(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          const preparedMultiTotalExactChallenge = prepareCreateChallenge(
            multiTotalExactChallenge.challenge
          );
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedMultiTotalExactChallenge as any)
          );
    
          const multiTotalScoreRangeChallenge = multiTotalExact(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          const preparedMultiTotalScoreRangeChallenge = prepareCreateChallenge(
            multiTotalScoreRangeChallenge.challenge
          );
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedMultiTotalScoreRangeChallenge as any)
          );
    
          const gh = ghanaElectionEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
    
          await registryProxy.registerEvent(
            gh.topicId,
            coder.encode(
              ["string", "string", "uint256", "bytes[]"],
              [
                gh.statementId,
                gh.statement,
                gh.maturity,
                gh.options.map((o) => encodeMultiOptionByTopic(gh.topicId, o)),
              ]
            )
          );
    
          const preparedMultiStementChallenge = prepareCreateChallenge(
            gh.challenge
          );
    
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
    
          const sc = soccersmEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            await paymaster.getAddress()
          );
    
          await registryProxy.registerEvent(
            sc.topicId,
            coder.encode(
              ["string", "string", "uint256", "bytes[]"],
              [
                sc.statementId,
                sc.statement,
                sc.maturity,
                sc.options.map((o) => encodeMultiOptionByTopic(sc.topicId, o)),
              ]
            )
          );
    
          const preparedStementChallenge = prepareCreateChallenge(sc.challenge);
    
          await (poolHandlerProxy.connect(keeper) as any).createChallenge(
            ...(preparedStementChallenge as any)
          );
          expect(await poolManagerProxy.challengeId()).to.equals(9);
    
          // Reverts for createChallenge //
          // _stakeToken -> zeroAddressToken, 
          // supportedToken -> unsupportedToken
          const btcChallenge__zeroAddressToken = btcEvent(
            ethers.ZeroAddress,
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          const preparedBTCChallenge__zeroAddressToken = prepareCreateChallenge(
            btcChallenge__zeroAddressToken.challenge
          );
              await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          //Should revert
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge__zeroAddressToken as any)
          )).to.be.revertedWithCustomError(poolHandlerProxy, "ZeroAddress");
    
          //remove stake token
          await poolManagerProxy.removeStakeToken(await ballsToken.getAddress());
          const btcChallenge__unsupportedToken = btcEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
    
          const preparedBTCChallenge__unsupportedToken = prepareCreateChallenge(
            btcChallenge__unsupportedToken.challenge
          );
              await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          //Should revert for unsupportedToken
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge__unsupportedToken as any)
          )).to.be.revertedWithCustomError(poolHandlerProxy, "UnsupportedToken");
          // add stake token for rest of tests
           await poolManagerProxy.addStakeToken(await ballsToken.getAddress());

          /// Reverts for nonZero: nonZero(_quantity), nonZero(_basePrice)
          const quantity = 0;
          const basePrice = BigInt(0);
            const btcChallenge__zeroQuantityBasePrice = btcEvent(
            await ballsToken.getAddress(),
            quantity,
            basePrice,
            ethers.ZeroAddress
          );
          const preparedBTCChallenge__zeroQuantityBasePrice = prepareCreateChallenge(
            btcChallenge__zeroQuantityBasePrice.challenge
          );
              await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          //Should revert for zero quantity/baseprice
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge__zeroQuantityBasePrice as any)
          )).to.be.reverted;

          /// Reverts for validStake, validPrediction
          const invalidStake = BigInt(1e17); //less than minStakeAmount(1e18)
           const btcChallenge__invalidStakePrediction = btcEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          //btcChallenge__invalidStakePrediction.challenge.prediction = "InvalidPrediction" as YesNo; //it returns undefined
          btcChallenge__invalidStakePrediction.challenge.basePrice = invalidStake

          const preparedBTCChallenge__invalidStakePrediction = prepareCreateChallenge(
            btcChallenge__invalidStakePrediction.challenge
          );
              await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
         // Should revert for invalidStake, invalidPrediction
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge__invalidStakePrediction as any)
          )).to.be.reverted;

          /// reverts for if conditions: _events.length
          // _events.length == 0
          const btcChallenge__zeroEventLength = btcEvent(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          btcChallenge__zeroEventLength.challenge.events = [];
          const preparedBTCChallenge__zeroEventLength = prepareCreateChallenge(
            btcChallenge__zeroEventLength.challenge
          );
              await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
          //Should revert for zero event length
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge__zeroEventLength as any)
          )).to.be.revertedWithCustomError(poolHandlerProxy, "InvalidEventLength");

          //Revert for multi options: InvalidOptionsLength: options > 2
          const ethPriceRangeChallenge__invalidOptionsLength = ethPriceRange(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          (ethPriceRangeChallenge__invalidOptionsLength as any ).options = [[2000, 3000]];
          (ethPriceRangeChallenge__invalidOptionsLength as any ).challenge.options = [[2000, 3000]]
            const preparedETHChallenge__invalidOptionsLength = prepareCreateChallenge(
            ethPriceRangeChallenge__invalidOptionsLength.challenge
          );
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
            //revert
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedETHChallenge__invalidOptionsLength as any)
          )).to.be.reverted;

          // Revert on maturity (Past time)
          const ethPriceRangeChallenge__invalidMaturity = ethPriceRange(
            await ballsToken.getAddress(),
            1,
            oneGrand,
            ethers.ZeroAddress
          );
          ethPriceRangeChallenge__invalidMaturity.challenge.events[0].maturity = ethPriceRangeChallenge__invalidMaturity.challenge.events[0].maturity - (48 * 60 * 60);
          
            const preparedETHChallenge__invalidMaturity = prepareCreateChallenge(
            ethPriceRangeChallenge__invalidMaturity.challenge
          );
          await ballsToken
            .connect(baller)
            .approve(
              await poolHandlerProxy.getAddress(),
              (
                await poolViewProxy.createFee(oneGrand)
              )[1]
            );
            //revert on invalid maturity
          await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedETHChallenge__invalidMaturity as any)
          )).to.be.reverted;

          // Revert on invalid topicId: TYPE ERROR
        //   const ethPriceRangeChallenge__invalidTopicId = ethPriceRange(
        //     await ballsToken.getAddress(),
        //     1,
        //     oneGrand,
        //     ethers.ZeroAddress
        //   );
        //     ethPriceRangeChallenge__invalidTopicId.challenge.events[0].topicId = "InvalidTopicId" as any;

        //     console.log("ETH Challenge - TopicID: ", ethPriceRangeChallenge__invalidTopicId.challenge.events[0]);

        //     //!throws error on prepareCreateChallenge
        //     const preparedETHChallenge__invalidTopicId = prepareCreateChallenge(
        //     ethPriceRangeChallenge__invalidTopicId.challenge
        //   );

        //   await ballsToken
        //     .connect(baller)
        //     .approve(
        //       await poolHandlerProxy.getAddress(),
        //       (
        //         await poolViewProxy.createFee(oneGrand)
        //       )[1]
        //     );
        //     //revert on invalid topic id
        //   await expect((poolHandlerProxy.connect(baller) as any).createChallenge(
        //     ...(preparedETHChallenge__invalidTopicId as any)
        //   )).to.be.reverted;

        }); 
})