// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IBadgeSet {

function uri(uint256 id) external view returns (string memory);
    
  function setURI(string memory newuri) external;

  function contractURI() external view returns (string memory);

  function setContractURI(string memory newuri) external;
  
  // expiryOf() returns the expiry of the badge with the given id

  function balanceOf(address account, uint256 id) external view returns (uint256 balance);

  function balanceOfBatch(address[] memory accounts, uint256[] memory ids) external view returns (uint256[] memory);

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
  ) external;

  function revokeBatch(
      address to,
      uint96[] memory badgeTypes
  ) external;

  function validateAddress(address _address) external view returns (address);

  function encodeTokenId(uint96 _tokenType, address _address) external pure returns (uint256);

  function decodeTokenId(uint256 data) external pure returns (uint96 _tokenType, address _address);

  function setApprovalForAll(address operator, bool approved) external;

  function isApprovedForAll(address account, address operator) external view returns (bool);

  function safeTransferFrom(
      address from,
      address to,
      uint256 id,
      uint256 amount,
      bytes calldata data
  ) external;

  function safeBatchTransferFrom(
      address from,
      address to,
      uint256[] calldata ids,
      uint256[] calldata amounts,
      bytes calldata data
  ) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}