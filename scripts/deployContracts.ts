import hre, { ethers } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import * as dotenv from "dotenv";
dotenv.config();

const metadataUri = "https://soulbound-api-test.herokuapp.com/metadata/";

const deployContracts = async () => {
  const network = hre.network.config as HttpNetworkConfig;
  const [privateKey] = network.accounts as string[];
  const provider = new ethers.providers.JsonRpcProvider(network.url);
  const signer = new ethers.Wallet(privateKey, provider);
  const gasConfig = {
    maxFeePerGas: ethers.BigNumber.from("200000000000"),
    maxPriorityFeePerGas: ethers.BigNumber.from("200000000000"),
  };

  console.log(`STARTING SOULBOUND DEPLOYMENT TO: ${hre.network.name} | DEPLOYER: ${signer.address}`);
  console.log("___________________________");
  console.log("Deploying: WalletRegistry...");
  const WalletRegistry = await ethers.getContractFactory("WalletRegistry");
  const walletRegistry = await WalletRegistry.connect(signer).deploy(gasConfig);
  await walletRegistry.deployed();
  console.log("SUCCESS: WalletRegistry deployed to: ", walletRegistry.address);
  console.log("___________________________");
  console.log("Deploying: BadgeSetFactory...");
  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(signer).deploy(walletRegistry.address, gasConfig)).deployed();
  console.log("SUCCESS: BadgeSetFactory deployed to:", badgeSetFactory.address);
  console.log("___________________________");
  console.log("Deploying: Creating Northern Michigan Athletic Club...");
  const nmaa = await badgeSetFactory.connect(signer).createBadgeSet(signer.address, metadataUri, gasConfig);
  await nmaa.wait();
  const nmaaAddress = (await badgeSetFactory.badgeSets())[0];
  console.log("SUCCESS: Northern Michigan Athetlic Club deployed to: ", nmaaAddress);
  console.log("___________________________");
  console.log("Deploying: Creating TC Dive...");
  const tcDive = await badgeSetFactory.connect(signer).createBadgeSet(signer.address, metadataUri, gasConfig);
  await tcDive.wait();
  const tcDiveAddress = (await badgeSetFactory.badgeSets())[1];
  console.log("SUCCESS: TC Dive deployed to: ", tcDiveAddress);
  console.log("___________________________");
  console.log("Verifying WalletRegistry...");
  await hre.run("verify:verify", {
    address: walletRegistry.address,
    constructorArguments: [],
  });
  console.log("SUCCESS: WalletRegistry verified");
  console.log("___________________________");
  console.log("Verifying BadgeSetFactory...");
  await hre.run("verify:verify", {
    address: badgeSetFactory.address,
    constructorArguments: [walletRegistry.address],
  });
  console.log("SUCCESS: BadgeSetFactory verified");
  console.log("___________________________");
  console.log("Verifying Northern Michigan Athletic Club...");
  await hre.run("verify:verify", {
    address: nmaaAddress,
    constructorArguments: [signer.address, walletRegistry.address, metadataUri],
  });
  console.log("SUCCESS: Northern Michigan Athletic Club verified");
  console.log("___________________________");
  console.log("Verifying TCDive...");
  await hre.run("verify:verify", {
    address: tcDiveAddress,
    constructorArguments: [signer.address, walletRegistry.address, metadataUri],
  });
  console.log("SUCCESS: TC Dive verified");
  console.log("___________________________");
  console.log("DEPLOYMENT SUCCESSFUL");
};

deployContracts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
