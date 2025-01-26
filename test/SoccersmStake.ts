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
          const challengeId = await poolManagerProxy.challengeId() - BigInt(1);
          console.log("ChallengeId: ", challengeId)

          const maxPrice = oneGrand + oneGrand;
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

        //Reverts for invalid Challenge Id
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
        console.log("invalid params: ", invalidChallengeIdParams)

    });
})