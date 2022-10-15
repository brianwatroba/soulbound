// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IKycRegistry { 

  error WalletAlreadyLinked();
  error StringTooLong();

  function linkWallet(address userAddress, address walletAddress) external;

  function getLinkedWallet(address userAddress) external view returns (address);

  function hashKycToUserAddress(string memory firstName, string memory lastName, uint256 phoneNumber) external pure returns (address);

  function transitionBadgesByContracts(address userAddress, address walletAddress, address[] memory contracts) external;
  
}