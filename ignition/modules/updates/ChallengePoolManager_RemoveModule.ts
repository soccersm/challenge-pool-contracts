// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "../../lib";
import { ethers } from "hardhat";

const ChallengePoolManager_RemoveModule = buildModule(
  "ChallengePoolManager_RemoveModule",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const cpmC = [
      ethers.ZeroAddress,
      FacetCutAction.Remove,
      [
        "0x1fecb71a",
        "0x483e6e3a",
        "0xed927884",
        "0x5bf31d4d",
        "0x300a0a71",
        "0xa80a7882",
        "0x41275358",
        "0x31c22838",
        "0x02024b8c",
        "0x328758ee",
        "0xf1887684",
        "0x166866c7",
        "0xcb84d997",
        "0xa83ba53e",
        "0x61d36d08",
        "0xc22982f4",
        "0x8705fcd4",
        "0x7a18998e",
        "0x6c91423c",
        "0xd94c02a8",
        "0xeb4af045",
        "0xe2d7bee4",
        "0x222c9777",
        "0x1b938b23",
        "0x1ac3ddeb",
      ],
    ];

    const cpvC = [
      ethers.ZeroAddress,
      FacetCutAction.Remove,
      [
        "0x8f1d3776",
        "0xcd819f46",
        "0xb4789d48",
        "0x7ae530d8",
        "0x4d5fb210",
        "0x8e9dafdb",
        "0x821415c5",
        "0x726845bb",
        "0xba038f32",
        "0x0bf6f7d7",
        "0x4c267e27",
        "0x038590e8",
        "0x2fa05b29",
        "0x26a49e37",
        "0xeb1ca693",
        "0x5c4cb599",
        "0x59715121"
      ],
    ];

    m.call(
      cutProxy,
      "diamondCut",
      [[cpvC, cpmC], ethers.ZeroAddress, ethers.ZeroHash],
      { id: "ChallengePoolDiamondCut" }
    );

    return {};
  }
);

export default ChallengePoolManager_RemoveModule;
