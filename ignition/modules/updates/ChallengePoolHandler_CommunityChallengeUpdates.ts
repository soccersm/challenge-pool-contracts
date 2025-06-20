// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "../../lib";
import { ethers } from "hardhat";

const ChallengePoolHandler_CommunityChallengeUpdates = buildModule(
  "ChallengePoolHandler_CommunityChallengeUpdates",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const rcpmC = [ethers.ZeroAddress, FacetCutAction.Remove, ["0x9258d505"]];

    const rcpvC = [ethers.ZeroAddress, FacetCutAction.Remove, ["0x3699fbdf"]];

    const removeCreateChallenge = [
      ethers.ZeroAddress,
      FacetCutAction.Remove,
      ["0x6eb9aec2"],
    ];

    const cph = m.contract("ChallengePoolHandler");
    const cphC = [cph, FacetCutAction.Add, ["0xf1a5d5c5"]];

    m.call(
      cutProxy,
      "diamondCut",
      [
        [rcpmC, rcpvC, removeCreateChallenge, cphC],
        ethers.ZeroAddress,
        ethers.ZeroHash,
      ],
      { id: "ChallengePoolDiamondCut", after: [] }
    );

    return {};
  }
);

export default ChallengePoolHandler_CommunityChallengeUpdates;
