// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error WalletAlreadyLinked();

// TODO: batch get functions?
// TODO: KYC functions available, either call or what
// TODO: add events

contract KycRegistry is Ownable { 
  address public factoryAddress;
  mapping(address => address) private _walletAddresses; 
  mapping(address => address) private _kycAddresses;

  constructor(address _factoryAddress) {
    factoryAddress = _factoryAddress;
  }

  function linkWallet(address kycAddress, address walletAddress) public onlyOwner {
    if (_kycAddresses[walletAddress] == walletAddress) revert WalletAlreadyLinked();
    _walletAddresses[kycAddress] = walletAddress;
    _kycAddresses[walletAddress] = kycAddress;
  }

  function getWalletAddress(address kycAddress) public view returns (address) {
    return _walletAddresses[kycAddress];
  }

  function getKycAddress(address walletAddress) public view returns (address) {
    return _kycAddresses[walletAddress];
  }

}