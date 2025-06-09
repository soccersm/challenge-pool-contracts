import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers, ignition } from "hardhat";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";

export async function deploySoccersm() {
  const [
    owner,
    oracle,
    council,
    poolManager,
    topicRegistrar,
    baller,
    striker,
    keeper,
  ] = await ethers.getSigners();

  const {
    soccersm,
    cutProxy,
    acProxy,
    registryProxy,
    poolHandlerProxy,
    poolDisputeProxy,
    poolManagerProxy,
    poolViewProxy,
    psProxy,
    paymaster,
  } = await ignition.deploy(IgniteTestModule, { displayUi: false });
  const BallsToken = await ethers.getContractFactory("BallsToken");
  const ballsToken = await BallsToken.deploy();
  await poolManagerProxy.addStakeToken(await ballsToken.getAddress());
  const minStakeAmount = BigInt(1 * 1e18);
  const oneMil = BigInt(minStakeAmount * BigInt(1e6));
  const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

  await ballsToken.transfer(baller, oneMil);
  await ballsToken.transfer(striker, oneMil);
  await ballsToken.approve(paymaster, oneMil);
  await poolManagerProxy.setPaymaster(paymaster);
  await poolManagerProxy.setMinPoolMaturity(BigInt(60 * 60 * 16));
  await poolManagerProxy.setMinPoolMaturity(BigInt(60 * 60 * 16));
  await paymaster.depositFor(ballsToken, keeper, oneMil);
  return {
    soccersm,
    ballsToken,
    cutProxy,
    acProxy,
    registryProxy,
    poolHandlerProxy,
    poolDisputeProxy,
    poolManagerProxy,
    psProxy,
    paymaster,
    owner,
    oracle,
    council,
    poolManager,
    topicRegistrar,
    baller,
    striker,
    keeper,
    oneMil,
    oneGrand,
    poolViewProxy,
  };
}

describe("Soccersm", function () {
  it("Should Deploy", async function () {
    await loadFixture(deploySoccersm);
  });
});
