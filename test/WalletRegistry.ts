import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";
import { arrayOfSingleNumber, arrayOfSingleString, arrayOfNums } from "./fixtures/utils";

describe("*| WalletRegistry.sol |*", function () {
  describe("Deployment:", function () {
    describe("success", () => {
      it("Deploys", async () => {
        const { walletRegistry } = await loadFixture(fixtures.deploy);
        expect(walletRegistry.address).to.be.properAddress;
      });
      it("Sets owner", async () => {
        const { walletRegistry, soulbound } = await loadFixture(fixtures.deploy);
        expect(await walletRegistry.owner()).to.equal(soulbound.address);
      });
    });
  });
  describe("getLiteWalletAddress():", () => {
    describe("success", () => {
      it("hashes userInfo to the correct liteWallet", async () => {
        const { walletRegistry, userInfo } = await loadFixture(fixtures.deploy);
        const { firstName, lastName, phoneNumber } = userInfo;
        const firstNameBytes = ethers.utils.formatBytes32String(firstName);
        const lastNameBytes = ethers.utils.formatBytes32String(lastName);
        const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
        const liteWallet = await walletRegistry.getLiteWalletAddress(firstName, lastName, phoneNumberBN);

        const hash = ethers.utils.solidityKeccak256(["bytes32", "bytes32", "uint256"], [firstNameBytes, lastNameBytes, phoneNumberBN]);

        const hashAsAddress = ethers.utils.getAddress("0x" + hash.slice(-40));

        expect(liteWallet).to.be.properAddress;
        expect(hashAsAddress).to.be.properAddress;
        expect(liteWallet).to.equal(hashAsAddress);
      });
    });
    describe("failure", () => {
      it("firstName longer than 32", async () => {
        const { walletRegistry, userInfo, errors } = await loadFixture(fixtures.deploy);
        const { lastName, phoneNumber } = userInfo;
        const firstName = "This is a string that is longer than 32 characters";
        const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
        await expect(walletRegistry.getLiteWalletAddress(firstName, lastName, phoneNumberBN)).to.be.revertedWithCustomError(
          walletRegistry,
          errors.StringLongerThan31Bytes
        );
      });
      it("lastName longer than 32", async () => {
        const { walletRegistry, userInfo, errors } = await loadFixture(fixtures.deploy);
        const { firstName, phoneNumber } = userInfo;
        const lastName = "This is a string that is longer than 32 characters";
        const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
        await expect(walletRegistry.getLiteWalletAddress(firstName, lastName, phoneNumberBN)).to.be.revertedWithCustomError(
          walletRegistry,
          errors.StringLongerThan31Bytes
        );
      });
    });
  });
  describe("linkWallet():", () => {
    describe("success", () => {
      it("links liteWallet to realWallet", async () => {
        const { walletRegistry, soulbound, liteWallet, realWallet } = await loadFixture(fixtures.deploy);
        expect(await walletRegistry.getLinkedWallet(liteWallet)).to.equal(liteWallet);
        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        expect(await walletRegistry.getLinkedWallet(liteWallet)).to.equal(realWallet);
      });
    });
    describe("failure", () => {
      it("realWallet is already linked", async () => {
        const { walletRegistry, soulbound, user, liteWallet, realWallet, errors } = await loadFixture(fixtures.deploy);
        expect(await walletRegistry.getLinkedWallet(liteWallet)).to.equal(liteWallet);
        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        await expect(walletRegistry.connect(soulbound).linkWallet(user.address, realWallet)).to.be.revertedWithCustomError(
          walletRegistry,
          errors.WalletAlreadyLinked
        ); // second link
      });
      it("liteWallet is already linked", async () => {
        const { walletRegistry, soulbound, user, liteWallet, realWallet, errors } = await loadFixture(fixtures.deploy);
        expect(await walletRegistry.getLinkedWallet(liteWallet)).to.equal(liteWallet);
        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        await expect(walletRegistry.connect(soulbound).linkWallet(liteWallet, user.address)).to.be.revertedWithCustomError(
          walletRegistry,
          errors.WalletAlreadyLinked
        ); // second link
      });
    });
  });
  describe("transitionBadgesByContracts():", () => {
    describe("success", () => {
      it("transitions all badges in a single call across two contracts", async () => {
        const { badgeSet, badgeSet2, walletRegistry, soulbound, forbes, padi, liteWallet, realWallet, noExpiry } = await loadFixture(
          fixtures.deploy
        );
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        await badgeSet2.connect(padi).mintBatch(liteWallet, badgeTypes, expiries);
        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);

        await walletRegistry.transitionBadgesByContracts(liteWallet, realWallet, [badgeSet.address, badgeSet2.address]);

        const liteWalletsArray = arrayOfSingleString(badgeTypes.length, liteWallet);
        const realWalletsArray = arrayOfSingleString(badgeTypes.length, realWallet);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));

        const balance0 = arrayOfSingleNumber(tokenCount, 0);
        const balance1 = arrayOfSingleNumber(tokenCount, 1);

        // Forbes
        const liteWalletBalancesForbes = await badgeSet.balanceOfBatch(liteWalletsArray, tokenIds);
        const realWalletBalancesForbes = await badgeSet.balanceOfBatch(realWalletsArray, tokenIds);
        expect(liteWalletBalancesForbes).to.deep.equal(balance0);
        expect(realWalletBalancesForbes).to.deep.equal(balance1);

        // Padi
        const liteWalletBalancesPadi = await badgeSet2.balanceOfBatch(liteWalletsArray, tokenIds);
        const realWalletBalancesPadi = await badgeSet2.balanceOfBatch(realWalletsArray, tokenIds);
        expect(liteWalletBalancesPadi).to.deep.equal(balance0);
        expect(realWalletBalancesPadi).to.deep.equal(balance1);
      });
    });
  });
});
