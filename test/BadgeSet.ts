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
    it("Sets organization owner", async () => {
      const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.owner()).to.equal(forbes.address);
    });
    it("Sets URI", async () => {
      const { badgeSet, uri } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.uri(1)).to.equal(uri + "1");
    });
  });

  describe("Write functions", function () {
    it("mintToAddress()", async () => {
      const { badgeSet, soulbound, forbes } = await loadFixture(fixtures.deploy);
      const balanceBefore = await badgeSet.balanceOf(soulbound.address, 1);
      await badgeSet.connect(forbes).mintToAddress(soulbound.address, 1);
      const balanceAfter = await badgeSet.balanceOf(soulbound.address, 1);
      expect(balanceBefore).to.equal(0);
      expect(balanceAfter).to.equal(1);
    });
    it("revokeByAddress()", async () => {
      const { badgeSet, soulbound, forbes } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).mintToAddress(soulbound.address, 1);
      const balanceBefore = await badgeSet.balanceOf(soulbound.address, 1);
      await badgeSet.connect(forbes).revokeByAddress(soulbound.address, 1);
      const balanceAfter = await badgeSet.balanceOf(soulbound.address, 1);
      expect(balanceBefore).to.equal(1);
      expect(balanceAfter).to.equal(0);
    });
  });
  describe("View functions", function () {
    it("hashKyc(): should hash kyc correctly", async () => {
      const { badgeSet, kyc } = await loadFixture(fixtures.deploy);
      const { firstName, lastName, dob, phoneNumber } = kyc;

      const firstNameBytes = ethers.utils.formatBytes32String(firstName);
      const lastNameBytes = ethers.utils.formatBytes32String(lastName);

      const kycHash = await badgeSet.hashKyc(firstNameBytes, lastNameBytes, dob, phoneNumber);
      const localHash = ethers.utils.solidityKeccak256(
        ["bytes32", "bytes32", "uint256", "uint256"],
        [firstNameBytes, lastNameBytes, dob, phoneNumber]
      );
      expect(kycHash).to.equal(localHash);
    });
    it("kycHashToAddress(): should return address correctly", async () => {
      const { badgeSet, kyc } = await loadFixture(fixtures.deploy);
      const { firstName, lastName, dob, phoneNumber } = kyc;

      const firstNameBytes = ethers.utils.formatBytes32String(firstName);
      const lastNameBytes = ethers.utils.formatBytes32String(lastName);

      const kycHash = await badgeSet.hashKyc(firstNameBytes, lastNameBytes, dob, phoneNumber);
      const kycAddress = await badgeSet.kycHashToAddress(kycHash);
      expect(kycAddress).to.be.properAddress;
    });
  });
});
