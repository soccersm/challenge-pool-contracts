import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("AirdropPaymaster", async function () {
  async function deployAirdropPaymaster() {
    const [owner, soccersm, depositor, user] = await ethers.getSigners();
    const air = await ethers.getContractFactory("AirdropPaymaster");
    const paymaster = await air.deploy(owner.address);
    const BallsToken = await ethers.getContractFactory("BallsToken");
    const ballsToken = await BallsToken.deploy();

    const minStakeAmount = BigInt(1 * 1e18);
    const oneMil = BigInt(minStakeAmount * BigInt(1e6));
    const oneGrand = BigInt(minStakeAmount * BigInt(1e3));

    return {
      owner,
      paymaster,
      soccersm,
      depositor,
      user,
      oneMil,
      oneGrand,
      ballsToken,
    };
  }

  it("Should Deploy AirdropPaymaster and BallsToken", async function () {
    await loadFixture(deployAirdropPaymaster);
  });
  it("Should [payFor]", async function () {
    const { paymaster, owner, user, ballsToken, soccersm, oneGrand, oneMil } =
      await loadFixture(deployAirdropPaymaster);
    await ballsToken.approve(paymaster, oneMil);
    await paymaster
      .connect(owner)
      .depositFor(ballsToken.getAddress(), soccersm.address, oneGrand);

    await expect(
      (paymaster.connect(owner) as any).payFor(
        ballsToken.getAddress(),
        soccersm.address,
        oneGrand
      )
    ).to.not.be.reverted;
    await expect(
      (paymaster.connect(user) as any).payFor(
        ballsToken.getAddress(),
        user.address,
        oneGrand
      )
    ).to.be.revertedWith("Must be soccersm ...");
    await expect(
      (paymaster.connect(owner) as any).payFor(
        ballsToken.getAddress(),
        user.address,
        oneMil
      )
    ).to.be.revertedWith("low balance ...");
  });

  it("should [depositFor]", async function () {
    const { paymaster, owner, user, ballsToken, soccersm, oneGrand, oneMil } =
      await loadFixture(deployAirdropPaymaster);
    await ballsToken.approve(paymaster, oneMil);
    const soccersmBalanceBefore = await paymaster.balance(
      ballsToken.getAddress(),
      soccersm.address
    );
    expect(soccersmBalanceBefore).to.be.equal(0);

    await paymaster
      .connect(owner)
      .depositFor(ballsToken.getAddress(), soccersm.address, oneGrand);

    await expect(
      paymaster
        .connect(user)
        .depositFor(ballsToken.getAddress(), soccersm.address, oneGrand)
    ).to.reverted;

    const soccersmBalanceAfter = await paymaster.balance(
      ballsToken.getAddress(),
      soccersm.address
    );
    expect(soccersmBalanceAfter).to.be.equal(oneGrand);
  });

  it("should [setSoccersm]", async function () {
    const { paymaster, owner, soccersm, user } = await loadFixture(
      deployAirdropPaymaster
    );
    await expect(paymaster.connect(owner).setSoccersm(soccersm.address)).to.not
      .be.reverted;
    expect(await paymaster.soccersm()).to.be.equal(soccersm.address);
    await expect(paymaster.connect(user).setSoccersm(user.address)).to.be
      .reverted;
  });

  it("Should [Drain]", async function () {
    const { paymaster, owner, ballsToken, user } = await loadFixture(
      deployAirdropPaymaster
    );
    await expect(paymaster.connect(owner).drain(ballsToken.getAddress())).to.not
      .be.reverted;
    await expect(paymaster.connect(user).drain(ballsToken.getAddress())).to.be
      .reverted;
    await paymaster.connect(owner).drain(ballsToken.getAddress());
    const contractBalanceAfterDrain = await paymaster.balance(
      ballsToken.getAddress(),
      paymaster.getAddress()
    );
    expect(contractBalanceAfterDrain).to.be.equal(0);
  });

  it("Revert not Implemented", async function () {
    const { paymaster, owner, ballsToken, user } = await loadFixture(
      deployAirdropPaymaster
    );
    //consent
    await expect(
      paymaster.consent(ethers.ZeroAddress, ethers.ZeroAddress, BigInt(100))
    ).to.be.revertedWithCustomError(paymaster, "NotImplemented");

    //deposit
    await expect(
      paymaster.deposit(ethers.ZeroAddress, BigInt(100))
    ).to.be.revertedWithCustomError(paymaster, "NotImplemented");

    //withdraw
    await expect(
      paymaster.withdraw(ethers.ZeroAddress, BigInt(100))
    ).to.be.revertedWithCustomError(paymaster, "NotImplemented");
  });
});
