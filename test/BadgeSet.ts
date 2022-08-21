import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";

// TODO: more elegant import for fixtures

describe("BadgeSet.sol", function () {
  describe("Deployment", function () {
    it("Deploys successfully", async () => {
      const { badgeSet } = await loadFixture(fixtures.deploy);
      expect(badgeSet.address).to.be.properAddress;
    });
    it("Sets URI", async () => {
      const { badgeSet, uri } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.uri(1)).to.equal(uri + "1");
    });
    it("Sets kycRegistry address", async () => {
      const { badgeSet, kycRegistry } = await loadFixture(fixtures.deploy);
      expect(kycRegistry.address).to.equal(await badgeSet.kycRegistry());
    });
    it("Transfers ownership to correct owner", async () => {
      const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.owner()).to.equal(forbes.address);
    });
  });

  describe("mint()", function () {
    it("Mints a token without expiry", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);

      await badgeSet.connect(forbes).mint(userAddress, 1, 0);
      const balance = await badgeSet.balanceOf(userAddress, 1);
      expect(balance).to.equal(1);
    });
    it("Mints a token with expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).mint(userAddress, 1, validExpiry);
      const balance = await badgeSet.balanceOf(userAddress, 1);
      expect(balance).to.equal(1);
    });
    it("Reverts if token already owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);

      await badgeSet.connect(forbes).mint(userAddress, 1, 0);
      await expect(badgeSet.connect(forbes).mint(userAddress, 1, 0)).to.be.reverted;
    });
  });
});
