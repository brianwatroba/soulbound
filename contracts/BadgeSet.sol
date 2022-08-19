// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "../interfaces/IKycRegistry.sol";

import "hardhat/console.sol";

error ZeroAddress();
error ExpiryPassed();
error SoulboundNoTransfer();
error ParamsLengthMismatch();
error InsufficientBalance();
error InvalidURI();

// TODO: expiry shows you as owning 0 in balanceOf? Or you own but it's expired?
// TODO: add name for contract, storage variable, and add that to baseURL + name + ID
// TODO: token transfer hooks in _mint/_mintBatch
// TODO: clean up and optimize custom errors, replace all error strings
// TODO: implement: mintBatch(), mintBatchwithExpiry(), revoke(), revokeBatch(), _revoke();
// TODO: implement batching so that multiple tokens can be minted to multiple people
// TODO: access control instead of ownable?
// TODO: KYC pure functions more accessible across contracts
// TODO: signature that it's part of the overall Soulbound collection/registered

contract BadgeSet is Context, ERC165, IERC1155, Ownable, IERC1155MetadataURI {

    address public kycRegistry;
    mapping(uint256 => mapping(address => uint256)) private _balances; // id/address to owned count
    mapping(uint256 => mapping(address => uint256)) private _expiries; // id/address to badge expiration
    string private _uri;

    constructor(address _owner, address _kycRegistry, string memory uri_) {
        kycRegistry = _kycRegistry;
        setURI(uri_);
        transferOwnership(_owner);
    } 

    function uri(uint256 id) public view virtual returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }
    
    function setURI(string memory newuri) internal virtual {
        _uri = newuri;
    }

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        if (account == address(0)) revert ZeroAddress(); // need this?
        uint256 expiryTimestamp = _expiries[id][account];
        if (isExpired(expiryTimestamp)) return 0;
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
        address account,
        uint256 id,
        uint256 expiryTimestamp
    ) external onlyOwner {
        if (isExpired(expiryTimestamp)) revert ExpiryPassed();
        _balances[id][account] = 1;
        _expiries[id][account] = expiryTimestamp;
        address operator = _msgSender();
        emit TransferSingle(operator, account, address(0), id, 1);
        _doSafeTransferAcceptanceCheck(operator, address(0), account, id, 1, "");
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory expiryTimestamps
    ) external onlyOwner {
        if (ids.length != expiryTimestamps.length) revert ParamsLengthMismatch();
        uint[] memory amounts = new uint[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            if (isExpired(expiryTimestamps[i])) revert ExpiryPassed();
            _balances[ids[i]][to] = 1;
            _expiries[ids[i]][to] = expiryTimestamps[i];
            amounts[i] = 1;
        }
        address operator = _msgSender();
        emit TransferBatch(operator, address(0), to, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(operator, address(0), to, ids, amounts, "");
    }

   function revoke(
        address account,
        uint256 id
    ) external onlyOwner {
        if (balanceOf(account, id) != 1) revert InsufficientBalance();
        _balances[id][account] = 0;
        emit TransferSingle(_msgSender(), account, address(0), id, 1);
    }

    function revokeBatch(
        address to,
        uint256[] memory ids
    ) external onlyOwner {
        address operator = _msgSender();
        uint[] memory amounts = new uint[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            if (balanceOf(to, ids[i]) != 1) revert InsufficientBalance();
            _balances[ids[i]][to] = 0;
            amounts[i] = 1;
        }
        emit TransferBatch(operator, address(0), to, ids, amounts);
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

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
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

    function isExpired(uint256 expiryTimestamp) internal view returns (bool) {
        return expiryTimestamp > 0 && expiryTimestamp <= block.timestamp;
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
    ) external {
    }
}
