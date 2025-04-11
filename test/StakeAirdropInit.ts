import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("StakeAirDropInit", async function () {
  async function deployStakeAirDropInit() {
    const [owner, user] = await ethers.getSigners();
    const stake = await ethers.getContractFactory("StakeAirDropInit");
    const stakePaymaster = await stake.deploy();

    const minStakeAmount = BigInt(1 * 1e18);
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    return {
      owner,
      stakePaymaster,
      user,
      oneGrand,
    };
  }

  it("Should Deploy StakeAirDropInit", async function () {
    const { stakePaymaster } = await loadFixture(deployStakeAirDropInit);
    expect(
      await ethers.provider.getCode(await stakePaymaster.getAddress())
    ).to.not.equal("0x");
  });


});