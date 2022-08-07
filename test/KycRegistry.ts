import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fixtures from "./fixtures/fixtures";

describe("KycRegistry.sol", function () {
  describe("Deployment", function () {
    it("Deploys successfully", async () => {
      const { kycRegistry } = await loadFixture(fixtures.deploy);
      expect(kycRegistry.address).to.be.properAddress;
    });
    // it("Sets organization owner", async () => {
    //   const { badgeSet, forbes } = await loadFixture(deployBadgeSetFixture);
    //   expect(await badgeSet.owner()).to.equal(forbes.address);
    // });
    // it("Sets URI", async () => {
    //   const { badgeSet, uri } = await loadFixture(deployBadgeSetFixture);
    //   expect(await badgeSet.uri(1)).to.equal(uri + "1");
    // });
  });
});
