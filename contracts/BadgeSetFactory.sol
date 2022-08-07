// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./BadgeSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadgeSetFactory is Ownable {
  
  address[] private _badgeSets;

  function createBadgeSet(address owner, address kycRegistry, string memory uri) external {
    address newBadgeSet = address(new BadgeSet(owner, kycRegistry, address(this), uri));
    _badgeSets.push(newBadgeSet);
  }

  function badgeSets() public view returns (address[] memory) {
    return _badgeSets;
  }
}