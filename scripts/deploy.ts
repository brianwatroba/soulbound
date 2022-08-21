import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const rinkebyKey = process.env.RINKEBY_KEY || "";
  const provider = new ethers.providers.AlchemyProvider("rinkeby", rinkebyKey);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);

  const uri = "https://ipsai94oog.execute-api.us-east-1.amazonaws.com/badgeMetadata/";

  // const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  // const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy()).deployed();
  // console.log("BadgeSetFactory deployed to:", badgeSetFactory.address);

  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await KycRegistry.connect(signer).deploy();
  await kycRegistry.deployed();
  console.log("KycRegistry deployed to: ", kycRegistry.address);

  // await badgeSetFactory.connect(signer).createBadgeSet(signer.address, kycRegistry.address, uri);
  // const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
  const BadgeSet = await ethers.getContractFactory("BadgeSet");
  const badgeSet = await BadgeSet.connect(signer).deploy(signer.address, kycRegistry.address, uri);
  await badgeSet.deployed();

  console.log("Badgeset deployed to: ", badgeSet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
