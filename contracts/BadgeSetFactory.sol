// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./BadgeSet.sol";

/// @title BadgeSetFactory
/// @author Brian watroba
/// @dev Factory contract to create BadgeSet ERC-1155 non-transferable NFT contracts.
/// @custom:version 1.0.2
contract BadgeSetFactory is Ownable {
  
  address public kycRegistry;
  address[] private _badgeSets;

  constructor(address _kycRegistry) {
    kycRegistry = _kycRegistry;
  }

  function createBadgeSet(address owner, string memory baseUri) external onlyOwner {
    address newBadgeSet = address(new BadgeSet(owner, kycRegistry, baseUri));
    _badgeSets.push(newBadgeSet);
  }

  function badgeSets() public view returns (address[] memory) {
    return _badgeSets;
  }
}