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

describe("ChallengePool - Withdraw And Fees", function () {
    it("Should [earlyWithdraw]", async function () {
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

          //Setup: Create and Stake a challenge
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

          const challengeId = await poolManagerProxy.challengeId() - 1n;

          const maxPrice = oneGrand * 2n;
          const prediction = ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["yes"]);

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

        
    });
})