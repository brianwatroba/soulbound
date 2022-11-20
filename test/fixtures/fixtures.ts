import { ethers } from "hardhat";

const provider = ethers.getDefaultProvider();
const baseUri = "https://soulbound-api-test.herokuapp.com/metadata/";

const userInfo = {
  firstName: "john",
  lastName: "doe",
  phoneNumber: 8105555555,
};

const addresses = {
  user: "0x64443F9CDBc6b3f12AD0c81083dde302d85Ef81E",
  wallet: "0x20A3d0288B393dF8901BB6415C6Ac538F17B94fE",
  zero: "0x0000000000000000000000000000000000000000",
};

const errors = {
  notOwner: "Ownable: caller is not the owner",
};

const userAddress = "0x64443F9CDBc6b3f12AD0c81083dde302d85Ef81E";
const walletAddress = "0x20A3d0288B393dF8901BB6415C6Ac538F17B94fE";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const NotOwnerError = "Ownable: caller is not the owner";

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

  const blockTimestamp = (await provider.getBlock("latest")).timestamp;
  const noExpiry = 0;
  const validExpiry = blockTimestamp + 60 * 60 * 24 * 365; // 1 year ahead
  const invalidExpiry = blockTimestamp - 60 * 60 * 24 * 365; // 1 year ago

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
    userAddress,
    walletAddress,
    zeroAddress,
    noExpiry,
    validExpiry,
    invalidExpiry,
    NotOwnerError,
    errors,
  };
};

export default { deploy };
