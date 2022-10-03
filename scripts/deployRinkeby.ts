import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Deploying to Rinkeby");
  const rinkebyKey = process.env.POLYGON_MUMBAI_KEY || "";
  const provider = new ethers.providers.AlchemyProvider("maticmum", rinkebyKey);
  const signer = new ethers.Wallet(process.env.RINKEBY_PRIVATE_KEY ?? "", provider);

  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await KycRegistry.connect(signer).deploy();
  await kycRegistry.deployed();
  console.log("KycRegistry deployed to: ", kycRegistry.address);

  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy(kycRegistry.address)).deployed();
  console.log("BadgeSetFactory deployed to:", badgeSetFactory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
