import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import * as fixtures from "./fixtures/fixtures";

// TODO: more elegant import for fixtures

const encodeTokenIdJs = (tokenType: BigNumber, address: string) => {
  const packed = ethers.utils.solidityPack(["uint96", "address"], [tokenType, address]);
  return packed;
};

const randomIntFromInterval = (min: number, max: number) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const arrayOfSingleNumber = (length: number, number: number) => {
  return Array.from({ length }, () => number);
};

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

  describe.only("mint()", () => {
    it("Mints without expiry", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      const tokenType = 1;

      badgeSet.connect(forbes).mint(userAddress, tokenType, 0);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);
      expect(balance).to.equal(1);
    });
    it("Mints without expiry above tokenType 256", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      const tokenType = randomIntFromInterval(257, 100000);
      badgeSet.connect(forbes).mint(userAddress, tokenType, 0);
      const tokenId = await badgeSet.encodeTokenId(tokenType, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);
      expect(balance).to.equal(1);
    });
    it("Mints with expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).mint(userAddress, 1, validExpiry);
      const tokenId = await badgeSet.encodeTokenId(1, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);
      expect(balance).to.equal(1);
    });

    it("Reverts: not owner", async () => {
      const { badgeSet, user, userAddress, invalidExpiry } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(user).mint(userAddress, 1, invalidExpiry)).to.be.reverted;
    });
    it("Reverts: invalid expiry", async () => {
      const { badgeSet, forbes, userAddress, invalidExpiry } = await loadFixture(fixtures.deploy);
      await expect(badgeSet.connect(forbes).mint(userAddress, 1, invalidExpiry)).to.be.reverted;
    });
    it("Reverts: token type already owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      const tokenType = randomIntFromInterval(1, 9999);
      await badgeSet.connect(forbes).mint(userAddress, tokenType, 0);
      await expect(badgeSet.connect(forbes).mint(userAddress, tokenType, 0)).to.be.reverted;
    });
  });

  describe.only("mintBatch()", () => {
    it("Mints without expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const ids = [1, 2];
      const expiries = [0, 0];
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      const tokenId1 = await badgeSet.encodeTokenId(1, userAddress);
      const tokenId2 = await badgeSet.encodeTokenId(2, userAddress);
      expect(await badgeSet.balanceOf(userAddress, tokenId1)).to.equal(1);
      expect(await badgeSet.balanceOf(userAddress, tokenId2)).to.equal(1);
    });
    it("Mints with expiry", async () => {
      const { badgeSet, forbes, userAddress, validExpiry } = await loadFixture(fixtures.deploy);
      const ids = [1, 2];
      const expiries = [validExpiry, validExpiry];
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      const tokenId1 = await badgeSet.encodeTokenId(1, userAddress);
      const tokenId2 = await badgeSet.encodeTokenId(2, userAddress);
      expect(await badgeSet.balanceOf(userAddress, tokenId1)).to.equal(1);
      expect(await badgeSet.balanceOf(userAddress, tokenId2)).to.equal(1);
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
  });

  describe.only("revoke()", () => {
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

  describe("transitionWallet()", () => {
    it("transitions wallet", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);

      const ids = [1, 2, 3, 20, 100, 350, 10000];
      const expiries = ids.map(() => 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      // it passes because once we link them, we look up balance at end, and it returns
      await badgeSet.connect(forbes).transitionWallet(userAddress, walletAddress);
      const userAccounts = ids.map(() => userAddress);
      const userTokenIds = await Promise.all(ids.map((id) => badgeSet.encodeTokenId(id, userAddress)));
      const walletAccounts = ids.map(() => walletAddress);
      const walletTokenIds = await Promise.all(ids.map((id) => badgeSet.encodeTokenId(id, walletAddress)));
      const result0 = ids.map(() => ethers.BigNumber.from(0));
      const result1 = ids.map(() => ethers.BigNumber.from(1));
      expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
      expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
    });
    it("emits events", async () => {
      const { badgeSet, kycRegistry, soulbound, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);

      const ids = [1, 2, 3, 20, 100, 350, 550, 1000];
      const expiries = ids.map(() => 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await kycRegistry.connect(soulbound).linkWallet(userAddress, walletAddress);
      const transitionWalletCall = await badgeSet.connect(forbes).transitionWallet(userAddress, walletAddress);
      const { events } = await transitionWalletCall.wait();
      expect(events).to.not.be.undefined;
      expect(events).to.have.length(ids.length + 1);
    });
    // reverts if one not owned
    // reverts if no claimed address
    // it("Reverts: not owner", async () => {
    //   const { badgeSet, user, userAddress } = await loadFixture(fixtures.deploy);
    //   await expect(badgeSet.connect(user).revokeBatch(userAddress, [1, 2])).to.be.reverted;
    // });
    // it("Reverts: token not owned", async () => {
    //   const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
    //   await expect(badgeSet.connect(forbes).revokeBatch(userAddress, [1, 2])).to.be.reverted;
    // });
  });
});
