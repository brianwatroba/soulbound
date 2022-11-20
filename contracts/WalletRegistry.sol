// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IWalletRegistry.sol";
import "../interfaces/IBadgeSet.sol";

/**
 * @title WalletRegistry
 * @author Brian Watroba
 * @dev Registry mapping of user read-only user lite wallet addresses to linked real wallet addresses. Used in BadgeSet contract to verify user ownership of wallet address
 * @custom:version 1.0.4
 */
contract WalletRegistry is IWalletRegistry, Ownable {
    mapping(address => address) private _walletsToUsers;
    mapping(address => address) private _usersToWallets;
    address private constant ZERO_ADDRESS = address(0);

    /** 
     * @notice Link and save a liteWallet to a realWallet association
     * @dev only callable by WalletRegistry owner
     * @param liteWallet liteWallet address
     * @param realWallet realWallet address
    */
    function linkWallet(
        address liteWallet,
        address realWallet
    ) external onlyOwner {
        bool walletLinked = _walletsToUsers[liteWallet] != ZERO_ADDRESS;
        bool userLinked = _usersToWallets[realWallet] != ZERO_ADDRESS;
        if (walletLinked) revert WalletAlreadyLinked(realWallet);
        if (userLinked) revert WalletAlreadyLinked(liteWallet);
        _walletsToUsers[liteWallet] = realWallet;
        _usersToWallets[realWallet] = liteWallet;
    }

    /** 
     * @notice Return an associated linked realWallet for a given liteWallet (if exists)
     * @param liteWallet liteWallet address
     * @return linked realWallet address if it exists, otherwise the initial liteWallet address
    */
    function getLinkedWallet(
        address liteWallet
    ) external view returns (address) {
        address linkedWallet = _walletsToUsers[liteWallet];
        return linkedWallet == ZERO_ADDRESS ? liteWallet : linkedWallet;
    }

    /**
     * @notice Return the liteWallet address for a given user's first name, last name, and phone number
     * @dev liteWallet address id derived from hashing a user's the first name, last name, and phone number. Input validation should happen on the front end.
     * @param firstName user's first name (lowercase)
     * @param lastName user's last name (lowercase)
     * @param phoneNumber user's phone number (only numbers, including country/area code, no special characters)
     * @return liteWallet user's liteWallet address
    */
    function getLiteWalletAddress(
        string memory firstName,
        string memory lastName,
        uint256 phoneNumber
    ) external pure returns (address liteWallet) {
        bytes memory firstNameBytes = bytes(firstName);
        bytes memory lastNameBytes = bytes(lastName);
        if (firstNameBytes.length > 31)
            revert StringLongerThan31Bytes(firstName);
        if (lastNameBytes.length > 31) revert StringLongerThan31Bytes(lastName);
        bytes32 userHash = keccak256(
            abi.encodePacked(
                bytes32(firstNameBytes),
                bytes32(lastNameBytes),
                phoneNumber
            )
        );
        liteWallet = address(uint160(uint256(userHash)));
    }

    // TODO: should have a return value to check
    /** 
     * @notice Transition all owned badges from a liteWallet to a realWallet for a set (array) of contracts
     * @dev Uses multicall pattern and has a few nested loops. If too many contracts/badges are involved, it's best to split up into a few calls
     * @param from liteWallet to transition badges from
     * @param to realWallet to transition badges to
     * @param contracts set of contracts to transition all badges for
    */
    function transitionBadgesByContracts(
        address from,
        address to,
        address[] memory contracts
    ) public {
        for (uint256 i = 0; i < contracts.length; i++) {
            address contractAddress = contracts[i];
            IBadgeSet(contractAddress).moveUserTokensToWallet(from, to);
        }
    }
}
