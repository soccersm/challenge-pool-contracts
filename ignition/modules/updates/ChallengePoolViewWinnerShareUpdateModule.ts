// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  functionSigsSelectors,
  functionSelectors,
  FacetCutAction,
  INIT_SIG,
} from "../../lib";
import Soccersm from "../Soccersm";
import { ethers } from "hardhat";

const ChallengePoolViewWinnerShareUpdateModule = buildModule(
  "ChallengePoolViewWinnerShareUpdateModule",
  (m) => {
    const soccersm = m.useModule(Soccersm);

    const cphS = functionSelectors("ChallengePoolView");
    const cph = m.contract("ChallengePoolView");
    const cphC = [cph, FacetCutAction.Replace, cphS];

    m.call(
      soccersm.cutProxy,
      "diamondCut",
      [[cphC], ethers.ZeroAddress, ethers.ZeroHash],
      { id: "ChallengePoolDiamondCut" }
    );

    const poolViewProxy = m.contractAt(
      "ChallengePoolView",
      soccersm.soccersm,
      {
        id: "SoccersmChallengePoolView",
      }
    );

    return {
      poolViewProxy,
    };
  }
);

export default ChallengePoolViewWinnerShareUpdateModule;
