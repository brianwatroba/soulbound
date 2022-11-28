// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./BadgeSet.sol";

/**
 * @title BadgeSetFactory
 * @author Brian Watroba
 * @dev Factory to deploy and store BadgeSet Soulbound token contracts
 * @custom:version 1.0.4
 */
contract BadgeSetFactory is Ownable {
    address public walletRegistry;
    address[] private _badgeSets;

    constructor(address _walletRegistry) {
        walletRegistry = _walletRegistry;
    }

    /**
     * @notice Deploys a new BadgeSet contract
     * @dev Only callable by BadgeSetFactory owner
     * @param owner Contract owner address
     */
    function createBadgeSet(
        address owner,
        string memory baseUri
    ) external onlyOwner {
        address newBadgeSet = address(
            new BadgeSet(owner, walletRegistry, baseUri)
        );
        _badgeSets.push(newBadgeSet);
    }

    /**
     * @notice Returns array of all deployed BadgeSet contract addresses
     * @return Array of BadgeSet contract addresses
     */
    function badgeSets() public view returns (address[] memory) {
        return _badgeSets;
    }
}
