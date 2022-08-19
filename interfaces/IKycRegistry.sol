// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

// TODO: add events

interface IKycRegistry { 

  function linkWallet(address userAddress, address walletAddress) external;

  function getCurrentAddress(address userAddress) external view returns (address);

  function kycToUserAddress(bytes32 firstName, bytes32 lastName, uint256 dob, uint256 phoneNumber) external pure returns (address);

}