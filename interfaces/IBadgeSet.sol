// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IBadgeSet {

function uri(uint256 id) external view returns (string memory);
    
function setURI(string memory newuri) external;

function balanceOf(address account, uint256 id) external view returns (uint256);

function balanceOfBatch(address[] memory accounts, uint256[] memory ids) external view returns (uint256[] memory);

// function mint(address account, uint256 id, uint256 expiryTimestamp) external;

// function mintBatch(address to, uint256[] memory ids, uint256[] memory expiryTimestamps) external;

// function revoke(address account, uint256 id) external;

// function revokeBatch(address to, uint256[] memory ids) external;

function supportsInterface(bytes4 interfaceId) external view returns (bool);

function setApprovalForAll(address operator, bool approved) external;
 
function isApprovedForAll(address account, address operator) external view returns (bool);

function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;

function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;

function validateAddress(address _address) external view returns (address);
}