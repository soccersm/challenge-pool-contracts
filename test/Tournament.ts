import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { ethers } from "hardhat";
import { getStringIdHash } from "./lib";

describe("Soccersm Tournaments", async function () {
  interface TournamentParams {
    name: string;
    startTime: number;
    endTime: number;
    registrationFee: number;
    maxTickets: number;
    stakeToken: string;
  }

  function getTournamentParams(
    tournamentParams: TournamentParams
  ): [string, number, number, number, number, string] {
    return [
      tournamentParams.name,
      tournamentParams.startTime,
      tournamentParams.endTime,
      tournamentParams.registrationFee,
      tournamentParams.maxTickets,
      tournamentParams.stakeToken,
    ];
  }

  it("Should create new tournament", async function () {
    const { ballsToken, tournamentProxy } = await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      registrationFee: 10,
      maxTickets: 100,
      stakeToken: await ballsToken.getAddress(),
    };

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");
  });

  it("Should create new tournament - Reverts", async function () {
    const { ballsToken, tournamentProxy } = await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      registrationFee: 10,
      maxTickets: 100,
      stakeToken: await ballsToken.getAddress(),
    };
    const emptyNameObj = {
      ...tournamentParams,
      name: "",
    };
    //revert empty string
    await expect(
      tournamentProxy.createTournament(...getTournamentParams(emptyNameObj))
    ).to.be.revertedWithCustomError(tournamentProxy, "EmptyString");

    //revert validPeriod
    const invalidPeriodObj = {
      ...tournamentParams,
      startTime: Math.floor(Date.now() / 1000) - 60,
    };
    await expect(
      tournamentProxy.createTournament(...getTournamentParams(invalidPeriodObj))
    ).to.be.revertedWithCustomError(tournamentProxy, "InvalidPeriod");

    //revert positiveAddress
    const invalidStakeToken = {
      ...tournamentParams,
      stakeToken: ethers.ZeroAddress,
    };
    await expect(
      tournamentProxy.createTournament(
        ...getTournamentParams(invalidStakeToken)
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "ZeroAddress");

    //revert nonzero maxTickets
    const zeroTickets = {
      ...tournamentParams,
      maxTickets: 0,
    };
    await expect(
      tournamentProxy.createTournament(...getTournamentParams(zeroTickets))
    ).to.be.revertedWithCustomError(tournamentProxy, "ZeroNumber");

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");

    //revert already exists
    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentAlreadyExists");
  });

  it("Should Add tournament admin", async function () {
    const { ballsToken, tournamentProxy, owner, baller, striker } =
      await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      registrationFee: 10,
      maxTickets: 100,
      stakeToken: await ballsToken.getAddress(),
    };

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");

    const tournamentIdHash = getStringIdHash(tournamentParams.name);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    ).to.emit(tournamentProxy, "TournamentAdminAdded");
  });

  it("Should Add tournament admin - reverts", async function () {
    const { ballsToken, tournamentProxy, owner, baller, striker } =
      await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      registrationFee: 10,
      maxTickets: 100,
      stakeToken: await ballsToken.getAddress(),
    };

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");

    const tournamentIdHash = getStringIdHash(tournamentParams.name);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    )
      .to.emit(tournamentProxy, "TournamentAdminAdded")
      .withArgs(tournamentIdHash, baller.address, true);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "AlreadyTournamentAdmin");

    //revert zeroAddress member
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(tournamentProxy, "ZeroAddress");

    //revert tournament does not exist
    const nonExistingId = getStringIdHash("newtournament");
    await expect(
      tournamentProxy.addTournamentAdmin(nonExistingId, baller.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentDoesNotExist");

    //revert only owner
    await expect(
      (tournamentProxy.connect(baller) as any).addTournamentAdmin(
        tournamentIdHash,
        baller.address
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "NotTournamentOwner");

    //ban tournament
    await tournamentProxy.banTournament(tournamentIdHash);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentIsBanned");
  });

  it("Should Remove tournament admin", async function () {
    const { ballsToken, tournamentProxy, owner, baller, striker } =
      await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      registrationFee: 10,
      maxTickets: 100,
      stakeToken: await ballsToken.getAddress(),
    };

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");

    const tournamentIdHash = getStringIdHash(tournamentParams.name);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    ).to.emit(tournamentProxy, "TournamentAdminAdded");

    //remove admin
    await expect(
      tournamentProxy.removeTournamentAdmin(tournamentIdHash, baller.address)
    ).to.emit(tournamentProxy, "TournamentAdminRemoved");
  });

  it("Should update tournament", async function () {
    const { ballsToken, tournamentProxy, owner, baller, striker } =
      await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      registrationFee: 10,
      maxTickets: 100,
      stakeToken: await ballsToken.getAddress(),
    };

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");

    const tournamentIdHash = getStringIdHash(tournamentParams.name);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    ).to.emit(tournamentProxy, "TournamentAdminAdded");

    await expect(
      tournamentProxy.updateTournament(
        tournamentIdHash,
        Math.floor(Date.now() / 1000) + 1200,
        Math.floor(Date.now() / 1000) + 3600,
        100,
        1000
      )
    ).to.emit(tournamentProxy, "TournamentUpdated");
  });
});
