import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = ethers.getDefaultProvider();
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);

  const uri = "https://ipsai94oog.execute-api.us-east-1.amazonaws.com/badgeMetadata/";

  // const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  // const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy()).deployed();

  // const KycRegistry = await ethers.getContractFactory("KycRegistry");
  // const kycRegistry = await KycRegistry.connect(signer).deploy();
  // await kycRegistry.deployed();

  // await badgeSetFactory.connect(signer).createBadgeSet(signer.address, kycRegistry.address, uri);
  // const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
  const BadgeSet = await ethers.getContractFactory("BadgeSet");
  const badgeSet = await (
    await BadgeSet.connect(signer).deploy(signer.address, signer.address, uri)
  ).deployed();

  // console.log("BadgeSetFactory deployed to:", badgeSetFactory.address);
  // console.log("KYC contract deployed to: ", kycRegistry.address);
  console.log("Badgeset deployed to: ", badgeSet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
