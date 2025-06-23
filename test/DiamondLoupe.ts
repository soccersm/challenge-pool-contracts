import { assert, expect } from "chai";
import { ethers, ignition } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import IgniteTestModule from "../ignition/modules/test/IgniteTest";
import {
  FacetCutAction,
  functionSelectors,
  findAddressWithAllSignatures,
  functionSigsSelectors,
} from "../ignition/lib";

describe("Diamond, DiamondLoupe", async function () {
  async function deployDiamond() {
    const { soccersm, cutProxy, acProxy, oProxy, psProxy } =
      await ignition.deploy(IgniteTestModule);
    const [owner, user] = await ethers.getSigners();
    const diamondLoupeFacet = await ethers.getContractAt(
      "DiamondLoupeFacet",
      await soccersm.getAddress()
    );

    const facetAddresses = await diamondLoupeFacet.facetAddresses();

    return {
      soccersm,
      cutProxy,
      oProxy,
      acProxy,
      psProxy,
      diamondLoupeFacet,
      facetAddresses,
      owner,
      user,
    };
  };

  it("Should return total facets number", async function () {
    const { facetAddresses } = await loadFixture(deployDiamond);
    facetAddresses.forEach((address, index) => {
      console.log(`${index + 1}. ${address}`);
    });
    assert.equal(facetAddresses.length, 12);
  });

  it("Should have right function selectors", async function () {
    const { diamondLoupeFacet, facetAddresses } = await loadFixture(
      deployDiamond
    );
    const facets = await diamondLoupeFacet.facets();

    let selectors = functionSelectors("DiamondCutFacet");
    let result = await diamondLoupeFacet.facetFunctionSelectors(
      facetAddresses[0]
    );
    expect(result).to.deep.equal(selectors);

    //DiamondLoupe
    selectors = functionSelectors("DiamondLoupeFacet");
    let sigSelectors = functionSigsSelectors("DiamondLoupeFacet");
    const diamondLoupeAddress = findAddressWithAllSignatures(
      sigSelectors,
      facets
    );

    if (diamondLoupeAddress) {
      result = await diamondLoupeFacet.facetFunctionSelectors(
        diamondLoupeAddress
      );
    } else {
      throw new Error("address is null");
    }
    expect(result).to.deep.equal(selectors);

    //OwnershipFacet
    selectors = functionSelectors("OwnershipFacet");
    sigSelectors = functionSigsSelectors("OwnershipFacet");
    const ownershipAddress = findAddressWithAllSignatures(sigSelectors, facets);
    if (ownershipAddress) {
      result = await diamondLoupeFacet.facetFunctionSelectors(ownershipAddress);
    } else {
      throw new Error("Address is null");
    }
    expect(result).to.deep.equal(selectors);

    //ChallengePoolHandler
    selectors = functionSelectors("ChallengePoolHandler");
    sigSelectors = functionSigsSelectors("ChallengePoolHandler");
    const poolHanlder = findAddressWithAllSignatures(sigSelectors, facets);
    if (poolHanlder) {
      result = await diamondLoupeFacet.facetFunctionSelectors(poolHanlder);
    } else {
      throw new Error("Address is null");
    }
    expect(result).to.deep.equal(selectors);
  });

  it("selectors should be associated to facets correctly", async function () {
    const { diamondLoupeFacet, facetAddresses } = await loadFixture(
      deployDiamond
    );
    //poolhander - [4] - 0xa6a21a5d
    expect(facetAddresses[4]).to.equal(
      await diamondLoupeFacet.facetAddress("0xa6a21a5d")
    );

    //ownership - [10] - 0x8da5cb5b
    expect(facetAddresses[10]).to.equal(
      await diamondLoupeFacet.facetAddress("0x8da5cb5b")
    );

    //DiamondLoupe - [11] - 0xcdffacc6, 0x52ef6b2c
    expect(facetAddresses[11]).to.equal(
      await diamondLoupeFacet.facetAddress("0x52ef6b2c")
    );

    //pausablefacet - [2] - 0x8456cb59
    expect(facetAddresses[2]).to.equal(
      await diamondLoupeFacet.facetAddress("0x8456cb59")
    );
  });

  it("Should replace getNumber() function", async function () {
    const {
      cutProxy,
      soccersm,
      owner,
      user,
    } = await deployDiamond();
    const MockFacet = await ethers.getContractFactory("MockFacet");
    const mockFacet = await MockFacet.deploy();

    const addSelectors = functionSelectors("MockFacet");
    await cutProxy.diamondCut(
      [
        {
          facetAddress: await mockFacet.getAddress(),
          action: FacetCutAction.Add,
          functionSelectors: addSelectors,
        },
      ],
      ethers.ZeroAddress,
      "0x"
    );

    const MockFacetV2 = await ethers.getContractFactory("MockFacetV2");
    const mockFacetV2 = await MockFacetV2.deploy();

    //filter getNumber() - 0xf2c9ecd8
    const replaceSelectors = functionSelectors("MockFacetV2").filter(
      (sig) => sig === "0xf2c9ecd8"
    );

    const cut = [
      {
        facetAddress: await mockFacetV2.getAddress(),
        action: FacetCutAction.Replace,
        functionSelectors: replaceSelectors,
      },
    ];

    // non-owner cannot replace
    await expect(
      (cutProxy.connect(user) as any).diamondCut(cut, ethers.ZeroAddress, "0x")
    ).to.be.revertedWith("LibDiamond: Must be contract owner");

    // owner does the replace
    await cutProxy.diamondCut(cut, ethers.ZeroAddress, "0x");

    // cannot replace it a second time
    await expect(
      (cutProxy.connect(owner) as any).diamondCut(cut, ethers.ZeroAddress, "0x")
    ).to.be.revertedWith(
      "LibDiamondCut: Can't replace function with same function"
    );

    //Verify that the new implementation
    const replacedMockFacet = await ethers.getContractAt(
      "MockFacet",
      await soccersm.getAddress()
    );
    await replacedMockFacet.setNumber(100);
    expect(await replacedMockFacet.getNumber()).to.equal(42);

    //MockFacetV2
    await expect(mockFacetV2.setNumber(10)).to.not.be.reverted; 
    const response = await mockFacetV2.supportsInterface("0x01ffc9a7");
    expect(response).to.equal("0x01ffc9a7");

  });

  it("Should return true for supportsInterface", async function () {
    const {diamondLoupeFacet} = await deployDiamond();
     const IERC165_ID = "0x01ffc9a7";
     expect(await diamondLoupeFacet.supportsInterface(IERC165_ID)).to.equal(true);

     const UNKNOWN_ID = "0xf2c9ecd8";
     expect(await diamondLoupeFacet.supportsInterface(UNKNOWN_ID)).to.equal(false);
  })

});
