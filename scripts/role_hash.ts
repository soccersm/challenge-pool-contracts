import { keccak256, toUtf8Bytes } from "ethers";
import { ethers } from "hardhat";

console.log("ORACLE_ROLE", keccak256(toUtf8Bytes("ORACLE_ROLE")));
console.log("SOCCERSM_COUNCIL", keccak256(toUtf8Bytes("SOCCERSM_COUNCIL")));
console.log(
  "CHALLENGE_POOL_MANAGER",
  keccak256(toUtf8Bytes("CHALLENGE_POOL_MANAGER"))
);
console.log("TOPIC_REGISTRAR", keccak256(toUtf8Bytes("TOPIC_REGISTRAR")));
console.log(ethers.ZeroAddress);
