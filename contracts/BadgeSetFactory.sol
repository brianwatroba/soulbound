// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./BadgeSet.sol";

contract BadgeSetFactory {
  
  address[] private _badgeSets;

  function createBadgeSet(address owner, string memory uri) external {
    address newBadgeSet = address(new BadgeSet(owner, uri));
    _badgeSets.push(newBadgeSet);
  }

  function badgeSets() public view returns (address[] memory) {
    return _badgeSets;
  }
}