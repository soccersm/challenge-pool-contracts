import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { mock } from "../typechain-types/contracts/utils";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("ERC2771Context", async function () {
  async function deployERC2771Context() {
    const MockERC2771Context = await ethers.getContractFactory(
      "MockERC2771Context"
    );
    const mockERCContext = await MockERC2771Context.deploy();

    const [owner, user, forwarder] = await ethers.getSigners();

    await (mockERCContext as any).setTrustedForwarder(
      await forwarder.getAddress()
    );
    return {
      owner,
      user,
      forwarder,
      mockERCContext,
    };
  }

  it("isTrustedForwarder() returns true only for the registered forwarder", async function () {
    const { mockERCContext, user, owner, forwarder } = await loadFixture(
      deployERC2771Context
    );
    expect(
      await (mockERCContext as any).isTrustedForwarder(
        await forwarder.getAddress()
      )
    ).to.be.true;
    expect(
      await (mockERCContext as any).isTrustedForwarder(await user.getAddress())
    ).to.be.false;
  });

  it("getMsgSender() when called normally returns msg.sender", async () => {
    const { mockERCContext, user, owner, forwarder } = await loadFixture(
      deployERC2771Context
    );
    expect(await mockERCContext.connect(user).getMsgSender()).to.equal(
      await user.getAddress()
    );
  });

  it("should return non-forwarder sender", async function () {
    const { mockERCContext, user, owner, forwarder } = await loadFixture(
      deployERC2771Context
    );
    const result = await mockERCContext.connect(user).getMsgSender();
    expect(result).to.equal(await user.getAddress());
  });

  it("should return non-forwarder data", async function () {
    const { mockERCContext, user, owner, forwarder } = await loadFixture(
      deployERC2771Context
    );
    const result = await mockERCContext.connect(user).getMsgData();
    //getMsgData() sig - 0xc8e7ca2e
    expect(result).to.equal("0xc8e7ca2e");
  });
});
