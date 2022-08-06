import { ethers } from "hardhat";

// TODO: break up fixtures to usable pieces

export const deployBadgeSetFixture = async () => {
  const uri = "https://www.soulboundapi.com/";

  const [soulbound, forbes, padi] = await ethers.getSigners();
  const BadgeSetFactory = await ethers.getContractFactory("BadgeSetFactory");
  const badgeSetFactory = await (await BadgeSetFactory.connect(soulbound).deploy()).deployed();

  const KycRegistry = await ethers.getContractFactory("KycRegistry");

  const kycRegistry = await (
    await KycRegistry.connect(soulbound).deploy(badgeSetFactory.address)
  ).deployed();

  await badgeSetFactory.connect(soulbound).createBadgeSet(forbes.address, kycRegistry.address, uri);
  const badgeSetAddress = (await badgeSetFactory.badgeSets())[0];
  const badgeSet = await ethers.getContractAt("BadgeSet", badgeSetAddress);

  const kyc = {
    firstName: "john",
    lastName: "smith",
    dob: 12121989,
    phoneNumber: 16461111,
  };
  return { badgeSetFactory, badgeSet, kycRegistry, soulbound, forbes, padi, kyc, uri };
};
