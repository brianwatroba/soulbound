// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

// TODO: add events

interface IKycRegistry { 

  function linkWallet(address kycAddress, address walletAddress) external;

  function getWalletAddress(address kycAddress) external view returns (address);

  function getKycAddress(address walletAddress) external view returns (address);

}