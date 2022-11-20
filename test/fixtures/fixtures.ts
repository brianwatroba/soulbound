import { ethers } from "hardhat";
import { errors, userInfo, baseUri, liteWallet, realWallet, zeroAddress, expiries } from "./constants";

export const deploy = async () => {
  const [soulbound, forbes, padi, user] = await ethers.getSigners();

  const WalletRegistry = await ethers.getContractFactory("WalletRegistry");
  const walletRegistry = await (await WalletRegistry.connect(soulbound).deploy()).deployed();

  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(soulbound).deploy(walletRegistry.address)).deployed();

  await badgeSetFactory.connect(soulbound).createBadgeSet(forbes.address, baseUri);
  await badgeSetFactory.connect(soulbound).createBadgeSet(padi.address, baseUri);
  const [badgeSetAddress, badgeSetAddress2] = await badgeSetFactory.badgeSets();
  const badgeSet = await ethers.getContractAt("BadgeSet", badgeSetAddress);
  const badgeSet2 = await ethers.getContractAt("BadgeSet", badgeSetAddress2);

  return {
    badgeSetFactory,
    badgeSet,
    badgeSet2,
    walletRegistry,
    soulbound,
    forbes,
    padi,
    baseUri,
    user,
    userInfo,
    liteWallet,
    realWallet,
    zeroAddress,
    errors,
    ...expiries,
  };
};

export default { deploy };
