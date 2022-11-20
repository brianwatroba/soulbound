export const baseUri = "https://soulbound-api-test.herokuapp.com/metadata/";
export const errors = {
  // IERC1155.sol
  NotOwner: "Ownable: caller is not the owner",

  // BadgeSet.sol
  IncorrectBalance: "IncorrectBalance",
  IncorrectExpiry: "IncorrectExpiry",
  NewBadgeTypeNotIncremental: "NewBadgeTypeNotIncremental",
  ERC1155ReceiverNotImplemented: "ERC1155ReceiverNotImplemented",
  SoulboundTokenNoSetApprovalForAll: "SoulboundTokenNoSetApprovalForAll",
  SoulboundTokenNoIsApprovedForAll: "SoulboundTokenNoIsApprovedForAll",
  SoulboundTokenNoSafeTransferFrom: "SoulboundTokenNoSafeTransferFrom",
  SoulboundTokenNoSafeBatchTransferFrom: "SoulboundTokenNoSafeBatchTransferFrom",

  // WalletRegistry.sol
  WalletNotLinked: "WalletNotLinked",
  WalletAlreadyLinked: "WalletAlreadyLinked",
  StringLongerThan31Bytes: "StringLongerThan31Bytes",
};

export const userInfo = {
  firstName: "john",
  lastName: "doe",
  phoneNumber: 8105555555,
};

export const liteWallet = "0x64443F9CDBc6b3f12AD0c81083dde302d85Ef81E";
export const realWallet = "0x20A3d0288B393dF8901BB6415C6Ac538F17B94fE";
export const zeroAddress = "0x0000000000000000000000000000000000000000";

export const expiries = {
  noExpiry: 0,
  validExpiry: Date.now() + 60 * 60 * 24 * 365, // year in future
  invalidExpiry: 50, // already passed
};
