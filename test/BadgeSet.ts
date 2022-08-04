import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BadgeSet.sol", function () {
  async function deployBadgeSetFixture() {
    const [soulbound, forbes, padi] = await ethers.getSigners();
    const BadgeSet = await ethers.getContractFactory("BadgeSet");
    const badgeSet = await BadgeSet.deploy(forbes.address);
    return { badgeSet, soulbound, forbes, padi };
  }

  describe("Deployment", function () {
    it("Should set the organization owner", async () => {
      const { badgeSet, forbes } = await loadFixture(deployBadgeSetFixture);
      expect(await badgeSet.owner()).to.equal(forbes.address);
    });
  });
});
