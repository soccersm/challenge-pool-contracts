import { ignition, ethers } from "hardhat";
import { prepareCreateChallenge } from "../test/lib";
import { btcEvent, ghanaElectionEvent } from "../test/mock";
import ChallengePoolModule from "../ignition/modules/ChallengePool";

async function main() {
  const pool = await ignition.deploy(ChallengePoolModule);
  const ballsToken = await ethers.deployContract("BallsToken");

  await ballsToken.waitForDeployment();

  const balls = await ballsToken.getAddress();
  const challenge = ghanaElectionEvent(
    await ballsToken.getAddress(),
    1,
    BigInt(1000 * 1e18),
    ethers.ZeroAddress
  );
  const preparedChallenge = prepareCreateChallenge(challenge.challenge);
  // console.log(preparedChallenge);

  console.log(await pool.poolHandlerProxy.getAddress());
  console.log(await pool.registryProxy.getTopic("Statement"));
  await pool.poolManagerProxy.addStakeToken(balls);

  await ballsToken.approve(
    await pool.poolHandlerProxy.getAddress(),
    BigInt(2000 * 1e18)
  );

  await pool.poolHandlerProxy.createChallenge(...(preparedChallenge as any));
  const ch = await pool.poolManagerProxy.stakeToken(balls);
  console.log(`Create Successfull ... ${ch}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
