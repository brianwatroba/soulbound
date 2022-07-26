// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

interface IWalletRegistry {
    error UserAlreadyLinked(address userAddress);
    error WalletAlreadyLinked(address walletAddress);
    error StringLongerThan31Bytes(string str);

    function linkWallet(address userAddress, address walletAddress) external;

    function getLinkedWallet(
        address userAddress
    ) external view returns (address);

    function getLiteWalletAddress(
        string memory firstName,
        string memory lastName,
        uint256 phoneNumber
    ) external pure returns (address liteWallet);

    function transitionBadgesByContracts(
        address from,
        address to,
        address[] memory contracts
    ) external;
}
