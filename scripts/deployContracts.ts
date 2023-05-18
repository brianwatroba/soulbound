import hre, { ethers } from "hardhat";
import { HardhatUserConfig } from "hardhat/types";
import * as dotenv from "dotenv";
dotenv.config();

const metadataUri = "https://soulbound-api-test.herokuapp.com/metadata/";
// TODO how to dynamically access object from the network (etherscan URI, apy key, RPC url) from script

const deployContracts = async () => {
  // const network = await hre.ethers.provider.getNetwork();
  // console
  // const networkName = hre.network.name;
  // const networkConfig = hre.config.networks[networkName];
  // console.log("provider", hre.network.provider);
  // const {accounts, url} = networkConfig;
  // const provider = new ethers.providers.JsonRpcProvider(network.config.url);
  // const polygonAPIKey = process.env.POLYGON_MAINNET_KEY || "";
  // const provider = new ethers.providers.AlchemyProvider("matic", polygonAPIKey);
  // const signer = new ethers.Wallet(process.env.POLYGON_PRIVATE_KEY ?? "", provider);
  // const gasConfig = {
  //   maxFeePerGas: ethers.BigNumber.from("200000000000"),
  //   maxPriorityFeePerGas: ethers.BigNumber.from("200000000000"),
  // };
  // console.log(`STARTING SOULBOUND DEPLOYMENT TO: POLYGON MAINNET | DEPLOYER: ${signer.address}`);
  // console.log("___________________________");
  // console.log("Deploying: KycRegistry...");
  // const KycRegistry = await ethers.getContractFactory("KycRegistry");
  // const kycRegistry = await KycRegistry.connect(signer).deploy(gasConfig);
  // await kycRegistry.deployed();
  // console.log("SUCCESS: KycRegistry deployed to: ", kycRegistry.address);
  // console.log("___________________________");
  // console.log("Deploying: BadgeSetFactory...");
  // const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  // const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy(kycRegistry.address, gasConfig)).deployed();
  // console.log("SUCCESS: BadgeSetFactory deployed to:", badgeSetFactory.address);
  // console.log("___________________________");
  // console.log("Deploying: Creating Northern Michigan Athletic Club...");
  // const nmaa = await badgeSetFactory.connect(signer).createBadgeSet(signer.address, metadataUri, gasConfig);
  // await nmaa.wait();
  // const nmaaAddress = (await badgeSetFactory.badgeSets())[0];
  // console.log("SUCCESS: Northern Michigan Athetlic Club deployed to: ", nmaaAddress);
  // console.log("___________________________");
  // console.log("Deploying: Creating TC Dive...");
  // const tcDive = await badgeSetFactory.connect(signer).createBadgeSet(signer.address, metadataUri, gasConfig);
  // await tcDive.wait();
  // const tcDiveAddress = (await badgeSetFactory.badgeSets())[1];
  // console.log("SUCCESS: TC Dive deployed to: ", tcDiveAddress);
  // console.log("___________________________");
  // console.log("Verifying KycRegistry...");
  // await hre.run("verify:verify", {
  //   address: kycRegistry.address,
  //   constructorArguments: [],
  // });
  // console.log("SUCCESS: KycRegistry verified");
  // console.log("___________________________");
  // console.log("Verifying BadgeSetFactory...");
  // await hre.run("verify:verify", {
  //   address: badgeSetFactory.address,
  //   constructorArguments: [kycRegistry.address],
  // });
  // console.log("SUCCESS: BadgeSetFactory verified");
  // console.log("___________________________");
  // console.log("Verifying Northern Michigan Athletic Club...");
  // await hre.run("verify:verify", {
  //   address: nmaaAddress,
  //   constructorArguments: [signer.address, kycRegistry.address, metadataUri],
  // });
  // console.log("SUCCESS: Northern Michigan Athletic Club verified");
  // console.log("___________________________");
  // console.log("Verifying TCDive...");
  // await hre.run("verify:verify", {
  //   address: tcDiveAddress,
  //   constructorArguments: [signer.address, kycRegistry.address, metadataUri],
  // });
  // console.log("SUCCESS: TC Dive verified");
  // console.log("___________________________");
  // console.log("DEPLOYMENT SUCCESSFUL");
};

deployContracts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
