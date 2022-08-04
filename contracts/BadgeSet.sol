// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";

error ZeroAddress();
error ExpiryPassed();
error SoulboundNoTransfer();
error ParamsLengthMismatch();

contract BadgeSet is Context, ERC165, IERC1155, Ownable, IERC1155MetadataURI {

    mapping(uint256 => mapping(address => uint256)) private _balances; // id/address to owned count
    mapping(uint256 => mapping(address => uint256)) private _expiries; // id/address to badge expiration
    string private _uri;

    constructor(address owner, string memory uri_) {
        // TODO: add kycRegistry and factory storage variables, set them
        setURI(uri_);
        transferOwnership(owner);
    } 

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }
    
    function setURI(string memory newuri) internal virtual {
        _uri = newuri;
    }

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        if (account == address(0)) revert ExpiryPassed();
        return _balances[id][account];
    }

     function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
        if (accounts.length != ids.length) revert ParamsLengthMismatch();
        uint256[] memory batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        return batchBalances;
    }

    function mint(
        bytes32 kycHash,
        uint256 id
    ) public onlyOwner {
        address account = getUserAddress(kycHash);
        _mint(account, id, 0);
    }

     function mintWithExpiry(
        bytes32 kycHash,
        uint256 id,
        uint256 expiryTimestamp
    ) public onlyOwner {
        address account = getUserAddress(kycHash);
        if (expiryTimestamp <= block.timestamp) revert ExpiryPassed();
        _mint(account, id, expiryTimestamp);
    }

    function _mint(
        address account,
        uint256 id,
        uint256 expiryTimestamp
    ) internal {
        _balances[id][account] = 1;
        if (expiryTimestamp > block.timestamp) _expiries[id][account] = expiryTimestamp;
        emit TransferSingle(_msgSender(), address(0), account, id, 1);
    }

    function _revoke(
        address account,
        uint256 id
    ) internal {
        _balances[id][account] = 0;
        emit TransferSingle(_msgSender(), account, address(0), id, 1);
    }

     function uri(uint256) public view virtual returns (string memory) {
        return _uri;
    }

    function hashKyc(
        bytes32 firstName, 
        bytes32 lastName, 
        uint256 dob, 
        uint256 phoneNumber
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(firstName, lastName, dob, phoneNumber));
    }

    function kycHashToAddress(bytes32 kycHash) public pure returns (address) {
        return address(uint160(uint256(kycHash)));
    }

    function getUserAddress(bytes32 kycHash) public pure returns (address) {
        address kycAddress = kycHashToAddress(kycHash);
        // TODO: lookup in kyc registry if they have an attached wallet. If so, return that, otherwise 
        return kycAddress;
    }

    // @notice: NOOPs for non needed ERC1155 functions
    // TODO: for OpenSea this must be overriden in a special way, can't revert
    function setApprovalForAll(address operator, bool approved) external {}

 
    function isApprovedForAll(address account, address operator) external view returns (bool) {}

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external {
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external { }
   
}
