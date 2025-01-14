import { ignition, ethers } from "hardhat";
import { prepareCreateChallenge } from "./lib";
import { ghanaElectionEvent } from "./mock";

async function main() {
  const balls = "0x935E49458145B917a0EaEE279652F724EA78d8F0";
  const soccersm = "0xf6A2C93fDC1d1eA25E1aEc278c13AAca884394D5";
  const poolHandlerProxy = await ethers.getContractAt("ChallengePoolHandler", soccersm);;
  const ballsToken = await ethers.getContractAt("BallsToken", balls);
  const challenge = ghanaElectionEvent(
    await ballsToken.getAddress(),
    1,
    1000,
    ethers.ZeroAddress
  );
  const preparedChallenge = prepareCreateChallenge(challenge.challenge);
  console.log(preparedChallenge);

  console.log(await poolHandlerProxy.getAddress());
  

//   await ballsToken.approve(await poolHandlerProxy.getAddress(), BigInt(2000 * 1e18));

  await poolHandlerProxy.createChallenge(...(preparedChallenge as any));
  console.log(`Deployments Successfull ...`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
