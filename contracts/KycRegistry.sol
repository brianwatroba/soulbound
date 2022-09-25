// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IKycRegistry.sol";
import "../interfaces/IBadgeSet.sol";

contract KycRegistry is IKycRegistry, Ownable { 

  mapping(address => address) private _walletsToUsers; 
  mapping(address => address) private _usersToWallets;

  function linkWallet(address userAddress, address walletAddress) external onlyOwner {
    bool walletLinked = _walletsToUsers[userAddress] != address(0);
    bool userLinked = _usersToWallets[walletAddress] != address(0);
    if (walletLinked || userLinked) revert WalletAlreadyLinked();
    _walletsToUsers[userAddress] = walletAddress;
    _usersToWallets[walletAddress] = userAddress;
  }

  function getLinkedWallet(address userAddress) external view returns (address) {
    address linkedWallet = _walletsToUsers[userAddress];
    return linkedWallet == address(0) ?  userAddress : linkedWallet;
  }

  function hashKycToUserAddress(bytes32 firstName, bytes32 lastName, uint256 phoneNumber) external pure returns (address) {
    bytes32 userHash = keccak256(abi.encodePacked(firstName, lastName, phoneNumber));
    address userAddress = address(uint160(uint256(userHash)));
    return userAddress;
  }

  function transitionBadgesByContracts(address kycAddress, address walletAddress, address[] memory contracts) public {
    for (uint256 i = 0; i < contracts.length; i++) {
      address contractAddress = contracts[i];
      IBadgeSet(contractAddress).transitionWallet(kycAddress, walletAddress);
    }
  }

}