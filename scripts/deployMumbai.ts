import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const polygonMumbaiKey = process.env.POLYGON_MUMBAI_KEY || "";
  const provider = new ethers.providers.AlchemyProvider("maticmum", polygonMumbaiKey);
  const signer = new ethers.Wallet(process.env.POLYGON_MUMBAI_PRIVATE_KEY ?? "", provider);

  // const uri = "https://soulbound-api-test.herokuapp.com/api/token/";
  // const contractUri = "https://soulbound-api-test.herokuapp.com/api/contract/";

  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await KycRegistry.connect(signer)
    .deploy
    //   {
    //   gasPrice: 60000000000,
    // }
    ();
  await kycRegistry.deployed();
  console.log("KycRegistry deployed to: ", kycRegistry.address);

  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy(kycRegistry.address)).deployed();
  console.log("BadgeSetFactory deployed to:", badgeSetFactory.address);

  // await badgeSetFactory.connect(signer).createBadgeSet(signer.address, kycRegistry.address, uri);
  // const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
  // const BadgeSet = await ethers.getContractFactory("BadgeSet");
  // const badgeSet = await BadgeSet.connect(signer).deploy(
  //   signer.address,
  //   "0x9517955157F2DA793FB5d4A7396c0021F8b39D19", // fake KYC?
  //   uri,
  //   contractUri,
  //   {
  //     gasPrice: 60000000000,
  //   }
  // );
  // await badgeSet.deployed();
  // console.log("Badgeset deployed to: ", badgeSet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
