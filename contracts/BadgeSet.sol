// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error ZeroAddressMint();
error ExpiryPassed();

contract BadgeSet is Ownable {

    // address public kycRegistry;
    // address public factory;

    // badgeId/kycHash to owned count
    mapping(uint256 => mapping(bytes32 => bool)) private _balances;

    // badgeID/kycHash to badge expiration
    mapping(uint256 => mapping(bytes32 => uint256)) private _expiries;

    constructor(address _owner) {
        // kycRegistry = _kycRegistry;
        // factory = _factory;
        transferOwnership(_owner);
    }

    function mint(
        bytes32 kycHash,
        uint256 badgeId
    ) public onlyOwner {
        _mint(kycHash, badgeId, 0);
    }

     function mintWithExpiry(
        bytes32 kycHash,
        uint256 badgeId,
        uint256 expiryTimestamp
    ) public onlyOwner {
        // TODO: add check to ensure expiration date is not zero
        _mint(kycHash, badgeId, expiryTimestamp);
        
    }

    function _mint(
        bytes32 kycHash,
        uint256 badgeId,
        uint256 expiryTimestamp
    ) internal {
        address operator = _msgSender();
        _balances[badgeId][kycHash] = true;
        if (expiryTimestamp == 0) return;
        if (expiryTimestamp <= block.timestamp) revert ExpiryPassed();
        _expiries[badgeId][kycHash] = expiryTimestamp;
        // TODO: look up someone's address from KYCRegistry, put in event, otherwise put in bytes32
        emit TransferSingle(operator, bytes32(0), kycHash, badgeId, 1);

    }

    function _revoke(
        bytes32 kycHash,
        uint256 badgeId
    ) internal {
        address operator = _msgSender();
        _balances[badgeId][kycHash] = false;
        // TODO: look up someone's address from KYCRegistry, put in event, otherwise put in bytes32
        emit TransferSingle(operator, kycHash, bytes32(0), badgeId, 1);

    }

    function hashKyc(
        bytes32 firstName, 
        bytes32 lastName, 
        uint256 dob, 
        uint256 phoneNumber
    ) public pure returns (bytes32) {
        // Input sanitation will happen on front end
        return keccak256(abi.encodePacked(firstName, lastName, dob, phoneNumber));
    }

    // TODO: edited param3 to be bytes32, normally is address
    event TransferSingle(address indexed operator, bytes32 indexed from, bytes32 indexed to, uint256 id, uint256 value);
   
}
