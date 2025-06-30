import { toUtf8Bytes } from "ethers";
import { ethers } from "hardhat";
import { expect } from "chai";
import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { getCommunityIdHash } from "./lib";

describe("Community Tests: ", async function () {
  async function deployCommunity() {
    const { poolHandlerProxy, cutProxy, communityProxy, communityViewProxy } =
      await loadFixture(deploySoccersm);
    const [owner, user, user1, user2, user3] = await ethers.getSigners();

    const SOCCERSM_COUNCIL = ethers.keccak256(toUtf8Bytes("SOCCERSM_COUNCIL"));

    return {
      poolHandlerProxy,
      cutProxy,
      communityProxy,
      communityViewProxy,
      owner,
      user,
      user1,
      user2,
      user3,
      SOCCERSM_COUNCIL,
    };
  }

  it("Should Deploy Community", async function () {
    const { communityProxy } = await loadFixture(deployCommunity);
    console.log("community Address: ", await communityProxy.getAddress());
    expect(await communityProxy.getAddress()).to.not.equal(ethers.ZeroAddress);
  });

  it("Should Create Community", async function () {
    const { communityProxy, communityViewProxy, owner } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );
    const community = await communityViewProxy.getCommunity(COMMUNITY_ID_HASH);
    console.log(community);
    const [id, communityOwner, pendingOwner, members, banned] = community;

    expect(id).to.equal(COMMUNITY_ID);
    expect(communityOwner).to.equal(await owner.getAddress());
    expect(members).to.equal(1);
    expect(pendingOwner).to.equal(ethers.ZeroAddress);
    expect(banned).to.be.false;

    const EMPTY_COMMUNITY_ID = "";
    await expect(
      communityProxy.createCommunity(EMPTY_COMMUNITY_ID)
    ).to.be.revertedWithCustomError(communityProxy, "EmptyString");
    await expect(
      communityProxy.createCommunity(COMMUNITY_ID)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityAlreadyExists");
  });

  it("Should Add Community Admin", async function () {
    const { communityProxy, communityViewProxy, owner, user, user1, user2 } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join community
    await(communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH);
    await(communityProxy.connect(user1) as any).joinCommunity(
      COMMUNITY_ID_HASH
    );

    //add user as community admin
    await expect(
      communityProxy.addCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    )
      .to.emit(communityProxy, "AdminAdded")
      .withArgs(
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        await user.getAddress()
      );
    expect(
      await communityViewProxy.getIsAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.true;

    //reverts
    await expect(
      communityProxy.addCommunityAdmin(COMMUNITY_ID_HASH, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(communityProxy, "ZeroAddress");

    const NON_EXISTING_ID = "123456";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(
      communityProxy.addCommunityAdmin(
        NON_EXISTING_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    await communityProxy.banCommunity(COMMUNITY_ID_HASH);
    await expect(
      communityProxy.addCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityIsBanned");

    await communityProxy.unBanCommunity(COMMUNITY_ID_HASH);
    await expect(
      (communityProxy.connect(user1) as any).addCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user1.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwner");

    await expect(
      communityProxy.addCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user2.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityMember");

    //admin cannot add admin
    await expect(
      (communityProxy.connect(user) as any).addCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user2.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwner");
  });

  it("Should Remove Community Admin", async function () {
    const { communityProxy, communityViewProxy, owner, user, user1 } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join community
    await(communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH);

    //add user as community admin
    await expect(
      communityProxy.addCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    )
      .to.emit(communityProxy, "AdminAdded")
      .withArgs(
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        await user.getAddress()
      );
    expect(
      await communityViewProxy.getIsAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.true;

    await expect(
      communityProxy.removeCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    )
      .to.emit(communityProxy, "AdminRemoved")
      .withArgs(
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        await user.getAddress()
      );
    expect(
      await communityViewProxy.getIsAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.false;

    //reverts
    await expect(
      communityProxy.removeCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "MustBeCommunityAdmin");
    await expect(
      communityProxy.removeCommunityAdmin(COMMUNITY_ID_HASH, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(communityProxy, "ZeroAddress");
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(
      communityProxy.removeCommunityAdmin(
        NON_EXISTING_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");
    await expect(
      (communityProxy.connect(user1) as any).removeCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwner");

    await communityProxy.banCommunity(COMMUNITY_ID_HASH);
    await expect(
      communityProxy.removeCommunityAdmin(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityIsBanned");
  });

  it("Should Ban Community", async function () {
    const {
      communityProxy,
      communityViewProxy,
      owner,
      user,
      SOCCERSM_COUNCIL,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    await expect(communityProxy.banCommunity(COMMUNITY_ID_HASH))
      .to.emit(communityProxy, "CommunityBanned")
      .withArgs(COMMUNITY_ID_HASH, await owner.getAddress(), true);
    expect(await communityViewProxy.getBanStatus(COMMUNITY_ID_HASH)).to.be.true;

    await expect(
      communityProxy.banCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityIsBanned");

    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(
      communityProxy.banCommunity(NON_EXISTING_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    await expect(
      (communityProxy.connect(user) as any).banCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${SOCCERSM_COUNCIL}`
    );
  });

  it("Should Unban Community", async function () {
    const {
      communityProxy,
      communityViewProxy,
      owner,
      user,
      SOCCERSM_COUNCIL,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //ban community
    await expect(communityProxy.banCommunity(COMMUNITY_ID_HASH))
      .to.emit(communityProxy, "CommunityBanned")
      .withArgs(COMMUNITY_ID_HASH, await owner.getAddress(), true);

    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(
      communityProxy.unBanCommunity(NON_EXISTING_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    await expect(
      (communityProxy.connect(user) as any).unBanCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${SOCCERSM_COUNCIL}`
    );

    //pass unban
    await expect(communityProxy.unBanCommunity(COMMUNITY_ID_HASH))
      .to.emit(communityProxy, "CommunityUnBanned")
      .withArgs(COMMUNITY_ID_HASH, await owner.getAddress(), false);
    expect(await communityViewProxy.getBanStatus(COMMUNITY_ID_HASH)).to.be
      .false;

    await expect(
      communityProxy.unBanCommunity(COMMUNITY_ID_HASH)
    ).to.revertedWithCustomError(communityProxy, "CommunityNotBanned");
  });

  it("Should Join Community", async function () {
    const { communityProxy, communityViewProxy, owner, user, user1, user2 } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(
      (communityProxy.connect(user) as any).joinCommunity(NON_EXISTING_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 2, anyValue);
    await expect(
      (communityProxy.connect(user1) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(), 3, anyValue);
    await expect(
      (communityProxy.connect(user2) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user2.getAddress(), 4, anyValue);
    await expect(
      (communityProxy.connect(user2) as any).joinCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "AlreadyCommunityMember");

    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(4);

    await communityProxy.banCommunity(COMMUNITY_ID_HASH);
    await expect(
      communityProxy.joinCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityIsBanned");
  });

  it("Should Ban Community Member", async function () {
    const { communityProxy, communityViewProxy, owner, user, user1, user2 } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join
    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 2, anyValue);
    await expect(
      (communityProxy.connect(user1) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(), 3, anyValue);

    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(3);

    //reverts
    await expect(
      communityProxy.banMember(NON_EXISTING_ID_HASH, await user1.getAddress())
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");
    await expect(
      communityProxy.banMember(COMMUNITY_ID_HASH, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(communityProxy, "ZeroAddress");
    await expect(
      (communityProxy.connect(user) as any).banMember(
        COMMUNITY_ID_HASH,
        user1.address
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwnerOrAdmin");
    await expect(
      communityProxy.banMember(COMMUNITY_ID_HASH, user2.address)
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityMember");

    //successful ban
    await expect(
      communityProxy.banMember(COMMUNITY_ID_HASH, await user.getAddress())
    )
      .to.emit(communityProxy, "MemberIsBanned")
      .withArgs(COMMUNITY_ID_HASH, user.address, 2, anyValue);

    await expect(
      communityProxy.banMember(COMMUNITY_ID_HASH, await owner.getAddress())
    ).to.be.revertedWith("Cannot ban or unban owner");

    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWith("Member is banned");

    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(2);
  });

  it("Should Unban Community Member", async function () {
    const { communityProxy, communityViewProxy, owner, user, user1, user2 } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join
    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 2, anyValue);
    await expect(
      (communityProxy.connect(user1) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(), 3, anyValue);

    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(3);

    //reverts
    await expect(
      communityProxy.unBanMember(NON_EXISTING_ID_HASH, await user1.getAddress())
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");
    await expect(
      communityProxy.unBanMember(COMMUNITY_ID_HASH, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(communityProxy, "ZeroAddress");
    await expect(
      (communityProxy.connect(user) as any).unBanMember(
        COMMUNITY_ID_HASH,
        user1.address
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwnerOrAdmin");
    await expect(
      communityProxy.unBanMember(COMMUNITY_ID_HASH, user2.address)
    ).to.be.revertedWith("Member must be banned");
    await expect(
      communityProxy.unBanMember(COMMUNITY_ID_HASH, await owner.getAddress())
    ).to.be.revertedWith("Cannot ban or unban owner");

    await expect(
      communityProxy.banMember(COMMUNITY_ID_HASH, await user.getAddress())
    )
      .to.emit(communityProxy, "MemberIsBanned")
      .withArgs(COMMUNITY_ID_HASH, user.address,2, anyValue);

    //unban
    await expect(
      communityProxy.unBanMember(COMMUNITY_ID_HASH, await user.getAddress())
    )
      .to.emit(communityProxy, "MemberUnbanned")
      .withArgs(COMMUNITY_ID_HASH, user.address, anyValue);
    await expect(
      communityProxy.unBanMember(COMMUNITY_ID_HASH, await user.getAddress())
    ).to.be.revertedWith("Member must be banned");
    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(2);

    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 3, anyValue);

    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(3);
  });

  it("Should Remove Community Member", async function () {
    const {
      communityProxy,
      communityViewProxy,
      owner,
      user,
      user1,
      user2,
      user3,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join
    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 2, anyValue);
    await expect(
      (communityProxy.connect(user1) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(), 3, anyValue);
    await expect(
      (communityProxy.connect(user2) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user2.getAddress(), 4, anyValue);
    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(4);

    //remove
    await expect(
      communityProxy.removeCommunityMember(
        COMMUNITY_ID_HASH,
        ethers.ZeroAddress
      )
    ).to.be.revertedWithCustomError(communityProxy, "ZeroAddress");
    await expect(
      communityProxy.removeCommunityMember(
        COMMUNITY_ID_HASH,
        await user3.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityMember");

    await expect(
      communityProxy.removeCommunityMember(
        NON_EXISTING_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    await expect(
      (communityProxy.connect(user) as any).removeCommunityMember(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwnerOrAdmin");

    await expect(
      communityProxy.removeCommunityMember(
        COMMUNITY_ID_HASH,
        await user1.getAddress()
      )
    )
      .to.emit(communityProxy, "MemberRemoved")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(),3, anyValue);
    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.be.equal(3);

    await communityProxy.addCommunityAdmin(
      COMMUNITY_ID_HASH,
      await user.getAddress()
    );

    await expect(
      (communityProxy.connect(user) as any).removeCommunityMember(
        COMMUNITY_ID_HASH,
        await user2.getAddress()
      )
    )
      .to.emit(communityProxy, "MemberRemoved")
      .withArgs(COMMUNITY_ID_HASH, await user2.getAddress(), 2, anyValue);
    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(2);

    //revert remove admin as member
    await expect(
      communityProxy.removeCommunityMember(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWith("Cannot remove admin");
  });

  it("Should Transfer Community Owner", async function () {
    const {
      communityProxy,
      communityViewProxy,
      owner,
      user,
      user1,
      user2,
      user3,
    } = await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join
    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 2, anyValue);

    await expect(
      (communityProxy.connect(user1) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(), 3, anyValue);

    await expect(
      (communityProxy.connect(user2) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user2.getAddress(), 4, anyValue);

    //transfer owner
    await expect(
      communityProxy.transferCommunityOwner(
        COMMUNITY_ID_HASH,
        ethers.ZeroAddress
      )
    ).to.be.revertedWithCustomError(communityProxy, "ZeroAddress");

    await expect(
      (communityProxy.connect(user) as any).transferCommunityOwner(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwner");

    await communityProxy.addCommunityAdmin(
      COMMUNITY_ID_HASH,
      await user2.getAddress()
    );
    await expect(
      (communityProxy.connect(user2) as any).transferCommunityOwner(
        COMMUNITY_ID_HASH,
        await user2.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwner");

    await expect(
      communityProxy.transferCommunityOwner(
        NON_EXISTING_ID_HASH,
        await user.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    await expect(
      communityProxy.transferCommunityOwner(
        COMMUNITY_ID_HASH,
        await user3.getAddress()
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityMember");

    await expect(
      communityProxy.transferCommunityOwner(
        COMMUNITY_ID_HASH,
        await owner.getAddress()
      )
    ).to.be.revertedWith("Cannot initiate transfer to current owner");

    await expect(
      communityProxy.transferCommunityOwner(
        COMMUNITY_ID_HASH,
        await user.getAddress()
      )
    )
      .to.emit(communityProxy, "CommunityOwnerTransferInitiated")
      .withArgs(
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        await user.getAddress(),
        anyValue
      );

    //revert not accepted ownership yet
    await expect(
      (communityProxy.connect(user) as any).transferCommunityOwner(
        COMMUNITY_ID_HASH,
        user1.address
      )
    ).to.be.revertedWithCustomError(communityProxy, "NotCommunityOwner");

    await expect(
      (communityProxy.connect(user1) as any).acceptCommunityOwnership(
        COMMUNITY_ID_HASH
      )
    ).to.be.revertedWith("Not pending owner");

    //accept ownership
    await expect(
      (communityProxy.connect(user) as any).acceptCommunityOwnership(
        NON_EXISTING_ID_HASH
      )
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");

    const pendingOwner = await communityViewProxy.getPendingOwnerAddress(
      COMMUNITY_ID_HASH
    );
    expect(pendingOwner).to.be.equal(user.address);
    await expect(
      (communityProxy.connect(user) as any).acceptCommunityOwnership(
        COMMUNITY_ID_HASH
      )
    )
      .to.emit(communityProxy, "CommunityOwnerTransferAccepted")
      .withArgs(COMMUNITY_ID_HASH, owner.address, user.address, anyValue);

    const newOwner = await communityViewProxy.getOwnerAddress(
      COMMUNITY_ID_HASH
    );
    const oldOwner = await owner.getAddress();
    expect(newOwner).to.not.be.equal(oldOwner);
  });

  it("Should Leave Community", async function () {
    const { communityProxy, communityViewProxy, owner, user, user1, user2 } =
      await loadFixture(deployCommunity);

    //create new community
    const COMMUNITY_ID = "Community1";
    const COMMUNITY_ID_HASH = getCommunityIdHash(COMMUNITY_ID);
    const NON_EXISTING_ID = "12345";
    const NON_EXISTING_ID_HASH = getCommunityIdHash(NON_EXISTING_ID);
    await expect(communityProxy.createCommunity(COMMUNITY_ID))
      .to.emit(communityProxy, "NewCommunity")
      .withArgs(
        COMMUNITY_ID,
        COMMUNITY_ID_HASH,
        await owner.getAddress(),
        1,
        false,
        anyValue
      );

    //join
    await expect(
      (communityProxy.connect(user) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 2, anyValue);
    await expect(
      (communityProxy.connect(user1) as any).joinCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberJoined")
      .withArgs(COMMUNITY_ID_HASH, await user1.getAddress(), 3, anyValue);

    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(3);

    await communityProxy.addCommunityAdmin(COMMUNITY_ID_HASH, user1.address);
    await expect(
      (communityProxy.connect(user1) as any).leaveCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberLeftCommunity")
      .withArgs(COMMUNITY_ID_HASH, user1.address, 2, anyValue);

    await expect(
      (communityProxy.connect(user) as any).leaveCommunity(NON_EXISTING_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityDoesNotExist");
    expect(
      await communityViewProxy.getIsAdmin(COMMUNITY_ID_HASH, user1.address)
    ).to.be.false;
    expect(
      await communityViewProxy.getIsMember(COMMUNITY_ID_HASH, user1.address)
    ).to.be.false;

    await communityProxy.banCommunity(COMMUNITY_ID_HASH);
    await expect(
      (communityProxy.connect(user) as any).leaveCommunity(COMMUNITY_ID_HASH)
    ).to.be.revertedWithCustomError(communityProxy, "CommunityIsBanned");
    await communityProxy.unBanCommunity(COMMUNITY_ID_HASH);

    await expect(
      communityProxy.leaveCommunity(COMMUNITY_ID_HASH)
    ).to.revertedWith("Owner cannot leave community");
    await expect(
      (communityProxy.connect(user2) as any).leaveCommunity(COMMUNITY_ID_HASH)
    ).to.revertedWith("Must be a member");

    await expect(
      (communityProxy.connect(user) as any).leaveCommunity(COMMUNITY_ID_HASH)
    )
      .to.emit(communityProxy, "MemberLeftCommunity")
      .withArgs(COMMUNITY_ID_HASH, await user.getAddress(), 1, anyValue);
    expect(
      await communityViewProxy.getMembersCount(COMMUNITY_ID_HASH)
    ).to.equal(1);
  });
});
