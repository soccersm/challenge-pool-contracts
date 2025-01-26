import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { deploySoccersm } from "./SoccersmDeployFixture";



import {
  btcEvent,
  ethPriceRange,
  ghanaElectionEvent,
  matchEvent,
  multiCorrectScore,
  multiOutcome,
  multiTotalExact,
  multiTotalScoreRange,
  soccersmEvent,
} from "./mock";
import {
  coder,
  encodeMultiOptionByTopic,
  prepareCreateChallenge,
  TopicId,
  yesNo,
} from "./lib";

describe("ChallengePool - Stake Challenge", function () {
    it("Should [Stake]", async function () {
          const {
            oneGrand,
            baller,
            ballsToken,
            poolHandlerProxy,
            registryProxy,
            poolManagerProxy,
            keeper,
            paymaster,
          } = await loadFixture(deploySoccersm);

      //Create a challenge: BTC challenge
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
                await poolHandlerProxy.createFee(oneGrand)
              )[1]
            );
          await (poolHandlerProxy.connect(baller) as any).createChallenge(
            ...(preparedBTCChallenge as any)
          );

          expect (await poolManagerProxy.challengeId()).to.equals(1);
          //Challenge ID
          const challengeId = await poolManagerProxy.challengeId() - 1n;
          console.log("ChallengeId: ", challengeId)

          const maxPrice = oneGrand * 2n;
          let predictionValue: string = "yes";
          const prediction = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [predictionValue]);

          const stakeParams = {
            _challengeId: challengeId,
            _prediction: prediction,
            _quantity: 1,
            _maxPrice: maxPrice,
            _deadline: (await time.latest()) + 1000,
            _paymaster: ethers.ZeroAddress,
        };
        
      
        await ballsToken
          .connect(baller)
          .approve(
            await poolHandlerProxy.getAddress(),
            maxPrice
          )
          //should stake
        await expect((poolHandlerProxy.connect(baller) as any).stake(
         stakeParams._challengeId,
         stakeParams._prediction,
         stakeParams._quantity,
         stakeParams._maxPrice,
         stakeParams._deadline,
         stakeParams._paymaster 
        )).to.not.be.reverted;

        //Reverts for invalid challengeId
        const invalidChallengeIdParams = {
          ...stakeParams
        }
        //revert
        invalidChallengeIdParams._challengeId = 100n
        
        await expect((poolHandlerProxy.connect(baller) as any).stake(
         invalidChallengeIdParams._challengeId,
         invalidChallengeIdParams._prediction,
         invalidChallengeIdParams._quantity,
         invalidChallengeIdParams._maxPrice,
         invalidChallengeIdParams._deadline,
         invalidChallengeIdParams._paymaster 
        ))
        .to.be.reverted;

        //Reverts for invalid prediction
        const invalidPredictionParams = {
          ...stakeParams
        }
        //revert
        const invalidPrediction = ethers.AbiCoder.defaultAbiCoder().encode(["string"],["invalidPrediction"])
        invalidChallengeIdParams._prediction = invalidPrediction;

        await expect((poolHandlerProxy.connect(baller) as any).stake(
         invalidPredictionParams._challengeId,
         invalidPredictionParams._prediction,
         invalidPredictionParams._quantity,
         invalidPredictionParams._maxPrice,
         invalidPredictionParams._deadline,
         invalidPredictionParams._paymaster 
        ))
        .to.be.reverted;

        //Reverts for invalid quantity 
        const invalidQuantityParams = {
          ...stakeParams
        }
        //revert
        invalidQuantityParams._quantity = 0;

        await expect((poolHandlerProxy.connect(baller) as any).stake(
         invalidQuantityParams._challengeId,
         invalidQuantityParams._prediction,
         invalidQuantityParams._quantity,
         invalidQuantityParams._maxPrice,
         invalidQuantityParams._deadline,
         invalidQuantityParams._paymaster 
        ))
        .to.be.reverted;

        //Reverts for invalid maxPrice
         const invalidMaxPriceParams = {
          ...stakeParams
        }
        //revert
        const invalidMaxPrice = 0;

        await expect((poolHandlerProxy.connect(baller) as any).stake(
         invalidMaxPriceParams._challengeId,
         invalidMaxPriceParams._prediction,
         invalidMaxPriceParams._quantity,
         invalidMaxPrice,
         invalidMaxPriceParams._deadline,
         invalidMaxPriceParams._paymaster 
        ))
        .to.be.reverted;

        //Reverts for invalid deadline
         const invalidDeadline = {
          ...stakeParams
        }
        //revert
        invalidDeadline._deadline = await time.latest() - 1000;

        await expect((poolHandlerProxy.connect(baller) as any).stake(
         invalidDeadline._challengeId,
         invalidDeadline._prediction,
         invalidDeadline._quantity,
         invalidDeadline._maxPrice,
         invalidDeadline._deadline,
         invalidDeadline._paymaster 
        ))
        .to.be.reverted;
    });
})