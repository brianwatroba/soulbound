import { ethers } from "hardhat";

const uri = "https://www.soulboundapi.com/";

const userKycDetails = {
  firstName: "john",
  lastName: "smith",
  dob: 12121989,
  phoneNumber: 16461111,
};

export const deploy = async () => {
  const [soulbound, forbes, padi, user] = await ethers.getSigners();
  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(soulbound).deploy()).deployed();

  const KycRegistry = await ethers.getContractFactory("KycRegistry");
  const kycRegistry = await (await KycRegistry.connect(soulbound).deploy()).deployed();

  await badgeSetFactory.connect(soulbound).createBadgeSet(forbes.address, kycRegistry.address, uri);
  const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
  const badgeSet = await ethers.getContractAt("BadgeSet", badgeSetAddress);

  return { badgeSetFactory, badgeSet, kycRegistry, soulbound, forbes, uri, user, userKycDetails };
};

export default { deploy };
