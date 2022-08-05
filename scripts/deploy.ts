import { Provider } from "@ethersproject/abstract-provider";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = ethers.getDefaultProvider();
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);

  const BadgeSet = await ethers.getContractFactory("BadgeSet");
  const badgeSet = await BadgeSet.deploy(signer.address, "https://www.soulboundapi.com/");
  await badgeSet.deployed();

  console.log("Contract deployed to:", badgeSet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
