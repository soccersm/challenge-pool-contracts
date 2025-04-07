import "dotenv/config";
import { ethers } from "hardhat";

async function main() {
  const handler = await ethers.getContractAt(
    "ChallengePoolHandler",
    process.env.SOCCERSM_CONTRACT!
  );
  const ids = [16,13,17];
  for (const id of ids) {
    const tx = await handler.close(id);
    await tx.wait(5);
    console.log(`successfully closed pool with id ${id} with tx ${tx} ...`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
