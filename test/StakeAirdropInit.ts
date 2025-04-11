import { StakeAirDropInit } from "./../typechain-types/contracts/inits/StakeAirDropInit";
import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";

describe("StakeAirDropInit", async function () {
  async function deployStakeAirDropInit() {
    const StakeAirDropInitView = await ethers.getContractFactory(
      "StakeAirDropInitView"
    );
    const stakeAirDropInitView = await StakeAirDropInitView.deploy();

    const [paymaster] = await ethers.getSigners();

    const minStakeAmount = BigInt(1 * 1e18);
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    return {
      paymaster,
      stakeAirDropInitView,
      oneGrand,
    };
  }

  it("Should Deploy StakeAirDropInit", async function () {
    const { stakeAirDropInitView } = await loadFixture(deployStakeAirDropInit);
    expect(
      await ethers.provider.getCode(await stakeAirDropInitView.getAddress())
    ).to.not.equal("0x");
  });

  it("Should check init constants", async function () {
    const { stakeAirDropInitView, oneGrand } = await loadFixture(
      deployStakeAirDropInit
    );
    console.log(
      "getAirDropStore: ",
      await stakeAirDropInitView.getAirDropStore()
    );
  });
});
