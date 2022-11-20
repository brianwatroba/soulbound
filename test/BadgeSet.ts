import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import * as fixtures from "./fixtures/fixtures";
import { arrayOfSingleNumber, arrayOfSingleString, encodeTokenIdJs, arrayOfNums } from "./fixtures/utils";

describe("*| BadgeSet.sol |*", () => {
  describe("Deployment:", () => {
    describe("success", () => {
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
      it("Sets walletRegistry address", async () => {
        const { badgeSet, walletRegistry } = await loadFixture(fixtures.deploy);
        expect(walletRegistry.address).to.equal(await badgeSet.walletRegistry());
      });
      it("Transfers ownership", async () => {
        const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
        expect(await badgeSet.owner()).to.equal(forbes.address);
      });
    });
  });
  describe("uri():", () => {
    describe("success", () => {
      it("Returns URI for tokenId", async () => {
        const { badgeSet, baseUri } = await loadFixture(fixtures.deploy);
        const tokenId = "1702821156235119098028961288950624277471988302368";
        const expectedUri = `${baseUri}${badgeSet.address.toLowerCase()}/${tokenId}`;
        expect(await badgeSet.uri(tokenId)).to.equal(expectedUri);
      });
    });
  });
  describe("setURI():", () => {
    describe("success", () => {
      it("Sets new URI", async () => {
        const newUri = "https://example.com/";
        const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
        await badgeSet.connect(forbes).setURI(newUri);
        expect(await badgeSet.uri(1)).to.equal(newUri + "1");
      });
    });
    describe("failure", () => {
      it("Not owner", async () => {
        const newUri = "https://example.com/";
        const { badgeSet, user } = await loadFixture(fixtures.deploy);
        await expect(badgeSet.connect(user).setURI(newUri)).to.be.reverted;
      });
    });
  });
  describe("mint():", () => {
    describe("success", () => {
      it("Without expiry", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        const balance = await badgeSet.balanceOf(liteWallet, tokenId);
        expect(balance).to.equal(1);
      });
      it("With expiry", async () => {
        const { badgeSet, forbes, liteWallet, validExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, validExpiry);
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        const balance = await badgeSet.balanceOf(liteWallet, tokenId);
        const expiry = await badgeSet.expiryOf(tokenId);

        expect(balance).to.equal(1);
        expect(expiry).to.equal(validExpiry); // expiry is stored
      });
      it("Sets new maxBadgeType if badgeType is incremental", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 1;

        badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        const maxBadgeType = await badgeSet.maxBadgeType();

        expect(maxBadgeType).to.equal(badgeType);
      });
      it("Without expiry above badgeType 256 (additional bitmaps)", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const maxBadgeType = 258;

        // mint tokens sequentially up to max
        for (let badgeType = 0; badgeType <= maxBadgeType; badgeType++) {
          await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        }
        const tokenId = await badgeSet.encodeTokenId(maxBadgeType, liteWallet);
        const balance = await badgeSet.balanceOf(liteWallet, tokenId);

        expect(balance).to.equal(1);
      });
      it("To linked wallet if minting to liteWallet post link", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet); // mint to liteWallet
        await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        const liteWalletBalance = await badgeSet.balanceOf(liteWallet, tokenId);
        const realWalletBalance = await badgeSet.balanceOf(realWallet, tokenId);

        expect(liteWalletBalance).to.equal(0);
        expect(realWalletBalance).to.equal(1);
      });
      it("To linked wallet if minting to realWallet post link", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        await badgeSet.connect(forbes).mint(realWallet, badgeType, noExpiry); // mint to realWallet
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        const liteWalletBalance = await badgeSet.balanceOf(liteWallet, tokenId);
        const realWalletBalance = await badgeSet.balanceOf(realWallet, tokenId);

        expect(liteWalletBalance).to.equal(0);
        expect(realWalletBalance).to.equal(1);
      });
      it("Emits a TransferSingle event", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry, zeroAddress } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        const mintCall = await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        const { events } = await mintCall.wait();
        const transferSingleEvents = events?.filter((e) => e.event === "TransferSingle");

        expect(transferSingleEvents).to.not.be.undefined;
        expect(transferSingleEvents).to.have.length(1);
        transferSingleEvents?.forEach((event) => {
          if (event.args) {
            const { operator, from, to, value } = event.args;
            expect(operator).to.equal(forbes.address);
            expect(from).to.equal(zeroAddress);
            expect(to).to.equal(liteWallet);
            expect(value).to.equal(1);
          } else {
            expect(true).to.equal(false);
          }
        });
      });
    });
    describe("failure", () => {
      it("Not owner", async () => {
        const { badgeSet, user, liteWallet, invalidExpiry } = await loadFixture(fixtures.deploy);
        await expect(badgeSet.connect(user).mint(liteWallet, 1, invalidExpiry)).to.be.reverted;
      });
      it("Invalid expiry", async () => {
        const { badgeSet, forbes, liteWallet, invalidExpiry, errors } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await expect(badgeSet.connect(forbes).mint(liteWallet, badgeType, invalidExpiry)).to.be.revertedWithCustomError(
          badgeSet,
          errors.IncorrectExpiry
        );
      });
      it("badgeType already owned", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry, errors } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);

        await expect(badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry)).to.be.revertedWithCustomError(
          badgeSet,
          errors.IncorrectBalance
        );
      });
      it("New badgeType not incremental", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry, errors } = await loadFixture(fixtures.deploy);
        const nonIncrementalBadgeType = 50;

        await expect(badgeSet.connect(forbes).mint(liteWallet, nonIncrementalBadgeType, noExpiry)).to.be.revertedWithCustomError(
          badgeSet,
          errors.NewBadgeTypeNotIncremental
        );
      });
      it("ERC1155Receiver not implemented", async () => {
        const { badgeSet, walletRegistry, forbes, noExpiry, errors } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await expect(badgeSet.connect(forbes).mint(walletRegistry.address, badgeType, noExpiry)).to.be.revertedWithCustomError(
          badgeSet,
          errors.ERC1155ReceiverNotImplemented
        );
      });
    });
  });
  describe("mintBatch():", () => {
    describe("success", () => {
      it("Mints without expiry", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);

        const mintCount = 10; // 0-9
        const badgeTypes = arrayOfNums(mintCount);
        const expiries = arrayOfSingleNumber(mintCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);

        const accounts = arrayOfSingleString(mintCount, liteWallet);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
        const expectedBalances = arrayOfSingleNumber(mintCount, 1);

        expect(balances).to.deep.equal(expectedBalances);
      });
      it("Mints with expiry", async () => {
        const { badgeSet, forbes, liteWallet, validExpiry } = await loadFixture(fixtures.deploy);

        const mintCount = 10; // 0-9
        const badgeTypes = arrayOfNums(mintCount);
        const expiries = arrayOfSingleNumber(mintCount, validExpiry); // valid expiry
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);

        const accounts = arrayOfSingleString(mintCount, liteWallet);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
        const expectedBalances = arrayOfSingleNumber(mintCount, 1);

        expect(balances).to.deep.equal(expectedBalances);
      });
      it("Mints without expiry above badgeType 256 (additional bitmaps)", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);

        const mintCount = 300; // 0-299
        const badgeTypes = arrayOfNums(mintCount);
        const expiries = arrayOfSingleNumber(mintCount, noExpiry); // valid expiry
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);

        const accounts = arrayOfSingleString(mintCount, liteWallet);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
        const expectedBalances = arrayOfSingleNumber(mintCount, 1);

        expect(balances).to.deep.equal(expectedBalances);
      });
      it.skip("emits TransferBatch event", async () => {
        const { badgeSet, forbes, liteWallet, realWallet, noExpiry, zeroAddress } = await loadFixture(fixtures.deploy);
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);

        const mintBatchCall = await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);

        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const callValues = arrayOfSingleNumber(10, 1);
        const { events } = await mintBatchCall.wait();

        const transferEvents = events?.filter((e) => e.event === "TransferBatch");
        expect(transferEvents).to.not.be.undefined;
        expect(events).to.not.be.undefined;
        transferEvents?.forEach((event) => {
          const operator = event.args?.operator;
          const from = event.args?.from;
          const ids = event.args?.ids;
          const to = event.args?.to;
          const returnValues = event.args?.values;
          expect(operator).to.equal(forbes.address);
          expect(from).to.equal(zeroAddress);
          expect(to).to.equal(liteWallet);
          expect(ids).to.deep.equal(tokenIds);
          expect(returnValues).to.deep.equal(callValues);
        });
      });
      it("TransferSingle events are correct", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        const mintBatchCall = await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        const { events } = await mintBatchCall.wait();

        const transferEvents = events?.filter((e) => e.event === "TransferSingle");

        expect(events).to.not.be.undefined;
        transferEvents?.forEach((event) => {
          const operator = event.args?.operator;
          const from = event.args?.from;
          const to = event.args?.to;
          const value = event.args?.value;
          expect(operator).to.equal(forbes.address);
          expect(from).to.equal(liteWallet);
          expect(to).to.equal(realWallet);
          expect(value).to.equal(1);
        });
      });
    });
    describe("failure", () => {
      it("Invalid expiry", async () => {
        const { badgeSet, forbes, liteWallet, invalidExpiry, validExpiry } = await loadFixture(fixtures.deploy);
        const ids = [1, 2];
        const expiries = [invalidExpiry, validExpiry];
        await expect(badgeSet.connect(forbes).mintBatch(liteWallet, ids, expiries)).to.be.reverted;
      });
      it("Token already owned", async () => {
        const { badgeSet, forbes, liteWallet, validExpiry } = await loadFixture(fixtures.deploy);
        const ids = [1, 2];
        const expiries = [validExpiry, validExpiry];
        await badgeSet.connect(forbes).mintBatch(liteWallet, ids, expiries);
        await expect(badgeSet.connect(forbes).mintBatch(liteWallet, ids, expiries)).to.be.reverted;
      });
      it("ERC1155Receiver not implemented", async () => {
        const { badgeSet, walletRegistry, forbes, validExpiry, errors } = await loadFixture(fixtures.deploy);
        const ids = [1, 2];
        const expiries = [validExpiry, validExpiry];
        await expect(badgeSet.connect(forbes).mintBatch(walletRegistry.address, ids, expiries)).to.be.revertedWithCustomError(
          badgeSet,
          errors.ERC1155ReceiverNotImplemented
        );
      });
    });
  });
  describe("revoke():", () => {
    describe("success", () => {
      it("Without expiry", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        await badgeSet.connect(forbes).revoke(liteWallet, badgeType);

        expect(await badgeSet.balanceOf(liteWallet, tokenId)).to.equal(0);
      });
      it("With expiry", async () => {
        const { badgeSet, forbes, liteWallet, validExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, validExpiry); // with expiry
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        await badgeSet.connect(forbes).revoke(liteWallet, badgeType);

        expect(await badgeSet.balanceOf(liteWallet, tokenId)).to.equal(0);
      });
      it("Above badgeType 256 (additional bitmaps)", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const maxBadgeType = 258;

        // mint tokens sequentially up to max
        for (let badgeType = 0; badgeType <= maxBadgeType; badgeType++) {
          await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        }
        const tokenId = await badgeSet.encodeTokenId(maxBadgeType, liteWallet);
        const balancePre = await badgeSet.balanceOf(liteWallet, tokenId);

        await badgeSet.connect(forbes).revoke(liteWallet, maxBadgeType);

        const balancePost = await badgeSet.balanceOf(liteWallet, tokenId);

        expect(balancePre).to.equal(1);
        expect(balancePost).to.equal(0);
      });
      it("Deletes expiry", async () => {
        const { badgeSet, forbes, liteWallet, validExpiry } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, validExpiry); // with expiry, should delete
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        await badgeSet.connect(forbes).revoke(liteWallet, badgeType);

        expect(await badgeSet.expiryOf(tokenId)).to.equal(0);
      });
      it("Emits a TransferSingle event", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry, zeroAddress } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await badgeSet.connect(forbes).mint(liteWallet, badgeType, noExpiry);
        const revokeCall = await badgeSet.connect(forbes).revoke(liteWallet, badgeType);
        const { events } = await revokeCall.wait();
        const transferSingleEvents = events?.filter((e) => e.event === "TransferSingle");

        expect(transferSingleEvents).to.not.be.undefined;
        expect(transferSingleEvents).to.have.length(1);
        transferSingleEvents?.forEach((event) => {
          const operator = event.args?.operator;
          const from = event.args?.from;
          const to = event.args?.to;
          const value = event.args?.value;
          expect(operator).to.equal(forbes.address);
          expect(from).to.equal(liteWallet);
          expect(to).to.equal(zeroAddress); // burning to zero address
          expect(value).to.equal(1);
        });
      });
    });
    describe("failure", () => {
      it("Not contract owner", async () => {
        const { badgeSet, user, liteWallet, errors } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await expect(badgeSet.connect(user).revoke(liteWallet, badgeType)).to.be.revertedWith(errors.NotOwner);
      });
      it("Token not owned", async () => {
        const { badgeSet, forbes, liteWallet, errors } = await loadFixture(fixtures.deploy);
        const badgeType = 0;

        await expect(badgeSet.connect(forbes).revoke(liteWallet, badgeType)).to.be.revertedWithCustomError(
          badgeSet,
          errors.IncorrectBalance
        );
      });
    });
  });
  describe("revokeBatch():", () => {
    describe("success", () => {
      it("Revokes without expiry", async () => {
        const { badgeSet, forbes, liteWallet, noExpiry } = await loadFixture(fixtures.deploy);

        const revokeCount = 10; // 0-9
        const badgeTypes = arrayOfNums(revokeCount);
        const expiries = arrayOfSingleNumber(revokeCount, noExpiry);

        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        await badgeSet.connect(forbes).revokeBatch(liteWallet, badgeTypes);

        const accounts = arrayOfSingleString(revokeCount, liteWallet);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const balances = await badgeSet.balanceOfBatch(accounts, tokenIds);
        const expectedBalances = arrayOfSingleNumber(revokeCount, 0);

        expect(balances).to.deep.equal(expectedBalances);
      });
      it("Deletes tokens' expiries", async () => {
        const { badgeSet, forbes, liteWallet, validExpiry } = await loadFixture(fixtures.deploy);

        const revokeCount = 10; // 0-9
        const badgeTypes = arrayOfNums(revokeCount);
        const expiries = arrayOfSingleNumber(revokeCount, validExpiry);
        const tokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));

        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        const expiriesBefore = await Promise.all(tokenIds.map((id) => badgeSet.expiryOf(id)));
        await badgeSet.connect(forbes).revokeBatch(liteWallet, badgeTypes);
        const expiriesAfter = await Promise.all(tokenIds.map((id) => badgeSet.expiryOf(id)));

        const arrayOfZeros = arrayOfSingleNumber(revokeCount, 0);

        expect(expiriesBefore).to.deep.equal(expiries);
        expect(expiriesAfter).to.deep.equal(arrayOfZeros);
      });
    });
    describe("failure", () => {
      it("Not owner", async () => {
        const { badgeSet, user, liteWallet, errors } = await loadFixture(fixtures.deploy);
        const revokeCount = 10; // 0-9
        const badgeTypes = arrayOfNums(revokeCount);

        await expect(badgeSet.connect(user).revokeBatch(liteWallet, badgeTypes)).to.be.revertedWith(errors.NotOwner);
      });
      it("Token not owned", async () => {
        const { badgeSet, forbes, liteWallet, errors } = await loadFixture(fixtures.deploy);
        const revokeCount = 10; // 0-9
        const badgeTypes = arrayOfNums(revokeCount);

        await expect(badgeSet.connect(forbes).revokeBatch(liteWallet, badgeTypes)).to.be.revertedWithCustomError(
          badgeSet,
          errors.IncorrectBalance
        );
      });
    });
  });
  describe("encodeTokenId():", () => {
    describe("success", () => {
      it("Encodes badgeType/address", async () => {
        const { badgeSet, liteWallet } = await loadFixture(fixtures.deploy);
        const badgeType = ethers.BigNumber.from(0);
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        const localTokenId = encodeTokenIdJs(badgeType, liteWallet);
        expect(tokenId).to.equal(localTokenId);
      });
    });
  });
  describe("decodeTokenId():", () => {
    describe("success", () => {
      it("Decodes tokenId into a badgeType/address", async () => {
        const { badgeSet, liteWallet } = await loadFixture(fixtures.deploy);
        const badgeType = ethers.BigNumber.from(0);
        const tokenId = await badgeSet.encodeTokenId(badgeType, liteWallet);
        const [decodedBadgeType, decodedLiteWallet] = await badgeSet.decodeTokenId(tokenId);
        expect(badgeType).to.equal(decodedBadgeType);
        expect(liteWallet).to.equal(decodedLiteWallet);
      });
    });
  });
  describe("moveUserTokensToWallet():", () => {
    describe("success", () => {
      it("transitions wallet", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);

        const tokenCount = 10; // 0-9
        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);

        const userAccounts = arrayOfSingleString(tokenCount, liteWallet);
        const userTokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const walletAccounts = arrayOfSingleString(tokenCount, realWallet);
        const walletTokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, realWallet)));

        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        await badgeSet.connect(forbes).moveUserTokensToWallet(liteWallet, realWallet);

        const result0 = arrayOfSingleNumber(tokenCount, 0);
        const result1 = arrayOfSingleNumber(tokenCount, 1);
        expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
        expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
      });
      it("transitions wallet for > 256 badgeType (multiple bitmaps)", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);

        const tokenCount = 258; // 0-257
        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);

        const userAccounts = arrayOfSingleString(tokenCount, liteWallet);
        const userTokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, liteWallet)));
        const walletAccounts = arrayOfSingleString(tokenCount, realWallet);
        const walletTokenIds = await Promise.all(badgeTypes.map((badgeType) => badgeSet.encodeTokenId(badgeType, realWallet)));

        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        await badgeSet.connect(forbes).moveUserTokensToWallet(liteWallet, realWallet);

        const result0 = arrayOfSingleNumber(tokenCount, 0);
        const result1 = arrayOfSingleNumber(tokenCount, 1);
        expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
        expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
      });
      it("emits correct number of events", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        const transitionWalletCall = await badgeSet.connect(forbes).moveUserTokensToWallet(liteWallet, realWallet);
        const { events } = await transitionWalletCall.wait();

        expect(events).to.not.be.undefined;
        expect(events).to.have.length(tokenCount + 1); // transition events + single transitionWallet() event
      });
      it("TransferSingle events are correct", async () => {
        const { badgeSet, walletRegistry, soulbound, forbes, liteWallet, realWallet, noExpiry } = await loadFixture(fixtures.deploy);
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        await walletRegistry.connect(soulbound).linkWallet(liteWallet, realWallet);
        const transitionWalletCall = await badgeSet.connect(forbes).moveUserTokensToWallet(liteWallet, realWallet);

        const { events } = await transitionWalletCall.wait();
        const transferEvents = events?.filter((e) => e.event === "TransferSingle");

        expect(events).to.not.be.undefined;
        transferEvents?.forEach((event) => {
          const operator = event.args?.operator;
          const from = event.args?.from;
          const to = event.args?.to;
          const value = event.args?.value;
          expect(operator).to.equal(forbes.address);
          expect(from).to.equal(liteWallet);
          expect(to).to.equal(realWallet);
          expect(value).to.equal(1);
        });
      });
    });
    describe("failure", () => {
      it("Wallet not linked", async () => {
        const { badgeSet, forbes, liteWallet, realWallet, noExpiry, errors } = await loadFixture(fixtures.deploy);
        const tokenCount = 10; // 0-9

        const badgeTypes = arrayOfNums(tokenCount);
        const expiries = arrayOfSingleNumber(tokenCount, noExpiry);
        await badgeSet.connect(forbes).mintBatch(liteWallet, badgeTypes, expiries);
        await expect(badgeSet.connect(forbes).moveUserTokensToWallet(liteWallet, realWallet)).to.be.revertedWithCustomError(
          badgeSet,
          errors.WalletNotLinked
        );
      });
    });
  });
  describe("ERC1155 No Ops - Expected Revert:", () => {
    describe("failure", () => {
      it("setApprovalForAll()", async () => {
        const { badgeSet, user, errors } = await loadFixture(fixtures.deploy);
        await expect(badgeSet.setApprovalForAll(user.address, true)).to.be.revertedWithCustomError(
          badgeSet,
          errors.SoulboundTokenNoSetApprovalForAll
        );
      });
      it("isApprovedForAll()", async () => {
        const { badgeSet, soulbound, user, errors } = await loadFixture(fixtures.deploy);
        await expect(badgeSet.isApprovedForAll(soulbound.address, user.address)).to.be.revertedWithCustomError(
          badgeSet,
          errors.SoulboundTokenNoIsApprovedForAll
        );
      });
      it("safeTransferFrom()", async () => {
        const { badgeSet, soulbound, user, errors } = await loadFixture(fixtures.deploy);
        const from = soulbound.address;
        const to = user.address;
        const id = 1;
        const amount = 1;
        const data = ethers.utils.arrayify("0x00");
        await expect(badgeSet.safeTransferFrom(from, to, id, amount, data)).to.be.revertedWithCustomError(
          badgeSet,
          errors.SoulboundTokenNoSafeTransferFrom
        );
      });
      it("safeBatchTransferFrom()", async () => {
        const { badgeSet, soulbound, user, errors } = await loadFixture(fixtures.deploy);
        const from = soulbound.address;
        const to = user.address;
        const ids = [1, 50, 100];
        const amounts = [1, 1, 1];
        const data = ethers.utils.arrayify("0x00");
        await expect(badgeSet.safeBatchTransferFrom(from, to, ids, amounts, data)).to.be.revertedWithCustomError(
          badgeSet,
          errors.SoulboundTokenNoSafeBatchTransferFrom
        );
      });
    });
  });
});
