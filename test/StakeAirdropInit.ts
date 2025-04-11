import { StakeAirDropInit } from "./../typechain-types/contracts/inits/StakeAirDropInit";
import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";
import { FacetCutAction, functionSelectors } from "../ignition/lib";

describe("StakeAirDropInit", async function () {
  async function deployStakeAirDropInit() {
    const { soccersm, cutProxy } = await ignition.deploy(IgniteTestModule);
    const [owner, user] = await ethers.getSigners();
    //deploy StakeAirDropInit and StakeAirDropInitView
    const StakeAirDropInit = await ethers.getContractFactory(
      "StakeAirDropInit"
    );
    const stakeAirDropInit = await StakeAirDropInit.deploy();
    const StakeAirDropInitView = await ethers.getContractFactory(
      "StakeAirDropInitView"
    );
    const stakeAirDropInitView = await StakeAirDropInitView.deploy();

    const initSelectors = functionSelectors("StakeAirDropInit");
    const initViewSelectors = functionSelectors("StakeAirDropInitView");

    const cut = [
      {
        facetAddress: await stakeAirDropInit.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: initSelectors,
      },
      {
        facetAddress: await stakeAirDropInitView.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: initViewSelectors,
      },
    ];

    await (cutProxy.connect(owner) as any).diamondCut(
      cut,
      ethers.ZeroAddress,
      "0x"
    );
    return {
      soccersm,
      cutProxy,
      stakeAirDropInit,
      StakeAirDropInit,
      StakeAirDropInitView,
      stakeAirDropInitView,
      owner,
      user,
    };
  }

  it("Should Deploy StakeAirDropInit", async function () {
    const { owner, cutProxy, stakeAirDropInit, stakeAirDropInitView } =
      await loadFixture(deployStakeAirDropInit);
    expect(await stakeAirDropInit.getAddress()).to.be.properAddress;
    expect(await stakeAirDropInitView.getAddress()).to.be.properAddress;
  });

  it("Should check init constants", async function () {
    //check diamond
    const { owner, cutProxy, StakeAirDropInit, StakeAirDropInitView } =
      await loadFixture(deployStakeAirDropInit);
    const initStakeDiamond = StakeAirDropInit.attach(
      await cutProxy.getAddress()
    );
    const initStakeDiamondView = StakeAirDropInitView.attach(
      await cutProxy.getAddress()
    );
    console.log(
      "initStakeDiamondView: ",
      await (initStakeDiamondView as any).getAirDropStore()
    );
  });
});
