import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";

describe("Deploy Diamond", async function () {
  async function deployDiamond() {
    const { soccersm, cutProxy, acProxy, psProxy} = await ignition.deploy(IgniteTestModule);
    const [owner, user] = await ethers.getSigners();
    return {
        soccersm, 
        cutProxy,
        acProxy,
        psProxy,
        owner, 
        user
    };
  }

  it("should deploy Diamond", async function () {
    const { soccersm, cutProxy, acProxy, psProxy } = await loadFixture(deployDiamond);

    //check Diamond proxy
    expect(await ethers.provider.getCode(await soccersm.getAddress())).to.not.equal("0x");
  });
});
