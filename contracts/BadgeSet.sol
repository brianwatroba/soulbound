// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";

error ZeroAddress();
error ExpiryPassed();
error SoulboundNoTransfer();
error ParamsLengthMismatch();
error InsufficientBalance();

// TODO: token transfer hooks in _mint/_mintBatch
// TODO: clean up and optimize custom errors, replace all error strings
// TODO: implement: mintBatch(), mintBatchwithExpiry(), revoke(), revokeBatch(), _revoke();
// TODO: implement batching so that multiple tokens can be minted to multiple people
// TODO: access control instead of ownable?
// TODO: KYC pure functions more accessible across contracts
// TODO: signature that it's part of the overall Soulbound collection/registered

contract BadgeSet is Context, ERC165, IERC1155, Ownable, IERC1155MetadataURI {

    address public kycRegistry;
    address public factory;
    mapping(uint256 => mapping(address => uint256)) private _balances; // id/address to owned count
    mapping(uint256 => mapping(address => uint256)) private _expiries; // id/address to badge expiration
    string private _uri;

    constructor(address _owner, address _kycRegistry, address _factory, string memory uri_) {
        setURI(uri_);
        kycRegistry = _kycRegistry;
        factory = _factory;
        transferOwnership(_owner);
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
        if (account == address(0)) revert ZeroAddress();
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

    function mintToAddress(
        address account,
        uint256 id
    ) public onlyOwner {
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

     function uri(uint256 id) public view virtual returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }

    function revokeByAddress(address account, uint256 id) public onlyOwner {
        if (balanceOf(account, id) != 1) revert InsufficientBalance();
        _revoke(account, id);
    }

   function _revoke(
        address account,
        uint256 id
    ) internal {
        _balances[id][account] = 0;
        emit TransferSingle(_msgSender(), account, address(0), id, 1);
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

    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.code.length > 0) { // check if contract
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, amount, data) returns (bytes4 response) {
                if (response != IERC1155Receiver.onERC1155Received.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (to.code.length > 0) { // check if contract
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, amounts, data) returns (
                bytes4 response
            ) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non-ERC1155Receiver implementer");
            }
        }
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
