import { ignition } from "hardhat";
import SoccersmModule from "../ignition/modules/Soccersm";
import ChallengePoolModule from "../ignition/modules/ChallengePool";
import DataProvidersModule from "../ignition/modules/DataProviders";
import PoolResolversModule from "../ignition/modules/PoolResolvers";
import AirdropPaymasterModule from "../ignition/modules/AirdropPaymaster";
import CreateTopicsModule from "../ignition/modules/CreateTopics";

async function main() {
  await ignition.deploy(SoccersmModule, { displayUi: true });
  await ignition.deploy(ChallengePoolModule, { displayUi: true });
  await ignition.deploy(DataProvidersModule, { displayUi: true });
  await ignition.deploy(PoolResolversModule, { displayUi: true });
  await ignition.deploy(CreateTopicsModule, { displayUi: true });
  console.log(`Deployments Successfull ...`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
