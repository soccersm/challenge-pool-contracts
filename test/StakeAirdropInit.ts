import { expect } from "chai";
import { ethers, ignition, userConfig } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";
import { FacetCutAction, functionSelectors } from "../ignition/lib";

describe("StakeAirDropInit", async function () {
  async function deployStakeAirDropInit() {
    const { soccersm, cutProxy, poolViewProxy } = await ignition.deploy(
      IgniteTestModule
    );
    const [owner, user] = await ethers.getSigners();
    //deploy StakeAirDropInit
    const StakeAirDropInit = await ethers.getContractFactory(
      "StakeAirDropInit"
    );
    const stakeAirDropInit = await StakeAirDropInit.deploy();
    const initSelectors = functionSelectors("StakeAirDropInit");
    const cut = [
      {
        facetAddress: await stakeAirDropInit.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: initSelectors,
      },
    ];

    await(cutProxy.connect(owner) as any).diamondCut(
      cut,
      ethers.ZeroAddress,
      "0x"
    );
    return {
      soccersm,
      cutProxy,
      stakeAirDropInit,
      StakeAirDropInit,
      poolViewProxy,
      owner,
      user,
    };
  }

  it("Should Deploy StakeAirDropInit", async function () {
    const { stakeAirDropInit } = await loadFixture(deployStakeAirDropInit);
    expect(await stakeAirDropInit.getAddress()).to.be.properAddress;
  });

  it("Should check init constants", async function () {
    //check diamond
    const { owner, cutProxy, StakeAirDropInit, poolViewProxy } =
      await loadFixture(deployStakeAirDropInit);
    const initStakeDiamond = StakeAirDropInit.attach(
      await cutProxy.getAddress()
    );
    expect(await (initStakeDiamond as any).init(await owner.getAddress())).to
      .not.be.reverted;

    const stakeAirDrop = BigInt(5e18);
    const maxClaim = 2;
    const minPoolMaturity = 7 * 24 * 60 * 60;

    const storedStakeAirdrop = await(poolViewProxy as any).stakeAirDrop();
    expect(stakeAirDrop).to.be.equal(storedStakeAirdrop);

    const storedMaxClaim = await(poolViewProxy as any).maxClaim();
    expect(maxClaim).to.be.equal(storedMaxClaim);

    const storedMinPoolMaturiy = await(poolViewProxy as any).minPoolMaturity();
    expect(minPoolMaturity).to.be.equal(storedMinPoolMaturiy);

    const storedPaymaster = await(poolViewProxy as any).paymaster();
    expect(await owner.getAddress()).to.be.equal(storedPaymaster);
  });
});
