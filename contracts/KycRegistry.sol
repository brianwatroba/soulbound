// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error WalletAlreadyLinked();

// TODO: batch get functions?
// TODO: KYC functions available, either call or what
// TODO: add events

contract KycRegistry is Ownable { 
  mapping(address => address) private _walletAddresses; 
  mapping(address => address) private _userAddresses;

  function linkWallet(address userAddress, address walletAddress) public onlyOwner {
    if (_userAddresses[walletAddress] == walletAddress) revert WalletAlreadyLinked();
    _walletAddresses[userAddress] = walletAddress;
    _userAddresses[walletAddress] = userAddress;
  }

  function getWalletAddress(address userAddress) public view returns (address) {
    return _walletAddresses[userAddress];
  }

  function getUserAddress(address walletAddress) public view returns (address) {
    return _userAddresses[walletAddress];
  }

  function kycToUserAddress(bytes32 firstName, bytes32 lastName, uint256 dob, uint256 phoneNumber) public view returns (bytes32) {
    bytes32 userHash = keccak256(abi.encodePacked(firstName, lastName, dob, phoneNumber));
    address userAddress = address(uint160(uint256(userHash)));
    address walletAddress = getWalletAddress(userAddress);
    return userHash;
    // if (walletAddress == address(0)) {
    //     return userAddress;
    // } else {
    //     return walletAddress;
    // }
  }
}