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

  describe("Write functions", function () {
    it("mint()", async () => {
      const { badgeSet, soulbound, forbes, userAddress } = await loadFixture(fixtures.deploy);

      const mint = await badgeSet.connect(forbes).mint(userAddress, 1, 0);
      const balance = await badgeSet.balanceOf(userAddress, 1);

      expect(balance).to.equal(1);
    });
    it("revokeByAddress()", async () => {
      const { badgeSet, soulbound, forbes } = await loadFixture(fixtures.deploy);
    });
  });
  describe("View functions", function () {
    it("hashKyc(): should hash kyc correctly", async () => {});
  });
});
