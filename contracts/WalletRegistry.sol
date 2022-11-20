// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IWalletRegistry.sol";
import "../interfaces/IBadgeSet.sol";

/**
 * @title WalletRegistry
 * @author Brian watroba
 * @dev Registry mapping of user read-only user lite wallet addresses to linked hot wallet addresses. Used in BadgeSet contract to verify user ownership of wallet address
 * @custom:version 1.0.3
*/
contract WalletRegistry is IWalletRegistry, Ownable {
    mapping(address => address) private _walletsToUsers;
    mapping(address => address) private _usersToWallets;
    address private constant ZERO_ADDRESS = address(0);

    function linkWallet(address userAddress, address walletAddress)
        external
        onlyOwner
    {
        bool walletLinked = _walletsToUsers[userAddress] != ZERO_ADDRESS;
        bool userLinked = _usersToWallets[walletAddress] != ZERO_ADDRESS;
        if (walletLinked) revert WalletAlreadyLinked(walletAddress);
        if (userLinked) revert WalletAlreadyLinked(userAddress);
        _walletsToUsers[userAddress] = walletAddress;
        _usersToWallets[walletAddress] = userAddress;
    }

    function getLinkedWallet(address userAddress)
        external
        view
        returns (address)
    {
        address linkedWallet = _walletsToUsers[userAddress];
        return linkedWallet == ZERO_ADDRESS ? userAddress : linkedWallet;
    }

    function getLiteWalletAddress(
        string memory firstName,
        string memory lastName,
        uint256 phoneNumber
    ) external pure returns (address) {
        bytes memory firstNameBytes = bytes(firstName);
        bytes memory lastNameBytes = bytes(lastName);
        if (firstNameBytes.length > 31) revert StringLongerThan31Bytes(firstName);
        if (lastNameBytes.length > 31) revert StringLongerThan31Bytes(lastName);
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
            IBadgeSet(contractAddress).moveUserTokensToWallet(
                userAddress,
                walletAddress
            );
        }
    }
}