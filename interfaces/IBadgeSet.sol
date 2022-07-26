// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IBadgeSet {
    error IncorrectExpiry(address user, uint96 badgeType, uint256 expiry);
    error IncorrectBalance(address user, uint96 badgeType, uint256 balance);
    error NewBadgeTypeNotIncremental(uint96 badgeType, uint256 maxBadgeType);
    error ArrayParamsUnequalLength();
    error WalletNotLinked(address walletAddress);
    error SoulboundTokenNoSetApprovalForAll(address operator, bool approved);
    error SoulboundTokenNoIsApprovedForAll(address account, address operator);
    error SoulboundTokenNoSafeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes data
    );
    error SoulboundTokenNoSafeBatchTransferFrom(
        address from,
        address to,
        uint256[] ids,
        uint256[] amounts,
        bytes data
    );
    error ERC1155ReceiverNotImplemented();
    error ERC1155ReceiverRejectedTokens();

    event TransitionWallet(
        address indexed kycAddress,
        address indexed walletAddress
    );

    function setURI(string memory newuri) external;

    function setContractURI(string memory newuri) external;

    function expiryOf(uint256 tokenId) external view returns (uint256);

    function mint(
        address account,
        uint96 badgeType,
        uint256 expiryTimestamp
    ) external returns (uint256 tokenId);

    function mintBatch(
        address to,
        uint96[] memory badgeTypes,
        uint256[] memory expiryTimestamps
    ) external returns (uint256[] memory tokenIds);

    function revoke(
        address account,
        uint96 badgeType
    ) external returns (uint256 tokenId);

    function revokeBatch(
        address to,
        uint96[] memory badgeTypes
    ) external returns (uint256[] memory tokenIds);

    function moveUserTokensToWallet(
        address kycAddress,
        address walletAddress
    ) external;

    function encodeTokenId(
        uint96 badgeType,
        address account
    ) external pure returns (uint256 tokenId);

    function decodeTokenId(
        uint256 tokenId
    ) external pure returns (uint96 badgeType, address account);
}
