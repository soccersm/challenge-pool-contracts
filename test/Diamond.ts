import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";
import { FacetCutAction, functionSelectors } from "../ignition/lib";

describe("[Diamond]", async function () {
  async function deployDiamond() {
    const { soccersm, cutProxy, acProxy, oProxy, psProxy } =
      await ignition.deploy(IgniteTestModule);
    const [owner, user] = await ethers.getSigners();

    return {
      soccersm,
      cutProxy,
      oProxy,
      acProxy,
      psProxy,
      owner,
      user,
    };
  }

  it("Should Deploy Diamond", async function () {
    const { soccersm } = await loadFixture(deployDiamond);
    //check Diamond proxy
    expect(
      await ethers.provider.getCode(await soccersm.getAddress())
    ).to.not.equal("0x");
  });

  it("Should Check Diamond Roles - AccessControlFacet Constants", async function () {
    const { acProxy } = await loadFixture(deployDiamond);
    const expectedOracleRole = ethers.keccak256(
      ethers.toUtf8Bytes("ORACLE_ROLE")
    );
    const expectedCouncil = ethers.keccak256(
      ethers.toUtf8Bytes("SOCCERSM_COUNCIL")
    );
    const expectedChallengePoolManager = ethers.keccak256(
      ethers.toUtf8Bytes("CHALLENGE_POOL_MANAGER")
    );
    const expectedTopicRegistrar = ethers.keccak256(
      ethers.toUtf8Bytes("TOPIC_REGISTRAR")
    );

    expect(await acProxy.ORACLE_ROLE()).to.equal(expectedOracleRole);
    expect(await acProxy.SOCCERSM_COUNCIL()).to.equal(expectedCouncil);
    expect(await acProxy.CHALLENGE_POOL_MANAGER()).to.equal(
      expectedChallengePoolManager
    );
    expect(await acProxy.TOPIC_REGISTRAR()).to.equal(expectedTopicRegistrar);
  });

  it.only("Should Allow Adding New Facet", async function () {
    const { cutProxy, owner, user } = await loadFixture(deployDiamond);

    // Deploy facet
    const MockFacet = await ethers.getContractFactory("MockFacet");
    const mockFacet = await MockFacet.deploy();

    // Prepare cut
    const selectors = functionSelectors("MockFacet");
    console.log("function selector: ", functionSelectors("MockFacet"));

    const cut = [
      {
        facetAddress: await mockFacet.getAddress(),
        action: FacetCutAction.Add,
        functionSelectors: selectors,
      },
    ];

    //passing add facet
    await (cutProxy.connect(owner) as any).diamondCut(
      cut,
      ethers.ZeroAddress,
      "0x"
    );

    //revert notOwner
    await expect(
      (cutProxy.connect(user) as any).diamondCut(cut, ethers.ZeroAddress, "0x")
    ).to.be.revertedWith("LibDiamond: Must be contract owner");

    //revert already added facet
    await expect(
      (cutProxy.connect(owner) as any).diamondCut(cut, ethers.ZeroAddress, "0x")
    ).to.be.revertedWith(
      "LibDiamondCut: Can't add function that already exists"
    );

    // Verify added facet
    const mockOnDiamond: any = MockFacet.attach(await cutProxy.getAddress());
    await mockOnDiamond.setNumber(100);
    const getMockNumber = await mockOnDiamond.getNumber();
    expect(getMockNumber).to.equal(100);
  });

  it("Ownership: Should Check Owner, Transfer Ownership", async function () {
    const { cutProxy, oProxy, owner, user } = await loadFixture(deployDiamond);
    const actualOwner = await oProxy.owner();
    expect(actualOwner).to.equal(await owner.getAddress());

    // Transfer ownership
    await expect(
      (oProxy.connect(owner) as any).transferOwnership(await user.getAddress())
    )
      .to.emit(oProxy, "OwnershipTransferred")
      .withArgs(await owner.getAddress(), await user.getAddress());

    //revert user is owner
    await expect(
      (oProxy.connect(owner) as any).transferOwnership(await owner.getAddress())
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });
});
