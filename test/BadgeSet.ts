import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BadgeSet.sol", function () {
  async function deployBadgeSetFixture() {
    const [soulbound, forbes, padi] = await ethers.getSigners();
    const BadgeSet = await ethers.getContractFactory("BadgeSet");
    const badgeSet = await BadgeSet.deploy(forbes.address, "https://www.soulboundapi.com/");
    const kyc = {
      firstName: "john",
      lastName: "smith",
      dob: 12121989,
      phoneNumber: 16461111,
    };
    return { badgeSet, soulbound, forbes, padi, kyc };
  }

  describe("Deployment", function () {
    it("Should set the organization owner", async () => {
      const { badgeSet, forbes } = await loadFixture(deployBadgeSetFixture);
      expect(await badgeSet.owner()).to.equal(forbes.address);
    });
  });

  describe("View functions", function () {
    it("hashKyc(): should hash kyc correctly", async () => {
      const { badgeSet, kyc } = await loadFixture(deployBadgeSetFixture);
      const { firstName, lastName, dob, phoneNumber } = kyc;

      const firstNameBytes = ethers.utils.formatBytes32String(firstName);
      const lastNameBytes = ethers.utils.formatBytes32String(lastName);

      const kycHash = await badgeSet.hashKyc(firstNameBytes, lastNameBytes, dob, phoneNumber);
      const localHash = ethers.utils.solidityKeccak256(
        ["bytes32", "bytes32", "uint256", "uint256"],
        [firstNameBytes, lastNameBytes, dob, phoneNumber]
      );
      expect(kycHash).to.equal(localHash);
    });
    it("kycHashToAddress(): should return address correctly", async () => {
      const { badgeSet, kyc } = await loadFixture(deployBadgeSetFixture);
      const { firstName, lastName, dob, phoneNumber } = kyc;

      const firstNameBytes = ethers.utils.formatBytes32String(firstName);
      const lastNameBytes = ethers.utils.formatBytes32String(lastName);

      const kycHash = await badgeSet.hashKyc(firstNameBytes, lastNameBytes, dob, phoneNumber);
      const kycAddress = await badgeSet.kycHashToAddress(kycHash);
      expect(kycAddress).to.be.properAddress;
    });
  });
});
