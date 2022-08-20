// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error WalletAlreadyLinked();

// TODO: single get function, to return address (wallet if exists, otherwise useraddress?)
// TODO: batch get functions?
// TODO: add events

contract KycRegistry is Ownable { 

  mapping(address => address) private _walletAddresses; 

  function linkWallet(address userAddress, address walletAddress) external onlyOwner {
    if (_walletAddresses[userAddress] != address(0)) revert WalletAlreadyLinked();
    _walletAddresses[userAddress] = walletAddress;
    // call badgeset contract and emit transfer events in loop
    // emit event
  }

  function getCurrentAddress(address userAddress) external view returns (address) {
    address walletAddress = _walletAddresses[userAddress];
    if (walletAddress == address(0)) return userAddress;
    return walletAddress;
  }

  function kycToUserAddress(bytes32 firstName, bytes32 lastName, uint256 dob, uint256 phoneNumber) external pure returns (address) {
    bytes32 userHash = keccak256(abi.encodePacked(firstName, lastName, dob, phoneNumber));
    address userAddress = address(uint160(uint256(userHash)));
    return userAddress;
  }
}