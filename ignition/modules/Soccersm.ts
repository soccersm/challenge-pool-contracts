// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { vars } from "hardhat/config";

const SoccersmModule = buildModule("SoccersmModule", (m) => {
  const CONTRACT_OWNER = vars.get("CONTRACT_OWNER");
  const DIAMOND_CUT_FACET = vars.get("DIAMOND_CUT_FACET");
  const soccersm = m.contract("Soccersm", [CONTRACT_OWNER, DIAMOND_CUT_FACET]);

  return { soccersm };
});

export default SoccersmModule;
