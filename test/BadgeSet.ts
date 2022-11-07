import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import * as fixtures from "./fixtures/fixtures";
import { arrayOfSingleNumber, arrayOfSingleString, encodeTokenIdJs, arrayOfNums } from "./fixtures/utils";

// TODO: don't call mintBatch in mint tests

describe("BadgeSet.sol", () => {
  describe("Deployment", () => {
    it("Deploys", async () => {
      const { badgeSet } = await loadFixture(fixtures.deploy);
      expect(badgeSet.address).to.be.properAddress;
    });
    it("Sets URI (ends with BadgeSet address)", async () => {
      const { badgeSet, baseUri } = await loadFixture(fixtures.deploy);
      const tokenId = "1702821156235119098028961288950624277471988302368";
      const expectedUri = `${baseUri}${badgeSet.address.toLowerCase()}/${tokenId}`;
      expect(await badgeSet.uri(tokenId)).to.equal(expectedUri);
    });
    it("Sets kycRegistry address", async () => {
      const { badgeSet, kycRegistry } = await loadFixture(fixtures.deploy);
      expect(kycRegistry.address).to.equal(await badgeSet.kycRegistry());
    });
    it("Transfers ownership", async () => {
      const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.owner()).to.equal(forbes.address);
    });
  });

  describe("uri", () => {
    it("Returns URI for tokenId", async () => {
      const { badgeSet, baseUri } = await loadFixture(fixtures.deploy);
      const tokenId = "1702821156235119098028961288950624277471988302368";
      const expectedUri = `${baseUri}${badgeSet.address.toLowerCase()}/${tokenId}`;
      expect(await badgeSet.uri(tokenId)).to.equal(expectedUri);
    });
  });

  describe("setURI", () => {
    it("Sets new URI", async () => {
      const newUri = "https://example.com/";
      const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).setURI(newUri);
      expect(await badgeSet.uri(1)).to.equal(newUri + "1");
    });
    it("Reverts: not owner", async () => {
      const newUri = "https://example.com/";
      const { badgeSet, user } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(user).setURI(newUri)).to.be.reverted;
    });
  });

  describe("mint()", () => {
    it("Mints without expiry", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);
      expect(balance).to.equal(1);
    });
    it("Sets new maxTokenType if tokenType is incremental", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 1;

      badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);
      const maxTokenType = await badgeSet.maxTokenType();

      expect(maxTokenType).to.equal(tokenType);
    });
    it("Mints without expiry above tokenType 256 (additional bitmaps)", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const maxTokenType = 258;

      // mint tokens sequentially up to max
      for (let tokenType = 0; tokenType <= maxTokenType; tokenType++) {
        await badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);
      }
      const tokenId = await badgeSet.encodeTokenId(maxTokenType, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);

      expect(balance).to.equal(1);
    });
    it("Mints with expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await badgeSet.connect(forbes).mint(userAddress, tokenType, validExpiry);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);
      const expiry = await badgeSet.expiryOf(tokenId);

      expect(balance).to.equal(1);
      expect(expiry).to.equal(validExpiry); // expiry is stored
    });
    it("Mints to linked wallet if minting to userAddress post link", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress); // mint to userAddress
      await badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const userAddressBalance = await badgeSet.balanceOf(userAddress, tokenId);
      const walletAddressBalance = await badgeSet.balanceOf(walletAddress, tokenId);

      expect(userAddressBalance).to.equal(0);
      expect(walletAddressBalance).to.equal(1);
    });
    it("Mints to linked wallet if minting to walletAddress post link", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      await badgeSet.connect(forbes).mint(walletAddress, tokenType, noExpiry); // mint to walletAddress
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const userAddressBalance = await badgeSet.balanceOf(userAddress, tokenId);
      const walletAddressBalance = await badgeSet.balanceOf(walletAddress, tokenId);

      expect(userAddressBalance).to.equal(0);
      expect(walletAddressBalance).to.equal(1);
    });
    it("Reverts: not owner", async () => {
      const { badgeSet, user, userAddress, invalidExpiry } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(user).mint(userAddress, 1, invalidExpiry)).to.be.reverted;
    });
    it("Reverts: invalid expiry", async () => {
      const { badgeSet, forbes, userAddress, invalidExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await expect(badgeSet.connect(forbes).mint(userAddress, tokenType, invalidExpiry)).to.be.revertedWithCustomError(
        badgeSet,
        "IncorrectExpiry"
      );
    });
    it("Reverts: token type already owned", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);

      await expect(badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry)).to.be.revertedWithCustomError(
        badgeSet,
        "IncorrectBalance"
      );
    });
    it("Reverts: new tokenType not incremental", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const nonIncrementalTokenType = 50;

      await expect(badgeSet.connect(forbes).mint(userAddress, nonIncrementalTokenType, noExpiry)).to.be.revertedWithCustomError(
        badgeSet,
        "NewTokenTypeNotIncremental"
      );
    });
    it("Reverts: ERC1155Receiver not implemented", async () => {
      const { badgeSet, kycRegistry, forbes, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await expect(badgeSet.connect(forbes).mint(kycRegistry.address, tokenType, noExpiry)).to.be.revertedWithCustomError(
        badgeSet,
        "ERC1155ReceiverNotImplemented"
      );
    });
  });

  describe("mintBatch()", () => {
    it("Mints without expiry", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);

      const mintCount = 10; // 0-9
      const badgeTypes = arrayOfNums(mintCount);
      const expiries = arrayOfSingleNumber(mintCount, noExpiry);
      await badgeSet.connect(forbes).mintBatch(userAddress, badgeTypes, expiries);

      const accounts = arrayOfSingleString(mintCount, userAddress);
      const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, userAddress)));
      const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
      const expectedBalances = arrayOfSingleNumber(mintCount, 1);

      expect(balances).to.deep.equal(expectedBalances);
    });
    it("Mints with expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);

      const mintCount = 10; // 0-9
      const badgeTypes = arrayOfNums(mintCount);
      const expiries = arrayOfSingleNumber(mintCount, validExpiry); // valid expiry
      await badgeSet.connect(forbes).mintBatch(userAddress, badgeTypes, expiries);

      const accounts = arrayOfSingleString(mintCount, userAddress);
      const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, userAddress)));
      const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
      const expectedBalances = arrayOfSingleNumber(mintCount, 1);

      expect(balances).to.deep.equal(expectedBalances);
    });
    it("Mints without expiry above tokenType 256 (additional bitmaps)", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);

      const mintCount = 300; // 0-299
      const badgeTypes = arrayOfNums(mintCount);
      const expiries = arrayOfSingleNumber(mintCount, noExpiry); // valid expiry
      await badgeSet.connect(forbes).mintBatch(userAddress, badgeTypes, expiries);

      const accounts = arrayOfSingleString(mintCount, userAddress);
      const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, userAddress)));
      const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
      const expectedBalances = arrayOfSingleNumber(mintCount, 1);

      expect(balances).to.deep.equal(expectedBalances);
    });
    it("Reverts: invalid expiry", async () => {
      const { badgeSet, forbes, userAddress, invalidExpiry, validExpiry } = await loadFixture(fixtures.deploy);
      const ids = [1, 2];
      const expiries = [invalidExpiry, validExpiry];
      await expect(badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries)).to.be.reverted;
    });
    it("Reverts if token already owned", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const ids = [1, 2];
      const expiries = [validExpiry, validExpiry];
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await expect(badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries)).to.be.reverted;
    });
    it("Reverts: ERC1155Receiver not implemented", async () => {
      const { badgeSet, kycRegistry, forbes, validExpiry } = await loadFixture(fixtures.deploy);
      const ids = [1, 2];
      const expiries = [validExpiry, validExpiry];
      await expect(badgeSet.connect(forbes).mintBatch(kycRegistry.address, ids, expiries)).to.be.revertedWithCustomError(
        badgeSet,
        "ERC1155ReceiverNotImplemented"
      );
    });
  });

  describe("revoke()", () => {
    it("Revokes without expiry", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      await badgeSet.connect(forbes).revoke(userAddress, tokenType);

      expect(await badgeSet.balanceOf(userAddress, tokenId)).to.equal(0);
    });
    it("Revokes with expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await badgeSet.connect(forbes).mint(userAddress, tokenType, validExpiry); // with expiry
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      await badgeSet.connect(forbes).revoke(userAddress, tokenType);

      expect(await badgeSet.balanceOf(userAddress, tokenId)).to.equal(0);
    });
    it("Revokes above tokenType 256 (additional bitmaps)", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const maxTokenType = 258;

      // mint tokens sequentially up to max
      for (let tokenType = 0; tokenType <= maxTokenType; tokenType++) {
        await badgeSet.connect(forbes).mint(userAddress, tokenType, noExpiry);
      }
      const tokenId = await badgeSet.encodeTokenId(maxTokenType, userAddress);
      const balancePre = await badgeSet.balanceOf(userAddress, tokenId);

      await badgeSet.connect(forbes).revoke(userAddress, maxTokenType);

      const balancePost = await badgeSet.balanceOf(userAddress, tokenId);

      expect(balancePre).to.equal(1);
      expect(balancePost).to.equal(0);
    });
    it("Deletes expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await badgeSet.connect(forbes).mint(userAddress, tokenType, validExpiry); // with expiry, should delete
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      await badgeSet.connect(forbes).revoke(userAddress, tokenType);

      expect(await badgeSet.expiryOf(tokenId)).to.equal(0);
    });
    it("Reverts: not contract owner", async () => {
      const { badgeSet, user, userAddress, NotOwnerError } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await expect(badgeSet.connect(user).revoke(userAddress, tokenType)).to.be.revertedWith(NotOwnerError);
    });
    it("Reverts: token not owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      const tokenType = 0;

      await expect(badgeSet.connect(forbes).revoke(userAddress, tokenType)).to.be.revertedWithCustomError(badgeSet, "IncorrectBalance");
    });
  });

  describe("revokeBatch()", () => {
    it("Revokes tokens", async () => {
      const { badgeSet, forbes, userAddress, noExpiry } = await loadFixture(fixtures.deploy);

      const revokeCount = 10; // 0-9
      const badgeTypes = arrayOfNums(revokeCount);
      const expiries = arrayOfSingleNumber(revokeCount, noExpiry);

      await badgeSet.connect(forbes).mintBatch(userAddress, badgeTypes, expiries);
      await badgeSet.connect(forbes).revokeBatch(userAddress, badgeTypes);

      const accounts = arrayOfSingleString(revokeCount, userAddress);
      const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, userAddress)));
      const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
      const expectedBalances = arrayOfSingleNumber(revokeCount, 0);

      expect(balances).to.deep.equal(expectedBalances);
    });
    it("Deletes tokens' expiries", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);

      const revokeCount = 10; // 0-9
      const badgeTypes = arrayOfNums(revokeCount);
      const expiries = arrayOfSingleNumber(revokeCount, validExpiry);
      const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, userAddress)));

      await badgeSet.connect(forbes).mintBatch(userAddress, badgeTypes, expiries);
      const expiriesBefore = await Promise.all(tokenIds.map((id) => badgeSet.expiryOf(id)));
      await badgeSet.connect(forbes).revokeBatch(userAddress, badgeTypes);
      const expiriesAfter = await Promise.all(tokenIds.map((id) => badgeSet.expiryOf(id)));

      const arrayOfZeros = arrayOfSingleNumber(revokeCount, 0);

      expect(expiriesBefore).to.deep.equal(expiries);
      expect(expiriesAfter).to.deep.equal(arrayOfZeros);
    });
    it("Reverts: not owner", async () => {
      const { badgeSet, user, userAddress, NotOwnerError } = await loadFixture(fixtures.deploy);
      const revokeCount = 10; // 0-9
      const badgeTypes = arrayOfNums(revokeCount);

      await expect(badgeSet.connect(user).revokeBatch(userAddress, badgeTypes)).to.be.revertedWith(NotOwnerError);
    });
    it("Reverts: token not owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      const revokeCount = 10; // 0-9
      const badgeTypes = arrayOfNums(revokeCount);

      await expect(badgeSet.connect(forbes).revokeBatch(userAddress, badgeTypes)).to.be.revertedWithCustomError(
        badgeSet,
        "IncorrectBalance"
      );
    });
  });

  describe("encodeTokenId()", () => {
    it("Encodes a tokenType and address together", async () => {
      const { badgeSet, userAddress } = await loadFixture(fixtures.deploy);
      const tokenType = ethers.BigNumber.from(1);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const localTokenId = encodeTokenIdJs(tokenType, userAddress);
      expect(tokenId).to.equal(localTokenId);
    });
  });

  describe("moveUserTokensToWallet()", () => {
    it.only("transitions wallet", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);

      const tokenCount = 10; // 0-9
      const tokenTypes = arrayOfNums(tokenCount);
      const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
      await badgeSet.connect(forbes).mintBatch(userAddress, tokenTypes, expiries);

      const userAccounts = arrayOfSingleString(tokenCount, userAddress);
      const userTokenIds = await Promise.all(tokenTypes.map((tokenType) => badgeSet.encodeTokenId(tokenType, userAddress)));
      const walletAccounts = arrayOfSingleString(tokenCount, walletAddress);
      const walletTokenIds = await Promise.all(tokenTypes.map((tokenType) => badgeSet.encodeTokenId(tokenType, walletAddress)));

      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);

      const result0 = arrayOfSingleNumber(tokenCount, 0);
      const result1 = arrayOfSingleNumber(tokenCount, 1);
      expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
      expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
    });
    it.only("transitions wallet for > 256 tokenType (multiple bitmaps)", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);

      const tokenCount = 258; // 0-257
      const tokenTypes = arrayOfNums(tokenCount);
      const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
      await badgeSet.connect(forbes).mintBatch(userAddress, tokenTypes, expiries);

      const userAccounts = arrayOfSingleString(tokenCount, userAddress);
      const userTokenIds = await Promise.all(tokenTypes.map((tokenType) => badgeSet.encodeTokenId(tokenType, userAddress)));
      const walletAccounts = arrayOfSingleString(tokenCount, walletAddress);
      const walletTokenIds = await Promise.all(tokenTypes.map((tokenType) => badgeSet.encodeTokenId(tokenType, walletAddress)));

      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);

      const result0 = arrayOfSingleNumber(tokenCount, 0);
      const result1 = arrayOfSingleNumber(tokenCount, 1);
      expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
      expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
    });
    it.only("emits correct number of events", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenCount = 10; // 0-9

      const tokenTypes = arrayOfNums(tokenCount);
      const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
      await badgeSet.connect(forbes).mintBatch(userAddress, tokenTypes, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      const transitionWalletCall = await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);
      const { events } = await transitionWalletCall.wait();

      expect(events).to.not.be.undefined;
      expect(events).to.have.length(tokenCount + 1); // transition events + single transitionWallet() event
    });
    it.only("TransferSingle events are correct", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenCount = 10; // 0-9

      const tokenTypes = arrayOfNums(tokenCount);
      const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
      await badgeSet.connect(forbes).mintBatch(userAddress, tokenTypes, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      const transitionWalletCall = await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);

      const { events } = await transitionWalletCall.wait();
      const transferEvents = events?.filter((e) => e.event === "TransferSingle");

      expect(events).to.not.be.undefined;
      transferEvents?.forEach((event) => {
        const operator = event.args?.operator;
        const from = event.args?.from;
        const to = event.args?.to;
        const value = event.args?.value;
        expect(operator).to.equal(forbes.address);
        expect(from).to.equal(userAddress);
        expect(to).to.equal(walletAddress);
        expect(value).to.equal(1);
      });
    });
    it("reverts if wallet not linked", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress, noExpiry } = await loadFixture(fixtures.deploy);
      const tokenCount = 10; // 0-9

      const tokenTypes = arrayOfNums(tokenCount);
      const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
      await badgeSet.connect(forbes).mintBatch(userAddress, tokenTypes, expiries);
      await expect(badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress)).to.be.revertedWithCustomError(
        badgeSet,
        "WalletNotLinked"
      );
    });
  });
  describe("ERC1155 No Ops - Expected Revert", () => {
    it("setApprovalForAll()", async () => {
      const { badgeSet, user } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.setApprovalForAll(user.address, true)).to.be.revertedWithCustomError(
        badgeSet,
        "SoulboundTokenNoSetApprovalForAll"
      );
    });
    it("isApprovedForAll()", async () => {
      const { badgeSet, soulbound, user } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.isApprovedForAll(soulbound.address, user.address)).to.be.revertedWithCustomError(
        badgeSet,
        "SoulboundTokenNoIsApprovedForAll"
      );
    });
    it("safeTransferFrom()", async () => {
      const { badgeSet, soulbound, user } = await loadFixture(fixtures.deploy);
      const from = soulbound.address;
      const to = user.address;
      const id = 1;
      const amount = 1;
      const data = ethers.utils.arrayify("0x00");
      await expect(badgeSet.safeTransferFrom(from, to, id, amount, data)).to.be.revertedWithCustomError(
        badgeSet,
        "SoulboundTokenNoSafeTransferFrom"
      );
    });
    it("safeBatchTransferFrom()", async () => {
      const { badgeSet, soulbound, user } = await loadFixture(fixtures.deploy);
      const from = soulbound.address;
      const to = user.address;
      const ids = [1, 50, 100];
      const amounts = [1, 1, 1];
      const data = ethers.utils.arrayify("0x00");
      await expect(badgeSet.safeBatchTransferFrom(from, to, ids, amounts, data)).to.be.revertedWithCustomError(
        badgeSet,
        "SoulboundTokenNoSafeBatchTransferFrom"
      );
    });
  });
});
