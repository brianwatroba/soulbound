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

error ZeroAddress();
error ExpiryPassed();
error SoulboundNoTransfer();
error ParamsLengthMismatch();
error InsufficientBalance();
error TokenAlreadyOwned();
error InvalidURI();
error OnlyKycRegistry();

// TODO: add parameters to custom errors so there's a trace/message
// TODO: create helper array creation function for given length full of a value
// TODO: do we need zero address checks?
// TODO: function only KYC registry can call to emit events for all transferred
// TODO: how to handle minting some badges to kyc address, then some to real address?
// TODO: consistency of "account" and "to"
// TODO: gas optimization in transitionAddress to loop events or loop array and single batch event
// TODO: swap order in private mappings expiries/balances to be address/id, not id/address
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

    function uri(uint256 id) public view returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }
    
    function setURI(string memory newuri) public onlyOwner {
        _uri = newuri;
    }

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        address validatedAccount = validateAddress(account);
        uint256 expiryTimestamp = _expiries[id][validatedAccount];
        if (isExpired(expiryTimestamp)) return 0;
        return _balances[id][validatedAccount];
    }

     function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
        if (accounts.length != ids.length) revert ParamsLengthMismatch();
        uint256[] memory batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            address validatedAccount = validateAddress(accounts[i]);
            batchBalances[i] = balanceOf(validatedAccount, ids[i]);
        }
        return batchBalances;
    }

    function mint(
        address account,
        uint256 id,
        uint256 expiryTimestamp
    ) external onlyOwner {
        if (isExpired(expiryTimestamp)) revert ExpiryPassed();
        if (balanceOf(account, id) > 0) revert TokenAlreadyOwned();
        address validatedAccount = validateAddress(account);
        _balances[id][validatedAccount] = 1;
        _expiries[id][validatedAccount] = expiryTimestamp;
        address operator = _msgSender();
        emit TransferSingle(operator, validatedAccount, address(0), id, 1);
        _doSafeTransferAcceptanceCheck(operator, address(0), validatedAccount, id, 1, "");
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory expiryTimestamps
    ) external onlyOwner {
        if (ids.length != expiryTimestamps.length) revert ParamsLengthMismatch();
        address validatedAccount = validateAddress(to);
        uint[] memory amounts = new uint[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            if (isExpired(expiryTimestamps[i])) revert ExpiryPassed();
            if (_balances[ids[i]][validatedAccount] == 1) revert TokenAlreadyOwned();
            _balances[ids[i]][validatedAccount] = 1;
            _expiries[ids[i]][validatedAccount] = expiryTimestamps[i];
            amounts[i] = 1;
        }
        address operator = _msgSender();
        emit TransferBatch(operator, address(0), validatedAccount, ids, amounts);
        _doSafeBatchTransferAcceptanceCheck(operator, address(0), validatedAccount, ids, amounts, "");
    }

   function revoke(
        address account,
        uint256 id
    ) external onlyOwner {
        if (balanceOf(account, id) != 1) revert InsufficientBalance();
        address validatedAccount = validateAddress(account);
        _balances[id][validatedAccount] = 0;
        emit TransferSingle(_msgSender(), validatedAccount, address(0), id, 1);
    }

    function revokeBatch(
        address to,
        uint256[] memory ids
    ) external onlyOwner {
        address operator = _msgSender();
        address validatedAccount = validateAddress(to);
        uint[] memory amounts = new uint[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            if (balanceOf(validatedAccount, ids[i]) != 1) revert InsufficientBalance();
            _balances[ids[i]][validatedAccount] = 0;
            amounts[i] = 1;
        }
        emit TransferBatch(operator, address(0), validatedAccount, ids, amounts);
    }

    function transitionAddress(address userAddress, address walletAddress, uint256[] memory ids) public {
        address operator = _msgSender();
        if (operator != kycRegistry) revert OnlyKycRegistry();
        uint length = ids.length;
        uint[] memory amounts = new uint[](length);

        for (uint256 i = 0; i < length; i++) {
            // TODO: ensure is owned
            _balances[ids[i]][walletAddress] = _balances[ids[i]][userAddress];
            _expiries[ids[i]][walletAddress] = _expiries[ids[i]][userAddress];
            amounts[i] = 1;
        }
        emit TransferBatch(operator, userAddress, walletAddress, ids, amounts);

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

    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165) returns (bool) {
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

    function validateAddress(address _address) public view returns (address) {
        return IKycRegistry(kycRegistry).getCurrentAddress(_address);
    }

    // @notice: NOOPs for non needed ERC1155 functions
    // TODO: for OpenSea this must be overriden in a special way, can't revert
    function setApprovalForAll(address operator, bool approved) external {}
 
    function isApprovedForAll(address account, address operator) external view returns (bool) {
    }

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
