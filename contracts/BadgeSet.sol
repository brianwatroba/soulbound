// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

error ZeroAddressMint();

contract BadgeSet {

    // tokenId to mapping of owners (KYCHash)
    mapping(uint256 => mapping(bytes32 => bool)) private _ownersByBadgeId;

    // tokenID to when it expires for a KYCHash
    mapping(uint256 => mapping(bytes32 => uint256)) private _expiry;

    constructor() {

    }

    function _mint(
        bytes32 to,
        uint256 id,
        uint256 expiry,
        bytes memory data
    ) internal virtual {
        

    }
   
}
