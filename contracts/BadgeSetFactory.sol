// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./BadgeSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadgeSetFactory is Ownable {
  
  address public kycRegistry;
  address[] private _badgeSets;

  constructor(address _kycRegistry) {
    kycRegistry = _kycRegistry;
  }

  function createBadgeSet(address owner, string memory uri, string memory contractURI) external onlyOwner {
    address newBadgeSet = address(new BadgeSet(owner, kycRegistry, uri, contractURI));
    _badgeSets.push(newBadgeSet);
  }

  function badgeSets() public view returns (address[] memory) {
    return _badgeSets;
  }
}