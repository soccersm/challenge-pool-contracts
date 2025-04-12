
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";
import { ethers, ignition } from "hardhat";
import { expect } from "chai";
import { toUtf8Bytes } from "ethers";

describe("ChallengePoolManager", async function () {
  async function deployPoolManager() {
    const { poolViewProxy, poolManagerProxy, paymaster } =
      await ignition.deploy(IgniteTestModule);
    const [owner, user] = await ethers.getSigners();
    const CHALLENGE_POOL_MANAGER = ethers.keccak256(toUtf8Bytes("CHALLENGE_POOL_MANAGER"));

    return {
      poolViewProxy,
      poolManagerProxy,
      paymaster,
      owner,
      user,
      CHALLENGE_POOL_MANAGER,
    };
  }

  it("Should Deploy Pool Manager", async function () {
    const { poolManagerProxy } = await loadFixture(deployPoolManager);

    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");
  });

  it("Should setFeeAddress", async function () {
    const { poolManagerProxy, owner, user } =
      await loadFixture(deployPoolManager);
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
    const {
      poolManagerProxy,
      user,
      CHALLENGE_POOL_MANAGER,
    } = await loadFixture(deployPoolManager);
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
    const {
      poolManagerProxy,
      owner,
      CHALLENGE_POOL_MANAGER
    } = await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const oldMinMaturityPeriod = await poolManagerProxy.minMaturityPeriod();
    const newMinMaturityPeriod = 2 * 60 * 60; //2hours
    await expect(poolManagerProxy.setMinMaturityPeriod(newMinMaturityPeriod)).to.emit(poolManagerProxy, "SetMinMaturityPeriod").withArgs(owner.address, oldMinMaturityPeriod, newMinMaturityPeriod);

    expect(await poolManagerProxy.minMaturityPeriod()).to.be.equal(newMinMaturityPeriod);
  });

  it("Should reverts for setMinMaturityPeriod", async function () {
    const {
      poolManagerProxy,
      owner,
      user,
      CHALLENGE_POOL_MANAGER
    } = await loadFixture(deployPoolManager);
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
    const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
      await loadFixture(deployPoolManager);
    expect(
      await ethers.provider.getCode(await poolManagerProxy.getAddress())
    ).to.not.equal("0x");

    const newPoolFee = 1000;
    const oldPoolFee = await poolManagerProxy.createPoolFee();
    
    await expect(poolManagerProxy.setCreatePoolFee(newPoolFee)).to.emit(poolManagerProxy, "SetCreatePoolFee").withArgs(owner.address, oldPoolFee, newPoolFee);
    expect(await poolManagerProxy.createPoolFee()).to.be.equal(newPoolFee);
  });

  it("Should reverts for setCreatePoolFee", async function () {
    const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
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
     const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
       await loadFixture(deployPoolManager);
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
     const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
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
      const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
        await loadFixture(deployPoolManager);
      expect(
        await ethers.provider.getCode(await poolManagerProxy.getAddress())
      ).to.not.equal("0x");

      const newEarlyWithdrawFee = 200;
      const oldEarlyWithdrawFee = await poolManagerProxy.earlyWithdrawFee();

      await expect(poolManagerProxy.setEarlyWithdrawFee(newEarlyWithdrawFee))
        .to.emit(poolManagerProxy, "SetEarlyWithdrawFee")
        .withArgs(owner.address, oldEarlyWithdrawFee, newEarlyWithdrawFee);
      expect(await poolManagerProxy.earlyWithdrawFee()).to.be.equal(newEarlyWithdrawFee);
    });

    it("Should reverts for setEarlyWithdrawFee", async function () {
      const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
        await loadFixture(deployPoolManager);
      expect(
        await ethers.provider.getCode(await poolManagerProxy.getAddress())
      ).to.not.equal("0x");

      const newEarlyWithdrawFee = 200;

      //revert for onlyPoolManager
      await expect(
        (poolManagerProxy.connect(user) as any).setEarlyWithdrawFee(newEarlyWithdrawFee)
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
       const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
         await loadFixture(deployPoolManager);
       expect(
         await ethers.provider.getCode(await poolManagerProxy.getAddress())
       ).to.not.equal("0x");

       const newMaxOptionsPerPool = 150;
       const oldMaxOptionsPerPool = await poolManagerProxy.maxOptionsPerPool();

       await expect(poolManagerProxy.setMaxOptionsPerPool(newMaxOptionsPerPool))
         .to.emit(poolManagerProxy, "SetMaxOptionsPerPool")
         .withArgs(owner.address, oldMaxOptionsPerPool, newMaxOptionsPerPool);
       expect(await poolManagerProxy.maxOptionsPerPool()).to.be.equal(newMaxOptionsPerPool);
     });

     it("Should reverts for setMaxOptionsPerPool", async function () {
       const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
         await loadFixture(deployPoolManager);
       expect(
         await ethers.provider.getCode(await poolManagerProxy.getAddress())
       ).to.not.equal("0x");

       const newMaxOptionsPerPool = 150;

       //revert for onlyPoolManager
       await expect(
         (poolManagerProxy.connect(user) as any).setMaxOptionsPerPool(newMaxOptionsPerPool)
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
       const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
         await loadFixture(deployPoolManager);
       expect(
         await ethers.provider.getCode(await poolManagerProxy.getAddress())
       ).to.not.equal("0x");

       const newMaxEventsPerPool = 150;
       const oldMaxEventsPerPool = await poolManagerProxy.maxEventsPerPool();

       await expect(poolManagerProxy.setMaxEventsPerPool(newMaxEventsPerPool))
         .to.emit(poolManagerProxy, "SetMaxEventsPerPool")
         .withArgs(owner.address, oldMaxEventsPerPool, newMaxEventsPerPool);
       expect(await poolManagerProxy.maxEventsPerPool()).to.be.equal(newMaxEventsPerPool);
     });

     it("Should reverts for setMaxEventsPerPool", async function () {
       const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
         await loadFixture(deployPoolManager);
       expect(
         await ethers.provider.getCode(await poolManagerProxy.getAddress())
       ).to.not.equal("0x");

       const newMaxEventsPerPool = 150;

       //revert for onlyPoolManager
       await expect(
         (poolManagerProxy.connect(user) as any).setMaxEventsPerPool(newMaxEventsPerPool)
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
        const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newMinStakeAmount = BigInt(2e18);
        const oldMinStakeAmount = await poolManagerProxy.minStakeAmount();

        await expect(poolManagerProxy.setMinStakeAmount(newMinStakeAmount))
          .to.emit(poolManagerProxy, "SetMinStakeAmount")
          .withArgs(owner.address, oldMinStakeAmount, newMinStakeAmount);
        expect(await poolManagerProxy.minStakeAmount()).to.be.equal(newMinStakeAmount);
      });

      it("Should reverts for setMinStakeAmount", async function () {
        const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newMinStakeAmount = BigInt(2e18);

        //revert for onlyPoolManager
        await expect(
          (poolManagerProxy.connect(user) as any).setMinStakeAmount(newMinStakeAmount)
        ).to.be.revertedWith(
          `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
        );

        //revert for nonZero
        const zeroMinStakeAmount = BigInt(0);
        await expect(
          poolManagerProxy.setMinStakeAmount(zeroMinStakeAmount)
        ).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber");
      });

      it("Should addStakeToken", async function(){
        const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newStakeToken = ethers.Wallet.createRandom().address;

        await expect(poolManagerProxy.addStakeToken(newStakeToken)).to.emit(poolManagerProxy, "StakeTokenAdded").withArgs(owner.address, newStakeToken, true);

        const [addedStakeToken, fees, active] = await poolManagerProxy.stakeToken(newStakeToken);
        expect(addedStakeToken).to.be.equal(newStakeToken);
        expect(fees).to.be.equal(0n);
        expect(active).to.be.equal(true);  
      })

      it("Should reverts for addStakeToken", async function(){
        const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
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
        await expect(poolManagerProxy.addStakeToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(poolManagerProxy, "ZeroAddress");

        //revert for active stake
        await poolManagerProxy.addStakeToken(newStakeToken);
        await expect(
          poolManagerProxy.addStakeToken(newStakeToken)
        ).to.be.revertedWith("stake token is active");

        const [addedStakeToken, fees, active] = await poolManagerProxy.stakeToken(newStakeToken);
        expect(addedStakeToken).to.be.equal(newStakeToken);
        expect(fees).to.be.equal(0n);
        expect(active).to.be.equal(true);  
      });

      it("Should removeStakeToken", async function(){
        const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        //add stake token
        const newStakeToken = ethers.Wallet.createRandom().address;
        await expect(poolManagerProxy.addStakeToken(newStakeToken)).to.emit(poolManagerProxy, "StakeTokenAdded").withArgs(owner.address, newStakeToken, true);
        
        //remove stake token
        await expect(poolManagerProxy.removeStakeToken(newStakeToken)).to.emit(poolManagerProxy, "StakeTokenRemoved").withArgs(owner.address, newStakeToken, false);

        const [removedToken, fees, active] = await poolManagerProxy.stakeToken(newStakeToken);

        expect(removedToken).to.be.equal(newStakeToken);
        expect(fees).to.be.equal(0n);
        expect(active).to.be.equal(false);
      })

      it("Should reverts for removeStakeToken", async function(){
        const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
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
        await expect(poolManagerProxy.removeStakeToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(poolManagerProxy, "ZeroAddress");

        //revert for not active stake
        const randomToken = ethers.Wallet.createRandom().address
        await expect(poolManagerProxy.removeStakeToken(randomToken)).to.be.revertedWith("stake token is not active");
      });

      it("Should setDisputePeriod", async function() {
         const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newDisputePeriod = 2 * 60 * 60; //2hours
        const oldDisputePeriod = await poolManagerProxy.disputePeriod();
        await expect(poolManagerProxy.setDisputePeriod(newDisputePeriod)).to.emit(poolManagerProxy, "SetDisputePeriod").withArgs(owner.address, oldDisputePeriod, newDisputePeriod);

        expect(newDisputePeriod).to.be.equal(await poolManagerProxy.disputePeriod());
      })

      it("Should reverts for setDisputePeriod", async function() {
         const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newDisputePeriod = 2 * 60 * 60; //2hours
        //revert for onlyPoolManager
        await expect(
          (poolManagerProxy.connect(user) as any).setDisputePeriod(
            newDisputePeriod
          )
        ).to.be.revertedWith(
          `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
        );

        //revert for nonZero
        await expect(poolManagerProxy.setDisputePeriod(0n)).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber")
      });

      it("Should setDisputeStake", async function() {
         const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newDisputeStake = BigInt(6e18);
        const oldDisputeStake = await poolManagerProxy.disputeStake();
        await expect(poolManagerProxy.setDisputeStake(newDisputeStake)).to.emit(poolManagerProxy, "SetDisputeStake").withArgs(owner.address, oldDisputeStake, newDisputeStake);

        expect(newDisputeStake).to.be.equal(await poolManagerProxy.disputeStake());
      })

      it("Should reverts for setDisputeStake", async function() {
         const { poolManagerProxy, owner, user, CHALLENGE_POOL_MANAGER } =
          await loadFixture(deployPoolManager);
        expect(
          await ethers.provider.getCode(await poolManagerProxy.getAddress())
        ).to.not.equal("0x");

        const newDisputeStake = BigInt(6e18);
        //revert for onlyPoolManager
        await expect(
          (poolManagerProxy.connect(user) as any).setDisputeStake(
            newDisputeStake
          )
        ).to.be.revertedWith(
          `AccessControl: account ${user.address.toLowerCase()} is missing role ${CHALLENGE_POOL_MANAGER}`
        );

        //revert for nonZero
        await expect(poolManagerProxy.setDisputeStake(0n)).to.be.revertedWithCustomError(poolManagerProxy, "ZeroNumber")
      });

});
