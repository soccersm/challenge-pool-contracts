import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";

describe("PausableFacet", function () {
 async function deployPausableFacet() {
   const {psProxy } =
     await ignition.deploy(IgniteTestModule);
   const [owner, user] = await ethers.getSigners();
   const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
   return {
     psProxy,
     owner,
     user,
     DEFAULT_ADMIN_ROLE
   };
 }
  it("Should be unpaused initially", async function () {
    const { psProxy } = await loadFixture(deployPausableFacet);
    expect(await psProxy.paused()).to.equal(false);
  });

  it("Should allow admin to pause the contract", async function () {
    const { psProxy, owner } = await loadFixture(deployPausableFacet);

    await psProxy.pause();
    expect(await psProxy.paused()).to.equal(true);
  });

  it("Should prevent non-admin from pausing the contract", async function () {
    const { psProxy, user, DEFAULT_ADMIN_ROLE } = await loadFixture(deployPausableFacet);

    await expect((psProxy.connect(user) as any).pause()).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should allow admin to unpause the contract", async function () {
    const { psProxy, owner } = await loadFixture(deployPausableFacet);
    await psProxy.pause();
    expect(await psProxy.paused()).to.equal(true);
    
    await psProxy.unpause();
    expect(await psProxy.paused()).to.equal(false);
  });

  it("Should prevent non-admin from unpausing the contract", async function () {
    const { psProxy, owner, user, DEFAULT_ADMIN_ROLE } = await loadFixture(
      deployPausableFacet
    );
    await psProxy.pause();
    expect(await psProxy.paused()).to.equal(true);

    // Attempting to unpause from nonAdmin must revert.
    await expect((psProxy.connect(user) as any).unpause()).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });
});
