import { expect } from "chai";
import { ethers } from "hardhat";

describe("AirdropPaymaster", function () {
  let AirdropPaymasterFactory: any;
  let soccersmContract: any;
  let deployer: any;
  let soccersmAddress: string;

  before(async function () {
    // Get signers
    [deployer] = await ethers.getSigners();

    // Mock address for soccersm
    soccersmAddress = ethers.Wallet.createRandom().address;

    // Get the contract factory
    AirdropPaymasterFactory = await ethers.getContractFactory("AirdropPaymaster");
  });

  it("should deploy and set the soccersm address correctly", async function () {
    // Deploy the contract with the soccersm address
    soccersmContract = await AirdropPaymasterFactory.deploy(soccersmAddress);
    await soccersmContract.deployed();

    // Verify the soccersm address is set correctly
    const storedSoccersm = await soccersmContract.soccersm();
    expect(storedSoccersm).to.equal(soccersmAddress);

    // Verify the owner is the deployer
    const owner = await soccersmContract.owner();
    expect(owner).to.equal(deployer.address);
  });
});
