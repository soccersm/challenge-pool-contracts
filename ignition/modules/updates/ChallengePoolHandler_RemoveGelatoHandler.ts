// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  FacetCutAction,
} from "../../lib";
import { ethers } from "hardhat";

const ChallengePoolHandler_RemoveGelatoHandler = buildModule(
  "ChallengePoolHandler_RemoveGelatoHandler",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const removeGelato = [
      ethers.ZeroAddress,
      FacetCutAction.Remove,
      [
        "0x063975b3",
        "0xb13fc1cd",
        "0x32ef36d2",
        "0x572b6c05",
        "0x52952457",
        "0xf549454b",
      ],
    ];

    m.call(
      cutProxy,
      "diamondCut",
      [[removeGelato], ethers.ZeroAddress, ethers.ZeroHash],
      { id: "ChallengePoolDiamondCut", after: [] }
    );

    return {};
  }
);

export default ChallengePoolHandler_RemoveGelatoHandler;
