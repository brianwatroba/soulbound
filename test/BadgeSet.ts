import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";

// TODO: more elegant import for fixtures

describe("BadgeSet.sol", () => {
  describe("Deployment", () => {
    it("Deploys", async () => {
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
    it("Transfers ownership", async () => {
      const { badgeSet, forbes } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.owner()).to.equal(forbes.address);
    });
  });

  describe("uri", () => {
    it("Returns URI for tokenId", async () => {
      const { badgeSet, uri } = await loadFixture(fixtures.deploy);
      expect(await badgeSet.uri(1)).to.equal(uri + "1");
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
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      badgeSet.connect(forbes).mint(userAddress, 1, 0);
      const tokenId = await badgeSet.encodeTokenId(1, userAddress);
      const balance = await badgeSet.balanceOf(userAddress, tokenId);
      expect(balance).to.equal(1);
    });
    it("Mints without expiry above tokenType 256", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      badgeSet.connect(forbes).mint(userAddress, 300, 0);
      const tokenId = await badgeSet.encodeTokenId(300, userAddress);
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
    it("Reverts: token already owned", async () => {
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).mint(userAddress, 1, 0);
      await expect(badgeSet.connect(forbes).mint(userAddress, 1, 0)).to.be.reverted;
    });
  });

  describe("mintBatch()", () => {
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
      const { badgeSet, forbes, userAddress, invalidExpiry, validExpiry } = await loadFixture(
        fixtures.deploy
      );
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
      const { badgeSet, forbes, userAddress } = await loadFixture(fixtures.deploy);
      await badgeSet.connect(forbes).mint(userAddress, 1, 0);
      await badgeSet.connect(forbes).mint(userAddress, 2, 0);
      await badgeSet.connect(forbes).revokeBatch(userAddress, [1, 2]);
      const tokenId1 = await badgeSet.encodeTokenId(1, userAddress);
      const tokenId2 = await badgeSet.encodeTokenId(2, userAddress);
      expect(await badgeSet.balanceOf(userAddress, tokenId1)).to.equal(0);
      expect(await badgeSet.balanceOf(userAddress, tokenId2)).to.equal(0);
      // TODO: test expiry
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

  describe("transitionWallet()", () => {
    it("transitions wallet", async () => {
      const { badgeSet, forbes, userAddress, walletAddress } = await loadFixture(fixtures.deploy);
      const ids = [1, 2, 3, 20, 100, 350, 100000];
      const expiries = ids.map(() => 0);
      await badgeSet.connect(forbes).mintBatch(userAddress, ids, expiries);
      await badgeSet.connect(forbes).transitionWallet(userAddress, walletAddress);
      const userAccounts = ids.map(() => userAddress);
      const userTokenIds = await Promise.all(
        ids.map((id) => badgeSet.encodeTokenId(id, userAddress))
      );
      const walletAccounts = ids.map(() => walletAddress);
      const walletTokenIds = await Promise.all(
        ids.map((id) => badgeSet.encodeTokenId(id, walletAddress))
      );
      const result0 = ids.map(() => ethers.BigNumber.from(0));
      const result1 = ids.map(() => ethers.BigNumber.from(1));
      expect(await badgeSet.balanceOfBatch(walletAccounts, walletTokenIds)).to.deep.equal(result1);
      expect(await badgeSet.balanceOfBatch(userAccounts, userTokenIds)).to.deep.equal(result0);
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
