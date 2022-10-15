import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";
import { arrayOfSingleNumber, arrayOfSingleString, encodeTokenIdJs, randomIntFromInterval } from "./fixtures/utils";

describe("KycRegistry.sol", function () {
  describe("Deployment", function () {
    it("Deploys successfully", async () => {
      const { kycRegistry } = await loadFixture(fixtures.deploy);
      expect(kycRegistry.address).to.be.properAddress;
    });
    it("Sets correct owner", async () => {
      const { kycRegistry, soulbound } = await loadFixture(fixtures.deploy);
      expect(await kycRegistry.owner()).to.equal(soulbound.address);
    });
  });
  describe("kycToUserAddress()", () => {
    it("should convert KYC to the correct userAddress", async () => {
      const { kycRegistry, userKycDetails } = await loadFixture(fixtures.deploy);
      const { firstName, lastName, phoneNumber } = userKycDetails;
      const firstNameBytes = ethers.utils.formatBytes32String(firstName);
      const lastNameBytes = ethers.utils.formatBytes32String(lastName);
      const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
      const userAddress = await kycRegistry.hashKycToUserAddress(firstName, lastName, phoneNumberBN);

      const hash = ethers.utils.solidityKeccak256(["bytes32", "bytes32", "uint256"], [firstNameBytes, lastNameBytes, phoneNumberBN]);

      const hashAsAddress = ethers.utils.getAddress("0x" + hash.slice(-40));

      expect(userAddress).to.be.properAddress;
      expect(hashAsAddress).to.be.properAddress;
      expect(userAddress).to.equal(hashAsAddress);
    });
    it("should revert for firstName longer than 32", async () => {
      const { kycRegistry, userKycDetails } = await loadFixture(fixtures.deploy);
      const { lastName, phoneNumber } = userKycDetails;
      const firstName = "This is a string that is longer than 32 characters";
      const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
      await expect(kycRegistry.hashKycToUserAddress(firstName, lastName, phoneNumberBN)).to.be.revertedWithCustomError(
        kycRegistry,
        "StringTooLong"
      );
    });
    it("should revert for lastName longer than 32", async () => {
      const { kycRegistry, userKycDetails } = await loadFixture(fixtures.deploy);
      const { firstName, phoneNumber } = userKycDetails;
      const lastName = "This is a string that is longer than 32 characters";
      const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
      await expect(kycRegistry.hashKycToUserAddress(firstName, lastName, phoneNumberBN)).to.be.revertedWithCustomError(
        kycRegistry,
        "StringTooLong"
      );
    });
  });
  describe("linkWallet()", () => {
    it("should link wallet to kycRegistry", async () => {
      const { kycRegistry, soulbound, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(userAddress);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(walletAddress);
    });
    it("reverts if walletAddress is already linked", async () => {
      const { kycRegistry, soulbound, user, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(userAddress);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      await expect(kycRegistry.connect(soulbound).linkWallet(user.address, walletAddress)).to.be.revertedWithCustomError(
        kycRegistry,
        "WalletAlreadyLinked"
      ); // second link
    });
    it("reverts if userAddress is already linked", async () => {
      const { kycRegistry, soulbound, user, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(userAddress);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      await expect(kycRegistry.connect(soulbound).linkWallet(userAddress, user.address)).to.be.revertedWithCustomError(
        kycRegistry,
        "WalletAlreadyLinked"
      ); // second link
    });
  });
  describe("transitionBadgesByContracts()", () => {
    it("transition all badges in a single call across two contracts", async () => {
      const { kycRegistry, soulbound, userAddress, walletAddress, forbes, padi, badgeSet, badgeSet2 } = await loadFixture(fixtures.deploy);
      const ids = [1, 2, 3, 20, 100, 350, 1000];
      const expiries = arrayOfSingleNumber(ids.length, 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await badgeSet2.connect(padi).mintBatch(userAddress, ids, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);

      await kycRegistry.transitionBadgesByContracts(userAddress, walletAddress, [badgeSet.address, badgeSet2.address]);

      const userAddressesArray = arrayOfSingleString(ids.length, userAddress);
      const walletAddressesArray = arrayOfSingleString(ids.length, walletAddress);
      const tokenIds = await Promise.all(ids.map((id) => badgeSet.encodeTokenId(id, userAddress)));

      const balance0 = arrayOfSingleNumber(ids.length, 0);
      const balance1 = arrayOfSingleNumber(ids.length, 1);

      // Forbes
      const userAddressBalancesForbes = await badgeSet.balanceOfBatch(userAddressesArray, tokenIds);
      const walletAddressBalancesForbes = await badgeSet.balanceOfBatch(walletAddressesArray, tokenIds);
      expect(userAddressBalancesForbes).to.deep.equal(balance0);
      expect(walletAddressBalancesForbes).to.deep.equal(balance1);

      // Padi
      const userAddressBalancesPadi = await badgeSet2.balanceOfBatch(userAddressesArray, tokenIds);
      const walletAddressBalancesPadi = await badgeSet2.balanceOfBatch(walletAddressesArray, tokenIds);
      expect(userAddressBalancesPadi).to.deep.equal(balance0);
      expect(walletAddressBalancesPadi).to.deep.equal(balance1);
    });
  });
});
