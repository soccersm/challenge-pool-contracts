import { ethers } from "hardhat";
import { statements } from "./data/statements";
import {
  CreateChallenge,
  EventOption,
  prepareCreateChallenge,
  StatementEvent,
  TopicId,
} from "../test/lib";

async function main() {
  const pool = await ethers.getContractAt(
    "IChallengePoolHandler",
    process.env.SOCCERSM_CONTRACT!
  );

  const coder = new ethers.AbiCoder();
  for (const s of statements) {
    const statement: StatementEvent = {
      maturity: s.maturity,
      topicId: TopicId.Statement,
      statement: s.statement,
      statementId: s.id,
    };

    const opts: EventOption[] = s.options;

    const challenge: CreateChallenge = {
      events: [statement],
      options: opts,
      stakeToken: process.env.BALLS_TOKEN!,
      prediction: s.prediction,
      quantity: 1,
      basePrice: BigInt(3e18),
      paymaster: ethers.ZeroAddress,
    };
    const params = prepareCreateChallenge(challenge);
    console.log(params);
    
    const tx = await pool.createChallenge(...(params as any));
    await tx.wait();
    console.log(`Just created challenge for statement with id ${s.id}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
