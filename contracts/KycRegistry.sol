// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
// need to convert this to interface
import "../interfaces/IKycRegistry.sol";
import "../interfaces/IBadgeSet.sol";
import "hardhat/console.sol";

error WalletAlreadyLinked();

// TODO: batch get functions?
// TODO: add events

contract KycRegistry is IKycRegistry, Ownable { 

  mapping(address => address) private _walletAddresses; 

  function linkWallet(address userAddress, address walletAddress, address badgeSet, uint256[] memory ids) external onlyOwner {
    if (_walletAddresses[userAddress] != address(0)) revert WalletAlreadyLinked();
    _walletAddresses[userAddress] = walletAddress;

    IBadgeSet(badgeSet).transitionAddress(userAddress, walletAddress, ids);
    
    // call badgeset contract and emit transfer events in loop
    // emit event
  }

  function getCurrentAddress(address _address) external view returns (address) {
    address mappedAddress = _walletAddresses[_address];
    if (mappedAddress == address(0)) return _address;
    return mappedAddress;
  }

  function kycToUserAddress(bytes32 firstName, bytes32 lastName, uint256 dob, uint256 phoneNumber) external pure returns (address) {
    bytes32 userHash = keccak256(abi.encodePacked(firstName, lastName, dob, phoneNumber));
    address userAddress = address(uint160(uint256(userHash)));
    return userAddress;
  }
}