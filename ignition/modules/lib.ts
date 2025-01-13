import { ethers, artifacts } from "hardhat";

export function functionSelectors(contractName: string): Array<string> {
  const abi = artifacts.readArtifactSync(contractName).abi;
  const face = ethers.Interface.from(abi);
  const funcs: string[] = [];
  for (const frag of face.fragments) {
    if (frag.type == "function") {
      funcs.push((frag as any).selector);
    }
  }
  return funcs;
}

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };
