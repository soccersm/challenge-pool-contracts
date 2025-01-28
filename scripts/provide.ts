import { ethers } from "hardhat";

async function main() {
  const registry = await ethers.getContractAt(
    "TopicRegistry",
    process.env.SOCCERSM_CONTRACT!
  );

  const tx = await registry.provideData(
    "FootBallCorrectScore",
    "0x00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000073133323738373800000000000000000000000000000000000000000000000000"
  );
  console.log(tx);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
