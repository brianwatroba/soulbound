// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IKycRegistry.sol";
import "../interfaces/IBadgeSet.sol";

/// @title KycRegistry
/// @author Brian watroba
/// @dev Registry mapping of user read-only addresses to linked wallet addresses. Used in BadgeSet contract to verify user ownership of wallet address.
/// @custom:version 1.0.2
contract KycRegistry is IKycRegistry, Ownable {
    mapping(address => address) private _walletsToUsers;
    mapping(address => address) private _usersToWallets;

    function linkWallet(address userAddress, address walletAddress)
        external
        onlyOwner
    {
        bool walletLinked = _walletsToUsers[userAddress] != address(0);
        bool userLinked = _usersToWallets[walletAddress] != address(0);
        if (walletLinked || userLinked) revert WalletAlreadyLinked();
        _walletsToUsers[userAddress] = walletAddress;
        _usersToWallets[walletAddress] = userAddress;
    }

    function getLinkedWallet(address userAddress)
        external
        view
        returns (address)
    {
        address linkedWallet = _walletsToUsers[userAddress];
        return linkedWallet == address(0) ? userAddress : linkedWallet;
    }

    function hashKycToUserAddress(
        string memory firstName,
        string memory lastName,
        uint256 phoneNumber
    ) external pure returns (address) {
        bytes memory firstNameBytes = bytes(firstName);
        bytes memory lastNameBytes = bytes(lastName);
        if (firstNameBytes.length > 31 || lastNameBytes.length > 31)
            revert StringTooLong();
        bytes32 userHash = keccak256(
            abi.encodePacked(bytes32(firstNameBytes), bytes32(lastNameBytes), phoneNumber)
        );
        address userAddress = address(uint160(uint256(userHash)));
        return userAddress;
    }

    function transitionBadgesByContracts(
        address userAddress,
        address walletAddress,
        address[] memory contracts
    ) public {
        for (uint256 i = 0; i < contracts.length; i++) {
            address contractAddress = contracts[i];
            IBadgeSet(contractAddress).transitionWallet(
                userAddress,
                walletAddress
            );
        }
    }
}
