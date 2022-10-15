import { Provider } from "@ethersproject/abstract-provider";
import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const polygonMumbaiKey = process.env.POLYGON_MUMBAI_KEY || "";
  const provider = new ethers.providers.AlchemyProvider("maticmum", polygonMumbaiKey);
  const signer = new ethers.Wallet(process.env.POLYGON_MUMBAI_PRIVATE_KEY ?? "", provider);

  const uri = "https://soulbound-api-test.herokuapp.com/metadata/";
  const contractUri = "https://soulbound-api-test.herokuapp.com/metadata/";

  console.log(`STARTING SOULBOUND DEPLOYMENT TO: POLYGON MUMBAI | DEPLOYER: ${signer.address}`);
  console.log("___________________________");

  console.log("Deploying: KycRegistry...");
  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await KycRegistry.connect(signer)
    .deploy
    //   {
    //   gasPrice: 60000000000,
    // }
    ();
  await kycRegistry.deployed();
  console.log("SUCCESS: KycRegistry deployed to: ", kycRegistry.address);
  console.log("___________________________");

  console.log("Deploying: BadgeSetFactory...");
  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy(kycRegistry.address)).deployed();
  console.log("SUCCESS: BadgeSetFactory deployed to:", badgeSetFactory.address);
  console.log("___________________________");

  console.log("Deploying: Creating Northern Michigan Athletic Club...");
  const nmaa = await badgeSetFactory.connect(signer).createBadgeSet(signer.address, uri);
  await nmaa.wait();
  const nmaaAddress = (await badgeSetFactory.badgeSets())[0];

  console.log("SUCCESS: Northern Michigan Athetlic Club deployed to: ", nmaaAddress);
  console.log("___________________________");

  console.log("Deploying: Creating TC Dive...");
  const tcDive = await badgeSetFactory.connect(signer).createBadgeSet(signer.address, uri);
  await tcDive.wait();
  const tcDiveAddress = (await badgeSetFactory.badgeSets())[1];

  console.log("SUCCESS: TC Dive deployed to: ", tcDiveAddress);
  console.log("___________________________");

  console.log("Verifying KycRegistry...");
  await hre.run("verify:verify", {
    address: kycRegistry.address,
    constructorArguments: [],
  });
  console.log("SUCCESS: KycRegistry verified");
  console.log("___________________________");

  console.log("Verifying BadgeSetFactory...");
  await hre.run("verify:verify", {
    address: badgeSetFactory.address,
    constructorArguments: [kycRegistry.address],
  });
  console.log("SUCCESS: BadgeSetFactory verified");
  console.log("___________________________");

  console.log("Verifying Northern Michigan Athletic Club...");
  await hre.run("verify:verify", {
    address: nmaaAddress,
    constructorArguments: [signer.address, kycRegistry.address, uri],
  });
  console.log("SUCCESS: Northern Michigan Athletic Club verified");
  console.log("___________________________");

  console.log("Verifying TCDive...");
  await hre.run("verify:verify", {
    address: tcDiveAddress,
    constructorArguments: [signer.address, kycRegistry.address, uri],
  });
  console.log("SUCCESS: TC Dive verified");
  console.log("___________________________");

  console.log("DEPLOYMENT SUCCESSFUL");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
