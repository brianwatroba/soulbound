import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";

describe("BadgeSetFactory.sol", function () {
  describe("Deployment", function () {
    it("Deploys successfully", async () => {
      const { badgeSetFactory } = await loadFixture(fixtures.deploy);
      expect(badgeSetFactory.address).to.be.properAddress;
    });
    it("Sets deployer as owner", async () => {
      const { badgeSetFactory, soulbound } = await loadFixture(fixtures.deploy);
      expect(await badgeSetFactory.owner()).to.equal(soulbound.address);
    });
  });
  describe("createBadgeSet", () => {
    it("deploys a badgeSet", async () => {
      const { badgeSetFactory, soulbound, forbes, kycRegistry, uri } = await loadFixture(
        fixtures.deploy
      );
      await badgeSetFactory
        .connect(soulbound)
        .createBadgeSet(forbes.address, kycRegistry.address, uri);
      const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
      const badgeSet = await ethers.getContractAt("BadgeSet", badgeSetAddress);
      expect(badgeSet.address).to.be.properAddress;
      expect(await badgeSet.factory()).to.equal(badgeSetFactory.address);
    });
  });
  describe("badgeSets()", () => {
    it("returns array of badgeSets", async () => {
      const { badgeSetFactory, badgeSet, soulbound, forbes, kycRegistry, uri } = await loadFixture(
        fixtures.deploy
      );
      const badgeSets = await badgeSetFactory.badgeSets();
      expect 
    });
  });
});
