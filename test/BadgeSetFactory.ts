import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";

describe("*| BadgeSetFactory.sol |*", function () {
  describe("Deployment:", function () {
    describe("success", () => {
      it("deploys", async () => {
        const { badgeSetFactory } = await loadFixture(fixtures.deploy);
        expect(badgeSetFactory.address).to.be.properAddress;
      });
      it("sets deployer as owner", async () => {
        const { badgeSetFactory, soulbound } = await loadFixture(fixtures.deploy);
        expect(await badgeSetFactory.owner()).to.equal(soulbound.address);
      });
    });
  });
  describe("createBadgeSet():", () => {
    describe("success", () => {
      it("deploys a badgeSet", async () => {
        const { badgeSetFactory, soulbound, forbes, baseUri } = await loadFixture(fixtures.deploy);
        await badgeSetFactory.connect(soulbound).createBadgeSet(forbes.address, baseUri);
        const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
        const badgeSet = await ethers.getContractAt("BadgeSet", badgeSetAddress);
        expect(badgeSet.address).to.be.properAddress;
      });
    });
    describe("failure", () => {
      it("not owner", async () => {
        const { badgeSetFactory, forbes, baseUri, errors } = await loadFixture(fixtures.deploy);
        await expect(badgeSetFactory.connect(forbes).createBadgeSet(forbes.address, baseUri)).to.be.revertedWith(errors.NotOwner);
      });
    });
  });
  describe("badgeSets():", () => {
    describe("success", () => {
      it("returns array of badgeSets", async () => {
        const { badgeSetFactory, badgeSet } = await loadFixture(fixtures.deploy);
        const badgeSets = await badgeSetFactory.badgeSets();
        expect(badgeSets).to.have.lengthOf(2);
        expect(badgeSets[0]).to.equal(badgeSet.address);
        expect(badgeSets[0]).to.be.properAddress;
      });
    });
  });
});
