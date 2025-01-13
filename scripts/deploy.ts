import { ethers, ignition } from "hardhat";
import SoccersmModule from "../ignition/modules/Soccersm";
import ChallengePoolModule from "../ignition/modules/ChallengePool";
import DataProvidersModule from "../ignition/modules/DataProviders";
import PoolResolversModule from "../ignition/modules/PoolResolvers";
import AirdropPaymasterModule from "../ignition/modules/AirdropPaymaster";
import CreateTopicsModule from "../ignition/modules/CreateTopics";

async function main() {
    await ignition.deploy(SoccersmModule);
    await ignition.deploy(ChallengePoolModule);
    await ignition.deploy(DataProvidersModule);
    await ignition.deploy(PoolResolversModule);
    await ignition.deploy(AirdropPaymasterModule);
    await ignition.deploy(CreateTopicsModule);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
