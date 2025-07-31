import { toUtf8Bytes } from "ethers";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { expect } from "chai";
import { deploySoccersm } from "./SoccersmDeployFixture";
import { ethers } from "hardhat";
import {
  ChallengeState,
  ChallengeType,
  coder,
  getStringIdHash,
  prepareCreateChallenge,
  TopicId,
  TournamentEvent,
} from "./lib";
import { tournamentChallenge } from "./mock";
import { getChallenge } from "./test_helpers";

describe("Soccersm Tournaments", async function () {
  interface TournamentParams {
    name: string;
    startTime: number;
    endTime: number;
    maxTickets: number;
  }

  function getTournamentParams(
    tournamentParams: TournamentParams
  ): [string, number, number, number] {
    return [
      tournamentParams.name,
      tournamentParams.startTime,
      tournamentParams.endTime,
      tournamentParams.maxTickets,
    ];
  }

  it("Should create new tournament", async function () {
    const { ballsToken, tournamentProxy } = await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
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
      maxTickets: 100,
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
      maxTickets: 100,
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
      maxTickets: 100,
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
      maxTickets: 100,
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

    await expect(
      tournamentProxy.removeTournamentAdmin(tournamentIdHash, baller.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "MustBeTournamentAdmin");
  });

  it("Should update tournament", async function () {
    const { ballsToken, tournamentProxy, owner, baller, striker } =
      await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      maxTickets: 100,
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
        100
      )
    ).to.emit(tournamentProxy, "TournamentUpdated");
  });

  it("Should update tournament - reverts", async function () {
    const { ballsToken, tournamentProxy, owner, baller, striker } =
      await loadFixture(deploySoccersm);

    const tournamentParams = {
      name: "elimination-tournament",
      startTime: Math.floor(Date.now() / 1000) + 3600, // now + 1 hr
      endTime: Math.floor(Date.now() / 1000) + 7200, // now + 2 hr
      maxTickets: 100,
    };

    await expect(
      tournamentProxy.createTournament(...getTournamentParams(tournamentParams))
    ).to.emit(tournamentProxy, "NewTournament");

    const tournamentIdHash = getStringIdHash(tournamentParams.name);
    await expect(
      tournamentProxy.addTournamentAdmin(tournamentIdHash, baller.address)
    ).to.emit(tournamentProxy, "TournamentAdminAdded");

    //revert tournament does not exist
    const nonExistingId = getStringIdHash("newTournament");
    await expect(
      tournamentProxy.updateTournament(
        nonExistingId,
        Math.floor(Date.now() / 1000) + 1200,
        Math.floor(Date.now() / 1000) + 3600,
        100
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentDoesNotExist");

    //revert invalidPeriod
    await expect(
      tournamentProxy.updateTournament(
        tournamentIdHash,
        Math.floor(Date.now() / 1000) - 60,
        Math.floor(Date.now() / 1000) + 3600,
        100
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "InvalidPeriod");
    //revert notowner or admin
    await expect(
      (tournamentProxy.connect(striker) as any).updateTournament(
        tournamentIdHash,
        Math.floor(Date.now() / 1000) + 1200,
        Math.floor(Date.now() / 1000) + 3600,
        100
      )
    ).to.be.revertedWithCustomError(
      tournamentProxy,
      "NotTournamentOwnerOrAdmin"
    );
  });

  it("Should revert updateTournament if already started", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );

    const tournamentIdHash = getStringIdHash("elimination-tournament");

    await time.increaseTo(startTime + 1);

    const newStart = (await time.latest()) + 3600;
    const newEnd = newStart + 3600;

    await expect(
      tournamentProxy.updateTournament(tournamentIdHash, newStart, newEnd, 100)
    ).to.be.revertedWithCustomError(
      tournamentProxy,
      "TournamentAlreadyStarted"
    );
  });

  it("Should joinTournamentAsPlayer", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );

    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //baller joins as player
    await ballsToken
      .connect(baller)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    )
      .to.emit(tournamentProxy, "TournamentPlayerJoined")
      .withArgs(tournamentIdHash, baller.address, true, 1, 1);
  });

  it("Should joinTournamentAsPlayer - reverts", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      1
    );

    const tournamentIdHash = getStringIdHash("elimination-tournament");
    await ballsToken
      .connect(baller)
      .approve(await tournamentProxy.getAddress(), oneGrand);

    //revert nonExisting tournament
    const nonExistingId = getStringIdHash("new-tournament");
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        nonExistingId
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentDoesNotExist");

    //revert not banned
    await expect(tournamentProxy.banTournament(tournamentIdHash)).to.emit(
      tournamentProxy,
      "TournamentBanned"
    );

    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentIsBanned");

    await expect(tournamentProxy.unBanTournament(tournamentIdHash)).to.emit(
      tournamentProxy,
      "TournamentUnbanned"
    );
    //baller joins as player
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    )
      .to.emit(tournamentProxy, "TournamentPlayerJoined")
      .withArgs(tournamentIdHash, baller.address, true, 1, 1);

    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "AlreadyPlayer");

    //revert all tickets sold
    await expect(
      tournamentProxy.joinTournamentAsPlayer(tournamentIdHash)
    ).to.be.revertedWith("All tickets sold");
  });

  it("Should joinTournamentAsSpectator", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //baller joins as spectator
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsSpectator(
        tournamentIdHash
      )
    )
      .to.emit(tournamentProxy, "TournamentSpectatorJoined")
      .withArgs(tournamentIdHash, baller.address, 1);
  });

  it("Should joinTournamentAsSpectator - Reverts", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //baller joins as spectator
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsSpectator(
        tournamentIdHash
      )
    )
      .to.emit(tournamentProxy, "TournamentSpectatorJoined")
      .withArgs(tournamentIdHash, baller.address, 1);

    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsSpectator(
        tournamentIdHash
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "AlreadySpectator");
  });

  it("Should remove player: ", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //players join
    await ballsToken
      .connect(baller)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentPlayerJoined");

    await ballsToken
      .connect(striker)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(striker) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentPlayerJoined");

    await expect(tournamentProxy.removePlayer(tournamentIdHash, baller.address))
      .to.emit(tournamentProxy, "TournamentPlayerRemoved")
      .withArgs(tournamentIdHash, baller.address, 1, 1, false);

    //revert not player
    await expect(
      tournamentProxy.removePlayer(tournamentIdHash, baller.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "NotTournamentPlayer");
  });

  it("Should leave tournament as player or spectator: ", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      2
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //players join
    await ballsToken
      .connect(baller)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentPlayerJoined");

    await expect(
      (tournamentProxy.connect(striker) as any).joinTournamentAsSpectator(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentSpectatorJoined");

    await expect(
      (tournamentProxy.connect(baller) as any).leaveTournament(tournamentIdHash)
    ).to.emit(tournamentProxy, "TournamentPlayerLeft");

    //revert not player or spectator
    await expect(
      (tournamentProxy.connect(baller) as any).leaveTournament(tournamentIdHash)
    ).to.be.revertedWithCustomError(tournamentProxy, "NotPlayerOrSpectator");

    await expect(
      (tournamentProxy.connect(striker) as any).leaveTournament(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentSpectatorLeft");

    await expect(
      (tournamentProxy.connect(striker) as any).leaveTournament(
        tournamentIdHash
      )
    ).to.be.revertedWithCustomError(tournamentProxy, "NotPlayerOrSpectator");
  });

  it("Should add tournament Event", async function () {
    const { ballsToken, tournamentProxy, baller, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    await expect(tournamentProxy.addEvent(tournamentIdHash, startTime, endTime))
      .to.emit(tournamentProxy, "NewTournamentEvent")
      .withArgs(tournamentIdHash, 0, startTime, endTime, ethers.ZeroAddress);
  });

  it("Should ban tournament", async function () {
    const { ballsToken, tournamentProxy, baller, owner, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const SOCCERSM_COUNCIL = ethers.keccak256(toUtf8Bytes("SOCCERSM_COUNCIL"));

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    await expect(tournamentProxy.banTournament(tournamentIdHash))
      .to.emit(tournamentProxy, "TournamentBanned")
      .withArgs(tournamentIdHash, owner.address, true);

    await expect(
      tournamentProxy.banTournament(tournamentIdHash)
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentIsBanned");

    tournamentProxy.unBanTournament(tournamentIdHash);

    await expect(
      (tournamentProxy.connect(baller) as any).banTournament(tournamentIdHash)
    ).to.be.revertedWith(
      `AccessControl: account ${baller.address.toLowerCase()} is missing role ${SOCCERSM_COUNCIL}`
    );
  });

  it("Should unban tournament", async function () {
    const { ballsToken, tournamentProxy, baller, owner, striker, oneGrand } =
      await loadFixture(deploySoccersm);

    const SOCCERSM_COUNCIL = ethers.keccak256(toUtf8Bytes("SOCCERSM_COUNCIL"));

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    await expect(
      tournamentProxy.unBanTournament(tournamentIdHash)
    ).to.be.revertedWith("Tournament not banned");

    await expect(tournamentProxy.banTournament(tournamentIdHash))
      .to.emit(tournamentProxy, "TournamentBanned")
      .withArgs(tournamentIdHash, owner.address, true);

    await expect(
      tournamentProxy.banTournament(tournamentIdHash)
    ).to.be.revertedWithCustomError(tournamentProxy, "TournamentIsBanned");

    await expect(tournamentProxy.unBanTournament(tournamentIdHash)).to.emit(
      tournamentProxy,
      "TournamentUnbanned"
    );

    await expect(
      (tournamentProxy.connect(baller) as any).banTournament(tournamentIdHash)
    ).to.be.revertedWith(
      `AccessControl: account ${baller.address.toLowerCase()} is missing role ${SOCCERSM_COUNCIL}`
    );
  });

  it("Should setEventWinner", async function () {
    const { ballsToken, tournamentProxy, baller, striker, keeper, oneGrand } =
      await loadFixture(deploySoccersm);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 3600;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );

    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //baller joins as player
    await ballsToken
      .connect(baller)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    )
      .to.emit(tournamentProxy, "TournamentPlayerJoined")
      .withArgs(tournamentIdHash, baller.address, true, 1, 1);

    //striker joins
    await ballsToken
      .connect(striker)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(striker) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    )
      .to.emit(tournamentProxy, "TournamentPlayerJoined")
      .withArgs(tournamentIdHash, striker.address, true, 2, 2);

    //createEvent
    await expect(tournamentProxy.addEvent(tournamentIdHash, startTime, endTime))
      .to.emit(tournamentProxy, "NewTournamentEvent")
      .withArgs(tournamentIdHash, 0, startTime, endTime, ethers.ZeroAddress);

    //set event winner
    await expect(
      tournamentProxy.setEventWinner(tournamentIdHash, 0, baller.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "EventStillOngoing");

    await time.increaseTo(endTime + 1);
    await expect(
      tournamentProxy.setEventWinner(tournamentIdHash, 0, keeper.address)
    ).to.be.revertedWithCustomError(tournamentProxy, "NotTournamentPlayer");

    await expect(
      (tournamentProxy.connect(keeper) as any).setEventWinner(
        tournamentIdHash,
        0,
        keeper.address
      )
    ).to.be.revertedWithCustomError(
      tournamentProxy,
      "NotTournamentOwnerOrAdmin"
    );

    await expect(
      tournamentProxy.setEventWinner(tournamentIdHash,0, baller.address)
    )
      .to.emit(tournamentProxy, "EventWinnerSet")
      .withArgs(tournamentIdHash,0, baller.address);
  });

  it("Should create tournament and stake and withdraw tournament challenge", async function () {
    const {
      tournamentProxy,
      baller,
      striker,
      ballsToken,
      keeper,
      owner,
      oneGrand,
      poolHandlerProxy,
      poolViewProxy,
      oneMil,
    } = await loadFixture(deploySoccersm);
    //create tournament
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600;
    const endTime = startTime + 7200;

    await tournamentProxy.createTournament(
      "elimination-tournament",
      startTime,
      endTime,
      100
    );
    const tournamentIdHash = getStringIdHash("elimination-tournament");

    //baller and striker join
    await ballsToken
      .connect(baller)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(baller) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentPlayerJoined");

    await ballsToken
      .connect(striker)
      .approve(await tournamentProxy.getAddress(), oneGrand);
    await expect(
      (tournamentProxy.connect(striker) as any).joinTournamentAsPlayer(
        tournamentIdHash
      )
    ).to.emit(tournamentProxy, "TournamentPlayerJoined");
    //create event
    await expect(tournamentProxy.addEvent(tournamentIdHash, startTime, endTime))
      .to.emit(tournamentProxy, "NewTournamentEvent")
      .withArgs(tournamentIdHash, 0, startTime, endTime, ethers.ZeroAddress);

    //create challenges for the events
    const tournament: TournamentEvent = {
      maturity: now + 7200,
      topicId: TopicId.Tournament,
      eventName: "MK I Champions",
      eventDescription: "Head to Head, who wins MK I?",
      eventId: 0,
    };
    const ballerAddress = baller.address;
    const strikerAddress = striker.address;

    const opts = [ballerAddress, strikerAddress];

    const tournamentChallengeEvent = tournamentChallenge(
      await ballsToken.getAddress(),
      1,
      oneGrand,
      ethers.ZeroAddress,
      tournamentIdHash,
      ChallengeType.tournament,
      tournament,
      opts
    );
    console.log("pool options: ", tournamentChallengeEvent.options);
    const preparedTournamentChallenge = prepareCreateChallenge(
      tournamentChallengeEvent.challenge
    );
    const items = preparedTournamentChallenge[0];
    items.forEach((e) =>
      console.log(
        "eventId, eventName, eventDescription",
        coder.decode(["uint256", "string", "string"], e.params)
      )
    );

    await ballsToken.approve(
      await poolHandlerProxy.getAddress(),
      (
        await poolViewProxy.createFee(oneGrand)
      )[1]
    );
    await expect(
      poolHandlerProxy.createChallenge(...preparedTournamentChallenge)
    ).to.emit(poolHandlerProxy, "NewCommunityChallenge");

    //owner stake
    await ballsToken.approve(await poolHandlerProxy.getAddress(), oneMil);
    const prediction = coder.encode(["address"], [baller.address]);
    await expect(
      poolHandlerProxy.stake(0, prediction, 1, ethers.ZeroAddress)
    ).to.emit(poolHandlerProxy, "Stake");

    //striker stake
    await ballsToken
      .connect(striker)
      .approve(await poolHandlerProxy.getAddress(), oneMil);
    const loosingPrediction = coder.encode(["address"], [striker.address]);
    console.log("loosing prediction: ", loosingPrediction);

    await expect(
      (poolHandlerProxy.connect(striker) as any).stake(
        0,
        loosingPrediction,
        1,
        ethers.ZeroAddress
      )
    ).to.emit(poolHandlerProxy, "Stake");

    await time.increaseTo(tournamentChallengeEvent.maturity + 3600);

    //revert non-admin evaluate
    await expect(
      (tournamentProxy.connect(striker) as any).evaluateTournamentChallenge(
        0,
        prediction
      )
    ).to.be.revertedWithCustomError(
      tournamentProxy,
      "NotTournamentOwnerOrAdmin"
    );

    //evaluate tournament challenge
    await expect(tournamentProxy.evaluateTournamentChallenge(0, prediction))
      .to.emit(tournamentProxy, "EvaluateChallenge")
      .withArgs(0, owner.address, ChallengeState.evaluated, prediction);

    await time.increase(60 * 60);
    await poolHandlerProxy.close(0);

    const challengeAfter = await getChallenge(poolViewProxy, 0);
    expect(challengeAfter.outcome).to.equal(prediction);
    console.log(
      "challenge after outcome: ",
      coder.decode(["address"], challengeAfter.outcome)
    );
    await expect(poolHandlerProxy.withdraw(0)).to.emit(
      poolHandlerProxy,
      "WinningsWithdrawn"
    );

    await expect(
      (poolHandlerProxy.connect(striker) as any).withdraw(0)
    ).to.be.revertedWithCustomError(poolHandlerProxy, "PlayerDidNotWinPool");
  });
});
