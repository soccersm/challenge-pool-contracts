// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { functionSelectors, FacetCutAction } from "../../lib";
import { ethers } from "hardhat";

const ChallengePoolHandler_CommunityModule = buildModule(
  "ChallengePoolHandler_CommunityModule",
  (m) => {
    const soccersm = "0x56d3719CcB48124d7CeE71F70B3e0bAa860E7FB6";
    const cutProxy = m.contractAt("DiamondCutFacet", soccersm);

    const commS = functionSelectors("Community");
    const comm = m.contract("Community");
    const commC = [comm, FacetCutAction.Add, commS];

    const commvS = functionSelectors("CommunityView");
    const commV = m.contract("CommunityView");
    const commvC = [commV, FacetCutAction.Add, commvS];

    m.call(
      cutProxy,
      "diamondCut",
      [[commC, commvC], ethers.ZeroAddress, ethers.ZeroHash],
      { id: "ChallengePoolDiamondCut" }
    );

    const poolHandlerProxy = m.contractAt("ChallengePoolHandler", soccersm, {
      id: "SoccersmChallengePoolHandler",
    });

    return {
      poolHandlerProxy,
    };
  }
);

export default ChallengePoolHandler_CommunityModule;
