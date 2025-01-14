import { expect } from "chai";
import hre from "hardhat";

describe("AirdropPaymaster Tests", function () {
  let soccersmAddress: string;
  let airdropPaymasterContract: any;
  let airdropPaymasterContractAddress: string;
  let owner: any;
  let soccersmSigner: any;
  let ballsToken: any;

  const TOKEN_AMOUNT = hre.ethers.parseEther("1000");

  beforeEach(async function () {
    const [deployer, soccersm, depositor] = await hre.ethers.getSigners();
    soccersmAddress = soccersm.address;

    owner = deployer;
    soccersmSigner = soccersm;

    // Deploy BallsToken
    const BallsToken = await hre.ethers.getContractFactory("BallsToken");
    ballsToken = await BallsToken.deploy();
    console.log(
      "BallsToken balance after deployment:",
      (await ballsToken.balanceOf(owner.address)).toString()
    );

    // Deploy AirdropPaymaster
    const AirdropPaymaster = await hre.ethers.getContractFactory(
      "AirdropPaymaster"
    );
    airdropPaymasterContract = await AirdropPaymaster.deploy(soccersmAddress);
    airdropPaymasterContractAddress = airdropPaymasterContract.target;

    // Transfer tokens to AirdropPaymaster
    await ballsToken.transfer(airdropPaymasterContractAddress, TOKEN_AMOUNT);
    console.log(
      "Balance of paymaster after funding:",
      (await ballsToken.balanceOf(airdropPaymasterContractAddress)).toString()
    );

    // Mint tokens for depositor
    const mintAmount = hre.ethers.parseEther("100");
    await ballsToken.transfer(depositor.address, mintAmount);
    console.log(
      "Depositor balance after minting:",
      (await ballsToken.balanceOf(depositor.address)).toString()
    );
  });

   it("should deploy and set the soccersm address correctly", async function () {
    const storedSoccersmAddress = await airdropPaymasterContract.soccersm();
    expect(storedSoccersmAddress).to.equal(soccersmAddress);

    const contractOwner = await airdropPaymasterContract.owner();
    expect(contractOwner).to.equal(owner.address);
    console.log("Constructor Test Passed!✅");
  });

  it("should Test for setSoccersm function", async function () {
    const [_, newSoccersm] = await hre.ethers.getSigners(); // Get a new soccersm signer
    const newSoccersmAddress = newSoccersm.address;

    // Owner should be able to set the soccersm address
    await expect(
      airdropPaymasterContract.connect(owner).setSoccersm(newSoccersmAddress)
    ).to.not.be.reverted;

    // Other users should not be able to set the soccersm address
    await expect(
      airdropPaymasterContract.connect(newSoccersm).setSoccersm(newSoccersmAddress)
    ).to.be.reverted;

    // Verify the new soccersm address
    const storedSoccersm = await airdropPaymasterContract.soccersm();
    expect(storedSoccersm).to.equal(newSoccersmAddress);

    // Update the soccersmSigner for future tests
    soccersmSigner = newSoccersm;
    console.log("setSoccersm Test Passed!✅");
  });

  it("should test the depositFor function", async function () {
    const [deployer, soccersm, depositor] = await hre.ethers.getSigners();
    const depositAmount = hre.ethers.parseEther("100");

    //depositor must have balance first(already minted in beforeEach)
    //approve airdropPaymaster to transfer amount tokens
    await ballsToken
      .connect(depositor)
      .approve(airdropPaymasterContractAddress, depositAmount);

    // Call depositFor (for the depositor, on his own behalf)
    await expect(
      airdropPaymasterContract
        .connect(depositor)
        .depositFor(ballsToken.target, depositor.address, depositAmount)
    ).to.not.be.reverted;
    console.log("Depositor Balance after deposit to Contract: ", (await ballsToken.balanceOf(depositor.address))); //should be zero

    // Test depositor balance is now zero
    expect((await ballsToken.balanceOf(depositor.address))).to.be.equal(0);

    //Test contract balance should be airdrop Token amount + deposit amount
    expect((await ballsToken.balanceOf(airdropPaymasterContractAddress))).to.be.equal(TOKEN_AMOUNT + depositAmount);
    console.log("depositFor Test Passed!✅");
    
  });

  //Test for payFor
  it("should test the payFor function", async function () {
  const [deployer, soccersm, depositor] = await hre.ethers.getSigners();
  const depositAmount = hre.ethers.parseEther("100");
  const payAmount = hre.ethers.parseEther("50");

  // Set soccersm as the allowed caller for payFor
  await airdropPaymasterContract.connect(deployer).setSoccersm(soccersm.address);

  // Approve airdropPaymaster to transfer tokens and deposit them
  await ballsToken
    .connect(depositor)
    .approve(airdropPaymasterContractAddress, depositAmount);

  await expect(
    airdropPaymasterContract
      .connect(depositor)
      .depositFor(ballsToken.target, depositor.address, depositAmount)
  ).to.not.be.reverted;

  // Check depositor's internal balance in the contract
  const internalBalanceBefore = await airdropPaymasterContract.balance(ballsToken.target, depositor.address);
  console.log("Internal Balance of depositor before: ", internalBalanceBefore)
  expect(internalBalanceBefore).to.be.equal(depositAmount);

  // Check soccersm's initial token balance
  const soccersmBalanceBefore = await ballsToken.balanceOf(soccersm.address);
  console.log("Soccersm Address initial token balance: ", soccersmBalanceBefore) 

  // soccersm calls payFor to deduct from depositor's balance(50), pay to himself
  await expect(
    airdropPaymasterContract
      .connect(soccersm)
      .payFor(ballsToken.target, depositor.address, payAmount)
  ).to.not.be.reverted;

  // any other person to revert payFor. eg depositor wants to pay himself
  await expect(
    airdropPaymasterContract
    .connect(depositor)
    .payFor(ballsToken.target, depositor.address, payAmount)
  ).to.be.revertedWith("Must be soccersm ...")

  // Check depositor's internal balance after payFor
  const internalBalanceAfter = await airdropPaymasterContract.balance(ballsToken.target, depositor.address); //should be subtracted, left with 50
  expect(internalBalanceAfter).to.be.equal(depositAmount - payAmount);

  // Check soccersm's token balance after payFor
  const soccersmBalanceAfter = await ballsToken.balanceOf(soccersm.address);
  console.log("Soccersm Balance After: ", soccersmBalanceAfter); 
  expect(soccersmBalanceAfter).to.be.equal(payAmount); //should be 50

  // Check contract's token balance after payFor
  const contractBalance = await ballsToken.balanceOf(airdropPaymasterContractAddress);
  expect(contractBalance).to.be.equal(TOKEN_AMOUNT + (depositAmount - payAmount)); // Total contract balance

  console.log("PayFor Test Passed!✅");
});

 

});
