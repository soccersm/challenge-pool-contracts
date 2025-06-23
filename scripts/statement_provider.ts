import "dotenv/config";
import { ethers } from "hardhat";
import { statements } from "./data/statements";
import { encodeMultiOptionByTopic, TopicId } from "../test/lib";

async function main() {
  const registry = await ethers.getContractAt(
    "TopicRegistry",
    process.env.SOCCERSM_CONTRACT!
  );
  const id = "GermanyParliamentaryElection2025";
  const s = statements.find((s) => s.id == id);
  console.log(s);

  if (!s) {
    console.log(`could not find statement with id ${id} ...`);
    return;
  }
  if (!s.answer) {
    console.log(`${s} does not have an answer ...`);
    return;
  }
  const winningPrediction = encodeMultiOptionByTopic(
    TopicId.Statement,
    s.answer
  );
  const coder = new ethers.AbiCoder();
  const param = coder.encode(
    ["string", "string", "uint256", "bytes"],
    [s.id, s.statement, s.maturity, winningPrediction]
  );
  console.log(param);
  // return;
  const tx = await registry.provideData("Statement", param);
  await tx.wait();
  console.log(`Just provided statement with id ${s.id}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
