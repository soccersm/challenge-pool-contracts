import { expect } from "chai";
import hre from "hardhat";

describe("AirdropPaymaster Tests", function () {
  let soccersmAddress: string;
  let airdropPaymasterContract: any;
  let owner: string;
  let user: any;
  // init
  before(async function() {
     // Mock address for soccersm
    soccersmAddress = hre.ethers.Wallet.createRandom().address;
    // Deploy the contract with the soccersm address
    const AirdropPaymasterContract = await hre.ethers.getContractFactory("AirdropPaymaster");
    airdropPaymasterContract = await AirdropPaymasterContract.deploy(soccersmAddress); 
    owner = await airdropPaymasterContract.owner();
  }); 

  // Test case to deploy the contract and set the soccersm address  
  it("should deploy and set the soccersm address correctly", async function () {
    // Verify the soccersm address is set correctly
    const storedSoccersmAddress = await airdropPaymasterContract.soccersm();
    console.log("storedSoccersmAddress", storedSoccersmAddress);
    console.log("soccersmAddress", soccersmAddress);
    expect(storedSoccersmAddress).to.equal(soccersmAddress);

    // Verify the owner is the deployer
    console.log("ownerAddress: ", owner);
    expect(owner).to.equal((await hre.ethers.provider.getSigner()).address);
    const signerAddress = (await hre.ethers.provider.getSigner()).address;
    console.log("Signer Address: ", signerAddress); 
  });

it("Test for setSoccersm function", async function () {
    const newSoccersmAddress = hre.ethers.Wallet.createRandom().address;
    const [owner, user] = await hre.ethers.getSigners(); //get signers
    //Owner should be able to set the soccersm address
    await expect(airdropPaymasterContract.connect(owner).setSoccersm(newSoccersmAddress)).to.not.be.reverted;
    await expect(airdropPaymasterContract.connect(user).setSoccersm(newSoccersmAddress)).to.be.reverted;

    // Verify the new address is set
    const storedSoccersm = await airdropPaymasterContract.soccersm();
    expect(storedSoccersm).to.equal(newSoccersmAddress);

});

});
