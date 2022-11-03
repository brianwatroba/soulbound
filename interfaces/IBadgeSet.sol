// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IBadgeSet {

    error ExpiryPassed();
    error ParamsLengthMismatch();
    error InsufficientBalance();
    error TokenAlreadyOwned();
    error WalletNotLinked();
    error SoulboundTokenNoSetApprovalForAll(address operator, bool approved);
    error SoulboundTokenNoIsApprovedForAll(address account, address operator);
    error SoulboundTokenNoSafeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data);
    error SoulboundTokenNoSafeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data);
    error ERC1155ReceiverNotImplemented();
    error ERC1155ReceiverRejectedTokens();

    event TransitionWallet(address indexed kycAddress, address indexed walletAddress);

    function contractURI() external view returns (string memory);
    
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
    ) external;

    function revoke(
        address account,
        uint96 badgeType
    ) external returns(uint256 tokenId);

    function revokeBatch(
        address to,
        uint96[] memory badgeTypes
    ) external;

    function transitionWallet(address kycAddress, address walletAddress) external;

    function validateAddress(address _address) external view returns (address);

    function encodeTokenId(uint96 _tokenType, address _address) external pure returns (uint256);

    function decodeTokenId(uint256 data) external pure returns (uint96 _tokenType, address _address);

}