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

export function functionSigs(contractName: string): Array<string> {
  const abi = artifacts.readArtifactSync(contractName).abi;
  const face = ethers.Interface.from(abi);
  const funcs: string[] = [];
  for (const frag of face.fragments) {
    if (frag.type == "function") {
      funcs.push(frag.format("minimal"));
    }
  }
  return funcs;
}

export function functionSigsSelectors(contractName: string): {
  [key: string]: string;
} {
  const abi = artifacts.readArtifactSync(contractName).abi;
  const face = ethers.Interface.from(abi);
  const funcs: { [key: string]: string } = {};
  for (const frag of face.fragments) {
    if (frag.type == "function") {
      funcs[frag.format("sighash")] = (frag as any).selector;
    }
  }
  return funcs;
}

export function encodeFunctionData(
  contractName: string,
  selector: string,
  params: any[]
) {
  const abi = artifacts.readArtifactSync(contractName).abi;
  const face = ethers.Interface.from(abi);
  return face.encodeFunctionData(selector, params);
}

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

export const INIT_SIG: string = "init()";
export const INIT_ADDRESS_SIG: string = "init(address)";
export const INIT: string = "init";


export function findAddressWithAllSignatures(functionMap: {[key: string]: string}, facetList: any): null | string {
    const targetSignatures = new Set(Object.values(functionMap));
    
    for (const [address, signatures] of facetList) {
        const signatureSet = new Set(signatures);
        let allFound = true;

        for (const sig of targetSignatures) {
            if (!signatureSet.has(sig)) {
                allFound = false;
                break;
            }
        }

        if (allFound) {
            return address;
        }
    }

    return null;
}
