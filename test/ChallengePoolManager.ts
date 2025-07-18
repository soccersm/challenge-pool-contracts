import { prepareCreateChallenge } from "./lib";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { toUtf8Bytes } from "ethers";
import { btcEvent } from "./mock";
import { deploySoccersm } from "./SoccersmDeployFixture";

describe("ChallengePoolManager", async function () {
  async function deployPoolManager() {
    const {
      poolViewProxy,
      poolHandlerProxy,
      poolManagerProxy,
      paymaster,
      ballsToken,
      oneGrand,
      baller,
    } = await loadFixture(deploySoccersm);
    const [owner, user] = await ethers.getSigners();
    const CHALLENGE_POOL_MANAGER = ethers.keccak256(
      toUtf8Bytes("CHALLENGE_POOL_MANAGER")
    );

    return {
      poolViewProxy,
      poolManagerProxy,
      poolHandlerProxy,
      paymaster,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
      ballsToken,
      oneGrand,
      baller,
    };
  }

  it("Should Deploy Pool Manager", async function () {
    const { poolManagerProxy } = await loadFixture(deployPoolManager);

    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");
  });

  it("Should setFeeAddress", async function () {
    const { poolManagerProxy, owner, user } = await loadFixture(
      deployPoolManager
    );
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newFeeAddress = await user.getAddress();
    await expect(poolManagerProxy.setFeeAddress(newFeeAddress))
      .to.emit(poolManagerProxy, "SetFeeAddress")
      .withArgs(
        await owner.getAddress(),
        await owner.getAddress(),
        newFeeAddress
      );
  });

  it("Should Reverts for setFeeAddress", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    //revert for onlyPoolManager
    const feeAddress = await user.getAddress();
    await expect(
      (poolManagerProxy.connect(user) as any).setFeeAddress(feeAddress)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for positiveAddress
    const zeroFeeAddress = ethers.ZeroAddress;
    await expect(
      poolManagerProxy.setFeeAddress(zeroFeeAddress)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroAddress");
  });

  it("Should setMinMaturityPeriod", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const oldMinMaturityPeriod = await poolManagerProxy.minMaturityPeriod();
    const newMinMaturityPeriod = 2 * 60 * 60; //2hours
    await expect(poolManagerProxy.setMinMaturityPeriod(newMinMaturityPeriod))
      .to.emit(poolManagerProxy, "SetMinMaturityPeriod")
      .withArgs(owner.address, oldMinMaturityPeriod, newMinMaturityPeriod);

    expect(await poolManagerProxy.minMaturityPeriod()).to.be.equal(
      newMinMaturityPeriod
    );
  });

  it("Should reverts for setMinMaturityPeriod", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    //revert onlyPoolManager
    const newMinMaturityPeriod = 2 * 60 * 60;
    await expect(
      (poolManagerProxy.connect(user) as any).setMinMaturityPeriod(
        newMinMaturityPeriod
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert nonZero
    const zeroMaturityPeriod = 0;
    await expect(
      poolManagerProxy.setMinMaturityPeriod(zeroMaturityPeriod)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setCreatePoolFee", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newPoolFee = 1000;
    const oldPoolFee = await poolManagerProxy.createPoolFee();

    await expect(poolManagerProxy.setCreatePoolFee(newPoolFee))
      .to.emit(poolManagerProxy, "SetCreatePoolFee")
      .withArgs(owner.address, oldPoolFee, newPoolFee);
    expect(await poolManagerProxy.createPoolFee()).to.be.equal(newPoolFee);
  });

  it("Should reverts for setCreatePoolFee", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newPoolFee = 1000;

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setCreatePoolFee(newPoolFee)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroPoolFee = 0;
    await expect(
      poolManagerProxy.setCreatePoolFee(zeroPoolFee)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setStakeFee", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newStakeFee = 500;
    const olStakeFee = await poolManagerProxy.stakeFee();

    await expect(poolManagerProxy.setStakeFee(newStakeFee))
      .to.emit(poolManagerProxy, "SetStakeFee")
      .withArgs(owner.address, olStakeFee, newStakeFee);
    expect(await poolManagerProxy.stakeFee()).to.be.equal(newStakeFee);
  });

  it("Should reverts for setStakeFee", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newPoolFee = 1000;

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setStakeFee(newPoolFee)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroStakeFee = 0;
    await expect(
      poolManagerProxy.setStakeFee(zeroStakeFee)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setEarlyWithdrawFee", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newEarlyWithdrawFee = 200;
    const oldEarlyWithdrawFee = await poolManagerProxy.earlyWithdrawFee();

    await expect(poolManagerProxy.setEarlyWithdrawFee(newEarlyWithdrawFee))
      .to.emit(poolManagerProxy, "SetEarlyWithdrawFee")
      .withArgs(owner.address, oldEarlyWithdrawFee, newEarlyWithdrawFee);
    expect(await poolManagerProxy.earlyWithdrawFee()).to.be.equal(
      newEarlyWithdrawFee
    );
  });

  it("Should reverts for setEarlyWithdrawFee", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newEarlyWithdrawFee = 200;

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setEarlyWithdrawFee(
        newEarlyWithdrawFee
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroWtihdrawFees = 0;
    await expect(
      poolManagerProxy.setEarlyWithdrawFee(zeroWtihdrawFees)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setMaxOptionsPerPool", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newMaxOptionsPerPool = 150;
    const oldMaxOptionsPerPool = await poolManagerProxy.maxOptionsPerPool();

    await expect(poolManagerProxy.setMaxOptionsPerPool(newMaxOptionsPerPool))
      .to.emit(poolManagerProxy, "SetMaxOptionsPerPool")
      .withArgs(owner.address, oldMaxOptionsPerPool, newMaxOptionsPerPool);
    expect(await poolManagerProxy.maxOptionsPerPool()).to.be.equal(
      newMaxOptionsPerPool
    );
  });

  it("Should reverts for setMaxOptionsPerPool", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newMaxOptionsPerPool = 150;

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setMaxOptionsPerPool(
        newMaxOptionsPerPool
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroMaxOptionsPerPool = 0;
    await expect(
      poolManagerProxy.setMaxOptionsPerPool(zeroMaxOptionsPerPool)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setMaxEventsPerPool", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newMaxEventsPerPool = 150;
    const oldMaxEventsPerPool = await poolManagerProxy.maxEventsPerPool();

    await expect(poolManagerProxy.setMaxEventsPerPool(newMaxEventsPerPool))
      .to.emit(poolManagerProxy, "SetMaxEventsPerPool")
      .withArgs(owner.address, oldMaxEventsPerPool, newMaxEventsPerPool);
    expect(await poolManagerProxy.maxEventsPerPool()).to.be.equal(
      newMaxEventsPerPool
    );
  });

  it("Should reverts for setMaxEventsPerPool", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newMaxEventsPerPool = 150;

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setMaxEventsPerPool(
        newMaxEventsPerPool
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroMaxEventsPerPool = 0;
    await expect(
      poolManagerProxy.setMaxEventsPerPool(zeroMaxEventsPerPool)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setMinStakeAmount", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newMinStakeAmount = BigInt(2e18);
    const oldMinStakeAmount = await poolManagerProxy.minStakeAmount();

    await expect(poolManagerProxy.setMinStakeAmount(newMinStakeAmount))
      .to.emit(poolManagerProxy, "SetMinStakeAmount")
      .withArgs(owner.address, oldMinStakeAmount, newMinStakeAmount);
    expect(await poolManagerProxy.minStakeAmount()).to.be.equal(
      newMinStakeAmount
    );
  });

  it("Should reverts for setMinStakeAmount", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newMinStakeAmount = BigInt(2e18);

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setMinStakeAmount(
        newMinStakeAmount
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroMinStakeAmount = BigInt(0);
    await expect(
      poolManagerProxy.setMinStakeAmount(zeroMinStakeAmount)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should addStakeToken", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newStakeToken = ethers.Wallet.createRandom().address;

    await expect(poolManagerProxy.addStakeToken(newStakeToken))
      .to.emit(poolManagerProxy, "StakeTokenAdded")
      .withArgs(owner.address, newStakeToken, true);

    const [addedStakeToken, fees, active] = await poolManagerProxy.stakeToken(
      newStakeToken
    );
    expect(addedStakeToken).to.be.equal(newStakeToken);
    expect(fees).to.be.equal(0n);
    expect(active).to.be.equal(true);
  });

  it("Should reverts for addStakeToken", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newStakeToken = ethers.Wallet.createRandom().address;

    //revert or onlyPoolManger
    await expect(
      (poolManagerProxy.connect(user) as any).addStakeToken(newStakeToken)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for positiveAddress
    await expect(
      poolManagerProxy.addStakeToken(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroAddress");

    //revert for active stake
    await poolManagerProxy.addStakeToken(newStakeToken);
    await expect(
      poolManagerProxy.addStakeToken(newStakeToken)
    ).to.be.revertedWith("stake token is active");

    const [addedStakeToken, fees, active] = await poolManagerProxy.stakeToken(
      newStakeToken
    );
    expect(addedStakeToken).to.be.equal(newStakeToken);
    expect(fees).to.be.equal(0n);
    expect(active).to.be.equal(true);
  });

  it("Should removeStakeToken", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    //add stake token
    const newStakeToken = ethers.Wallet.createRandom().address;
    await expect(poolManagerProxy.addStakeToken(newStakeToken))
      .to.emit(poolManagerProxy, "StakeTokenAdded")
      .withArgs(owner.address, newStakeToken, true);

    //remove stake token
    await expect(poolManagerProxy.removeStakeToken(newStakeToken))
      .to.emit(poolManagerProxy, "StakeTokenRemoved")
      .withArgs(owner.address, newStakeToken, false);

    const [removedToken, fees, active] = await poolManagerProxy.stakeToken(
      newStakeToken
    );

    expect(removedToken).to.be.equal(newStakeToken);
    expect(fees).to.be.equal(0n);
    expect(active).to.be.equal(false);
  });

  it("Should reverts for removeStakeToken", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newStakeToken = ethers.Wallet.createRandom().address;

    //revert for onlyPoolManger
    await expect(
      (poolManagerProxy.connect(user) as any).removeStakeToken(newStakeToken)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for positiveAddress
    await expect(
      poolManagerProxy.removeStakeToken(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroAddress");

    //revert for not active stake
    const randomToken = ethers.Wallet.createRandom().address;
    await expect(
      poolManagerProxy.removeStakeToken(randomToken)
    ).to.be.revertedWith("stake token is not active");
  });

  it("Should setDisputePeriod", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newDisputePeriod = 2 * 60 * 60; //2hours
    const oldDisputePeriod = await poolManagerProxy.disputePeriod();
    await expect(poolManagerProxy.setDisputePeriod(newDisputePeriod))
      .to.emit(poolManagerProxy, "SetDisputePeriod")
      .withArgs(owner.address, oldDisputePeriod, newDisputePeriod);

    expect(newDisputePeriod).to.be.equal(
      await poolManagerProxy.disputePeriod()
    );
  });

  it("Should reverts for setDisputePeriod", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newDisputePeriod = 2 * 60 * 60; //2hours
    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setDisputePeriod(newDisputePeriod)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    await expect(
      poolManagerProxy.setDisputePeriod(0n)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setDisputeStake", async function () {
    const { poolManagerProxy, owner } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newDisputeStake = BigInt(6e18);
    const oldDisputeStake = await poolManagerProxy.disputeStake();
    await expect(poolManagerProxy.setDisputeStake(newDisputeStake))
      .to.emit(poolManagerProxy, "SetDisputeStake")
      .withArgs(owner.address, oldDisputeStake, newDisputeStake);

    expect(newDisputeStake).to.be.equal(await poolManagerProxy.disputeStake());
  });

  it("Should reverts for setDisputeStake", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newDisputeStake = BigInt(6e18);
    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setDisputeStake(newDisputeStake)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    await expect(
      poolManagerProxy.setDisputeStake(0n)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should withdrawFee", async function () {
    const {
      poolManagerProxy,
      poolViewProxy,
      poolHandlerProxy,
      owner,
      ballsToken,
      baller,
      oneGrand,
    } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    //create Challenge -> Record accumulated fees -> withdraw
    //CreateChallenge
    const btcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress
    );
    const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await expect(
      (poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;

    //withdrawFee
    const [fee, feePlusPrice] = await poolViewProxy.createFee(oneGrand);

    await expect(poolManagerProxy.withdrawFee(await ballsToken.getAddress()))
      .to.emit(poolManagerProxy, "FeeWithdrawn")
      .withArgs(
        owner.address,
        await ballsToken.getAddress(),
        owner.address,
        fee
      );

    expect(
      await poolViewProxy.getAccumulatedFee(await ballsToken.getAddress())
    ).to.be.equal(0n);
  });

  it("Should reverts for withdrawFee", async function () {
    const {
      poolManagerProxy,
      poolViewProxy,
      poolHandlerProxy,
      owner,
      user,
      ballsToken,
      baller,
      oneGrand,
    } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

    //create Challenge: Record accumulated fees -> withdraw
    //CreateChallenge
    const btcChallenge = btcEvent(
      await ballsToken.getAddress(),
      1,
      oneGrand, 
      ethers.ZeroAddress
    );
    const preparedBTCChallenge = prepareCreateChallenge(btcChallenge.challenge);

    await ballsToken
      .connect(baller)
      .approve(
        await poolHandlerProxy.getAddress(),
        (
          await poolViewProxy.createFee(oneGrand)
        )[1]
      );
    await expect(
      (poolHandlerProxy.connect(baller) as any).createChallenge(
        ...(preparedBTCChallenge as any)
      )
    ).to.not.be.reverted;

    //revert for onlyAdmin
    await expect(
      (poolManagerProxy.connect(user) as any).withdrawFee(
        await ballsToken.getAddress()
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );

    //withdrawFee
    const [fee, feePlusPrice] = await poolViewProxy.createFee(oneGrand);

    await expect(poolManagerProxy.withdrawFee(await ballsToken.getAddress()))
      .to.emit(poolManagerProxy, "FeeWithdrawn")
      .withArgs(
        owner.address,
        await ballsToken.getAddress(),
        owner.address,
        fee
      );

    expect(
      await poolViewProxy.getAccumulatedFee(await ballsToken.getAddress())
    ).to.be.equal(0n);

    //revert for 'no fee to extra'
    await expect(
      poolManagerProxy.withdrawFee(await ballsToken.getAddress())
    ).to.be.revertedWith("no fee to extra");
  });

  it("Should return stakeToken", async function () {
    const { poolManagerProxy } = await loadFixture(deployPoolManager);
    const token = ethers.Wallet.createRandom();
    const [tokenAddress, fees, active] = await poolManagerProxy.stakeToken(
      token
    );

    expect(tokenAddress).to.be.properAddress;
    expect(fees).to.be.a("bigint");
    expect(active).to.be.a("boolean");
  });

  it("Should setStakeAirDrop", async function () {
    const { poolManagerProxy, owner, poolViewProxy } = await loadFixture(
      deployPoolManager
    );
    const oldStakeAirDrop = await poolViewProxy.stakeAirDrop();
    const newStakeAirdrop = BigInt(10e18);
    await expect(poolManagerProxy.setStakeAirDrop(newStakeAirdrop))
      .to.emit(poolManagerProxy, "SetStakeAirDrop")
      .withArgs(owner.address, oldStakeAirDrop, newStakeAirdrop);
    expect(await poolViewProxy.stakeAirDrop()).to.equal(newStakeAirdrop);
  });

  it("Should reverts for setStakeAirDrop", async function () {
    const { poolManagerProxy, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    const newStakeAirdrop = BigInt(10e18);

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setStakeAirDrop(newStakeAirdrop)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroStake = 0n;
    await expect(
      poolManagerProxy.setStakeAirDrop(zeroStake)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setMaxClaim", async function () {
    const { poolManagerProxy, poolViewProxy, owner } = await loadFixture(
      deployPoolManager
    );
    const oldMaxClaim = await poolViewProxy.maxClaim();
    const newMaxClaim = 3 * 24 * 60 * 60;

    await expect(poolManagerProxy.setMaxClaim(newMaxClaim))
      .to.emit(poolManagerProxy, "SetMaxClaim")
      .withArgs(owner.address, oldMaxClaim, newMaxClaim);
    expect(await poolViewProxy.maxClaim()).to.be.equal(newMaxClaim);
  });

  it("Should reverts for setMaxClaim", async function () {
    const {
      poolManagerProxy,
      poolViewProxy,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
    } = await loadFixture(deployPoolManager);
    const newMaxClaim = 3 * 24 * 60 * 60;

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setMaxClaim(newMaxClaim)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for nonZero
    const zeroMaxClaim = 0n;
    await expect(
      poolManagerProxy.setMaxClaim(zeroMaxClaim)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
  });

  it("Should setPaymaster", async function () {
    const { poolManagerProxy, poolViewProxy, owner } = await loadFixture(
      deployPoolManager
    );
    const oldPaymaster = await poolViewProxy.paymaster();
    const newPaymaster = ethers.Wallet.createRandom();

    await expect(poolManagerProxy.setPaymaster(newPaymaster))
      .to.emit(poolManagerProxy, "SetPaymaster")
      .withArgs(owner.address, oldPaymaster, newPaymaster);
    expect(await poolViewProxy.paymaster()).to.be.equal(newPaymaster);
  });

  it("Should reverts for setPaymaster", async function () {
    const {
      poolManagerProxy,
      poolViewProxy,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
    } = await loadFixture(deployPoolManager);
    const newPaymaster = ethers.Wallet.createRandom();

    //revert for onlyPoolManager
    await expect(
      (poolManagerProxy.connect(user) as any).setPaymaster(newPaymaster)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );

    //revert for positiveAddress
    const zeroAddress = ethers.ZeroAddress;
    await expect(
      poolManagerProxy.setPaymaster(zeroAddress)
    ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroAddress");
  });

  it("Should setMinPoolMaturity, Revert for setMinPoolMaturity", async function () {
    const {
      poolManagerProxy,
      poolViewProxy,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
    } = await loadFixture(deployPoolManager);

    const oldMinPoolMaturiy = await poolViewProxy.minPoolMaturity();
    const newMinPoolMaturity = 14 * 24 * 60 * 60;
    await expect(poolManagerProxy.setMinPoolMaturity(newMinPoolMaturity))
      .to.emit(poolManagerProxy, "SetMinPoolMaturity")
      .withArgs(owner.address, oldMinPoolMaturiy, newMinPoolMaturity);

    //revert for onlyPoolManger
    await expect(
      (poolManagerProxy.connect(user) as any).setMinPoolMaturity(
        newMinPoolMaturity
      )
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
    );
    //revert zero setMinPoolMaturity?
  });

});
