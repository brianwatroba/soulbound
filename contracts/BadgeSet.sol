// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol';
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "../interfaces/IKycRegistry.sol";

error ZeroAddress();
error ExpiryPassed();
error SoulboundNoTransfer();
error ParamsLengthMismatch();
error InsufficientBalance();
error TokenAlreadyOwned();
error InvalidAddress();
error InvalidURI();
error AddressAlreadyTransitioned();

// Trigger it by doing balanceOf?

// TODO: don't let send to contracts
// TODO: largest tokenid storage
// TODO: write get single, 
// TODO: don't want contracts to receive? Remove IERC1155Receiver?
// TODO: move errors and events to IBadgeSet.sol
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
    mapping(address => mapping(uint256 => uint256)) private _ownershipBitmaps;
    mapping(uint256 => mapping(address => uint256)) private _expiries; // id/address to badge expiration
    string private _uri;
    string private _contractURI;

    constructor(address _owner, address _kycRegistry, string memory uri_, string memory contractURI_) {
        kycRegistry = _kycRegistry;
        setURI(uri_);
        setContractURI(contractURI_);
        transferOwnership(_owner);
    } 

    function uri(uint256 id) public view returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }
    
    function setURI(string memory newuri) public onlyOwner {
        _uri = newuri;
    }

    function contractURI() public view returns (string memory) {
        return _uri;
    }

    function setContractURI(string memory newuri) public onlyOwner {
        _contractURI = newuri;
    }
    
    // expiryOf() returns the expiry of the badge with the given id

    function balanceOf(address account, uint256 id) public view returns (uint256 balance) {
        (uint96 _badgeType, address _address) = decodeTokenId(id);
        if (_address != account) return 0;
        uint256 bitmapIndex = id / 256;
        uint256 bitmap = _ownershipBitmaps[account][bitmapIndex];
        uint256 bitValue = getBitValue(bitmap, _badgeType);
        balance = bitValue > 0 ? 1 : 0;
    }

    function getBitValue(uint256 bitmap, uint256 tokenId) private pure returns(uint256){
        return bitmap & (1 << tokenId);
    }

    // function setBitValue(uint256 storage bitmap, uint256 tokenId) private {
    //     bitmap = bitmap | (1 << tokenId);
    // }

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
        uint96 badgeType,
        uint256 expiryTimestamp
    ) external onlyOwner {
        if (isExpired(expiryTimestamp)) revert ExpiryPassed();
        address validatedAddress = validateAddress(account);
        uint256 tokenId = encodeTokenId(badgeType, validatedAddress);
        if (balanceOf(validatedAddress, tokenId) > 0) revert TokenAlreadyOwned();
        uint256 bitmapIndex = tokenId / 256;
        uint256 bitmap = _ownershipBitmaps[validatedAddress][bitmapIndex];
        bitmap = bitmap | (1 << badgeType); // set it to 1
        _expiries[tokenId][validatedAddress] = expiryTimestamp;
        address operator = _msgSender();
        emit TransferSingle(operator, validatedAddress, address(0), tokenId, 1);
        _doSafeTransferAcceptanceCheck(operator, address(0), validatedAddress, tokenId, 1, "");
    }

    function mintBatch(
        address to,
        uint96[] memory badgeTypes,
        uint256[] memory expiryTimestamps
    ) external onlyOwner {
        if (badgeTypes.length != expiryTimestamps.length) revert ParamsLengthMismatch();
        address validatedAddress = validateAddress(to);
        uint[] memory tokenIds = new uint[](badgeTypes.length);
        uint[] memory amounts = new uint[](badgeTypes.length);
        for (uint256 i = 0; i < badgeTypes.length; i++) {
            if (isExpired(expiryTimestamps[i])) revert ExpiryPassed();
            uint256 tokenId = encodeTokenId(badgeTypes[i], validatedAddress);
            if (balanceOf(validatedAddress, tokenId) > 0) revert TokenAlreadyOwned();
            uint256 bitmapIndex = tokenId / 256;
            uint256 bitmap = _ownershipBitmaps[validatedAddress][bitmapIndex];
            bitmap = bitmap | (1 << badgeTypes[i]); // set it to 1
            _expiries[tokenId][validatedAddress] = expiryTimestamps[i];
            tokenIds[i] = tokenId;
            amounts[i] = 1;
        }
        address operator = _msgSender();
        emit TransferBatch(operator, address(0), validatedAddress, tokenIds, amounts);
        _doSafeBatchTransferAcceptanceCheck(operator, address(0), validatedAddress, tokenIds, amounts, "");
    }

    function revoke(
        address account,
        uint96 badgeType
    ) public onlyOwner {
        if (balanceOf(account, badgeType) != 1) revert InsufficientBalance();
        address validatedAddress = validateAddress(account);
        uint256 tokenId = encodeTokenId(badgeType, validatedAddress);
        if (balanceOf(validatedAddress, tokenId) > 0) revert TokenAlreadyOwned();
        uint256 bitmapIndex = tokenId / 256;
        uint256 bitmap = _ownershipBitmaps[validatedAddress][bitmapIndex];
        bitmap = bitmap & (1 << badgeType); // set it to 0
        delete _expiries[tokenId][validatedAddress];
        emit TransferSingle(_msgSender(), validatedAddress, address(0), tokenId, 1);
    }

    function revokeBatch(
        address to,
        uint96[] memory badgeTypes
    ) external onlyOwner {
        address operator = _msgSender();
        address validatedAccount = validateAddress(to);
        uint[] memory amounts = new uint[](badgeTypes.length);
        for (uint256 i = 0; i < badgeTypes.length; i++) {
            revoke(validatedAccount, badgeTypes[i]);
        }
        // emit TransferBatch(operator, address(0), validatedAccount, badgeTypes, amounts); // can't be badge types, change
    }

    function isExpired(uint256 expiryTimestamp) internal view returns (bool) {
        return expiryTimestamp > 0 && expiryTimestamp <= block.timestamp;
    }

    function validateAddress(address _address) public view returns (address) {
        return IKycRegistry(kycRegistry).getCurrentAddress(_address);
    }

    function encodeTokenId(uint96 _tokenType, address _address) public pure returns (uint256){
        return uint256(bytes32(abi.encodePacked(_tokenType, _address)));
    }

    function decodeTokenId(uint256 data) public pure returns (uint96 _tokenType, address _address) {
        _tokenType = uint96(data >> 160);
        _address = address(uint160(uint256(((bytes32(data) << 96) >> 96))));
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
}
