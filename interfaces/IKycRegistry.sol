// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IKycRegistry { 

  function linkWallet(address userAddress, address walletAddress) external;

  function getLinkedWallet(address userAddress) external view returns (address);

  function hashKycToUserAddress(bytes32 firstName, bytes32 lastName, uint256 phoneNumber) external pure returns (address);

  function transitionBadgesByContracts(address kycAddress, address walletAddress, address[] memory contracts) external;
  
}