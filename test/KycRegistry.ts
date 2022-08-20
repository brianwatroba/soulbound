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
    it("Sets correct owner", async () => {
      const { kycRegistry, soulbound } = await loadFixture(fixtures.deploy);
      expect(await kycRegistry.owner()).to.equal(soulbound.address);
    });
  });
  describe("kycToUserAddress()", () => {
    it("should convert KYC to the correct userAddress", async () => {
      const { kycRegistry, soulbound, userKycDetails } = await loadFixture(fixtures.deploy);
      const { firstName, lastName, dob, phoneNumber } = userKycDetails;
      const firstNameBytes = ethers.utils.formatBytes32String(firstName);
      const lastNameBytes = ethers.utils.formatBytes32String(lastName);
      const dobBN = ethers.BigNumber.from(dob);
      const phoneNumberBN = ethers.BigNumber.from(phoneNumber);
      const userAddress = await kycRegistry.kycToUserAddress(
        firstNameBytes,
        lastNameBytes,
        dobBN,
        phoneNumberBN
      );

      const hash = ethers.utils.solidityKeccak256(
        ["bytes32", "bytes32", "uint256", "uint256"],
        [firstNameBytes, lastNameBytes, dobBN, phoneNumberBN]
      );

      const reHash = ethers.utils.solidityKeccak256(["bytes32"], [hash]);

      const testAddress = ethers.utils.computeAddress(reHash);
      console.log("hash", hash);
      console.log("contractHash", userAddress);

      expect(userAddress).to.be.properAddress;
      expect(testAddress).to.be.properAddress;
      expect(userAddress).to.equal(testAddress);
    });
  });
  describe("linkWallet()", () => {
    it("should link wallet to kycRegistry", async () => {
      // const { kycRegistry, user, soulbound, userKycDetails } = await loadFixture(fixtures.deploy);
      // await kycRegistry.connect(soulbound).linkWallet(user.address, userKycDetails);
    });
  });
});
