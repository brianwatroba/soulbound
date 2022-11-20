import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";
import { arrayOfSingleNumber, arrayOfSingleString, arrayOfNums } from "./fixtures/utils";

describe("*| KycRegistry.sol |*", function () {
  describe("Deployment:", function () {
    describe("success", () => {
      it("Deploys", async () => {
        const { kycRegistry } = await loadFixture(fixtures.deploy);
        expect(kycRegistry.address).to.be.properAddress;
      });
      it("Sets owner", async () => {
        const { kycRegistry, soulbound } = await loadFixture(fixtures.deploy);
        expect(await kycRegistry.owner()).to.equal(soulbound.address);
      });
    });
  });
  describe("kycToUserAddress():", () => {
    describe("success", () => {
      it("hashes KYC to the correct userAddress", async () => {
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
    });
    describe("failure", () => {
      it("firstName longer than 32", async () => {
        const { kycRegistry, userKycDetails } = await loadFixture(fixtures.deploy);
        const { lastName, phoneNumber } = userKycDetails;
        const firstName = "This is a string that is longer than 32 characters";
        const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
        await expect(kycRegistry.hashKycToUserAddress(firstName, lastName, phoneNumberBN)).to.be.revertedWithCustomError(
          kycRegistry,
          "StringLongerThan31Bytes"
        );
      });
      it("lastName longer than 32", async () => {
        const { kycRegistry, userKycDetails } = await loadFixture(fixtures.deploy);
        const { firstName, phoneNumber } = userKycDetails;
        const lastName = "This is a string that is longer than 32 characters";
        const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
        await expect(kycRegistry.hashKycToUserAddress(firstName, lastName, phoneNumberBN)).to.be.revertedWithCustomError(
          kycRegistry,
          "StringLongerThan31Bytes"
        );
      });
    });
  });
  describe("linkWallet():", () => {
    describe("success", () => {
      it("links wallet to kycAddress", async () => {
        const { kycRegistry, soulbound, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
        expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(userAddress);
        await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
        expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(walletAddress);
      });
    });
    describe("failure", () => {
      it("walletAddress is already linked", async () => {
        const { kycRegistry, soulbound, user, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
        expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(userAddress);
        await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
        await expect(kycRegistry.connect(soulbound).linkWallet(user.address, walletAddress)).to.be.revertedWithCustomError(
          kycRegistry,
          "WalletAlreadyLinked"
        ); // second link
      });
      it("userAddress is already linked", async () => {
        const { kycRegistry, soulbound, user, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
        expect(await kycRegistry.getLinkedWallet(userAddress)).to.equal(userAddress);
        await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
        await expect(kycRegistry.connect(soulbound).linkWallet(userAddress, user.address)).to.be.revertedWithCustomError(
          kycRegistry,
          "WalletAlreadyLinked"
        ); // second link
      });
    });
  });
  describe("transitionTokensByContracts():", () => {
    describe("success", () => {
      it("transitions all badges in a single call across two contracts", async () => {
        const { badgeSet, badgeSet2, kycRegistry, soulbound, forbes, padi, userAddress, walletAddress, noExpiry } = await loadFixture(
          fixtures.deploy
        );
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(userAddress, badgeTypes, expiries);
        await badgeSet2.connect(padi).mintBatch(userAddress, badgeTypes, expiries);
        await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);

        await kycRegistry.transitionTokensByContracts(userAddress, walletAddress, [badgeSet.address, badgeSet2.address]);

        const userAddressesArray = arrayOfSingleString(badgeTypes.length, userAddress);
        const walletAddressesArray = arrayOfSingleString(badgeTypes.length, walletAddress);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, userAddress)));

        const balance0 = arrayOfSingleNumber(tokenCount, 0);
        const balance1 = arrayOfSingleNumber(tokenCount, 1);

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
});
