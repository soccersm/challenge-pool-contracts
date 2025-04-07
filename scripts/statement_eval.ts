import "dotenv/config";
import { ethers } from "hardhat";

async function main() {
  const handler = await ethers.getContractAt(
    "ChallengePoolHandler",
    process.env.SOCCERSM_CONTRACT!
  );
  const ids = [13,17];
  for (const id of ids) {
    const tx = await handler.evaluate(id);
    await tx.wait(5);
    console.log(`successfully evaluated pool with id ${id} with tx ${tx.hash} ...`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
