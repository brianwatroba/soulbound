import { ethers } from "hardhat";

const provider = ethers.getDefaultProvider();

const uri = "https://ipsai94oog.execute-api.us-east-1.amazonaws.com/badgeMetadata/";
const contractUri = "https://ipsai94oog.execute-api.us-east-1.amazonaws.com/contractMetadata/";

const userKycDetails = {
  firstName: "john",
  lastName: "smith",
  dob: 12121989,
  phoneNumber: 16461111,
};

const userAddress = "0x64443F9CDBc6b3f12AD0c81083dde302d85Ef81E";
const walletAddress = "0x20A3d0288B393dF8901BB6415C6Ac538F17B94fE";

export const deploy = async () => {
  const [soulbound, forbes, padi, user] = await ethers.getSigners();
  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(soulbound).deploy()).deployed();

  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await (await KycRegistry.connect(soulbound).deploy()).deployed();

  await badgeSetFactory
    .connect(soulbound)
    .createBadgeSet(forbes.address, kycRegistry.address, uri, contractUri);
  const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
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
    uri,
    contractUri,
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
