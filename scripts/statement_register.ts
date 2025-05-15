import 'dotenv/config';
import { ethers } from "hardhat";
import { statements } from "./data/zuafrique";

async function main() {
  const registry = await ethers.getContractAt(
    "TopicRegistry",
    process.env.SOCCERSM_CONTRACT!
  );

  const coder = new ethers.AbiCoder();
  for (const s of statements) {
    const param = coder.encode(
      ["string", "string", "uint256", "bytes[]"],
      [
        s.id,
        s.statement,
        s.maturity,
        s.options.map((o) => coder.encode(["string"], [o])),
      ]
    );
    console.log(param);
    
    const tx = await registry.registerEvent("Statement", param);
    await tx.wait();
    console.log(`Just registered statement with id ${s.id}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
