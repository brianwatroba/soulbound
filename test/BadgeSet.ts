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
    it.only("Mints without expiry", async () => {
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
    it("Revokes", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).mint(userAddress, 1, 0);
      const tokenId = await badgeSet.encodeTokenId(1, userAddress);
      await badgeSet.connect(forbes).revoke(userAddress, 1);

      expect(await badgeSet.balanceOf(userAddress, tokenId)).to.equal(0);
    });
    it("Reverts: not owner", async () => {
      const { badgeSet, user, userAddress } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(user).revoke(userAddress, 1)).to.be.reverted;
    });
    it("Reverts: token not owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(forbes).revoke(userAddress, 1)).to.be.reverted;
    });
  });

  describe("revokeBatch()", () => {
    it("Revokes token and expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const tokenTypes = [1, 300];
      const expiries = arrayOfSingleNumber(tokenTypes.length, validExpiry);
      const [tokenId1, tokenId2] = await Promise.all(tokenTypes.map((id) => badgeSet.encodeTokenId(id, userAddress)));

      await badgeSet.connect(forbes).mintBatch(userAddress, tokenTypes, expiries);
      expect(await badgeSet.expiryOf(tokenId1)).to.equal(validExpiry);
      expect(await badgeSet.expiryOf(tokenId2)).to.equal(validExpiry);

      await badgeSet.connect(forbes).revokeBatch(userAddress, tokenTypes);

      const expectedAmounts = arrayOfSingleNumber(tokenTypes.length, 0); // 0 for each token
      expect(await badgeSet.balanceOfBatch([userAddress, userAddress], [tokenId1, tokenId2])).to.deep.equal(expectedAmounts);
      expect(await badgeSet.expiryOf(tokenId1)).to.equal(0);
      expect(await badgeSet.expiryOf(tokenId2)).to.equal(0);
    });
    it("Reverts: not owner", async () => {
      const { badgeSet, user, userAddress } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(user).revokeBatch(userAddress, [1, 2])).to.be.reverted;
    });
    it("Reverts: token not owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(forbes).revokeBatch(userAddress, [1, 2])).to.be.reverted;
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
    it("transitions wallet", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      const ids = [1, 2, 3, 20, 100, 350, 1000];
      const expiries = arrayOfSingleNumber(ids.length, 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      // it passes because once we link them, we look up balance at end, and it returns
      await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);
      const userAccounts = ids.map(() => userAddress);
      const userTokenIds = await Promise.all(ids.map((id) => badgeSet.encodeTokenId(id, userAddress)));
      const walletAccounts = ids.map(() => walletAddress);
      const walletTokenIds = await Promise.all(ids.map((id) => badgeSet.encodeTokenId(id, walletAddress)));
      const result0 = arrayOfSingleNumber(ids.length, 0);
      const result1 = arrayOfSingleNumber(ids.length, 1);
      expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
      expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
    });
    it("emits correct number of events", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      const ids = [1, 2, 3, 20, 100, 350, 550, 1000];
      const expiries = arrayOfSingleNumber(ids.length, 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      const transitionWalletCall = await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);
      const { events } = await transitionWalletCall.wait();
      expect(events).to.not.be.undefined;
      expect(events).to.have.length(ids.length + 1);
    });
    it("TransferSingle events are correct", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      const ids = [1, 2, 3, 20, 100, 350, 550, 1000];
      const expiries = arrayOfSingleNumber(ids.length, 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      const transitionWalletCall = await badgeSet.connect(forbes).moveUserTokensToWallet(userAddress, walletAddress);
      const { events } = await transitionWalletCall.wait();
      expect(events).to.not.be.undefined;
      const transferEvents = events?.filter((e) => e.event === "TransferSingle");
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
      const { badgeSet, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      const ids = [1, 2, 3, 20, 100, 350, 1000];
      const expiries = arrayOfSingleNumber(ids.length, 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
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
