import { ethers } from "hardhat";

const provider = ethers.getDefaultProvider();
const baseUri = "https://soulbound-api-test.herokuapp.com/metadata/";

const userKycDetails = {
  firstName: "john",
  lastName: "doe",
  phoneNumber: 8105555555,
};

const userAddress = "0x64443F9CDBc6b3f12AD0c81083dde302d85Ef81E";
const walletAddress = "0x20A3d0288B393dF8901BB6415C6Ac538F17B94fE";

export const deploy = async () => {
  const [soulbound, forbes, user] = await ethers.getSigners();

  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await (await KycRegistry.connect(soulbound).deploy()).deployed();

  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(soulbound).deploy(kycRegistry.address)).deployed();

  await badgeSetFactory.connect(soulbound).createBadgeSet(forbes.address, baseUri);
  const [badgeSetAddress] = await badgeSetFactory.badgeSets();
  const badgeSet = await ethers.getContractAt("BadgeSet", badgeSetAddress);

  const blockTimestamp = (await provider.getBlock("latest")).timestamp;
  const validExpiry = blockTimestamp + 60 * 60 * 24 * 365; // 1 year ahead
  const invalidExpiry = blockTimestamp - 60 * 60 * 24 * 365; // 1 year ago

  return {
    badgeSetFactory,
    badgeSet,
    kycRegistry,
    soulbound,
    forbes,
    baseUri,
    user,
    userKycDetails,
    userAddress,
    walletAddress,
    blockTimestamp,
    validExpiry,
    invalidExpiry,
  };
};

export default { deploy };
