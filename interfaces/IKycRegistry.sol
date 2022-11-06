// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IKycRegistry { 

  error UserAlreadyLinked(address userAddress);
  error WalletAlreadyLinked(address walletAddress);
  error StringLongerThan31Bytes(string str);

  function linkWallet(address userAddress, address walletAddress) external;

  function getLinkedWallet(address userAddress) external view returns (address);

  function hashKycToUserAddress(string memory firstName, string memory lastName, uint256 phoneNumber) external pure returns (address);

  function transitionTokensByContracts(address userAddress, address walletAddress, address[] memory contracts) external;
  
}