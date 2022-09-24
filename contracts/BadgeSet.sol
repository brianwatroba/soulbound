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
import "hardhat/console.sol";

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
    uint96 public tokenTypeCount;
    mapping(address => mapping(uint256 => uint256)) private _ownershipBitmaps;
    mapping(uint256 => uint256) private _expiries; // id/address to badge expiration
    
    string private _uri;
    string private _contractURI;

    constructor(address _owner, address _kycRegistry, string memory uri_, string memory contractURI_) {
        kycRegistry = _kycRegistry;
        setURI(string.concat(uri_, Strings.toHexString(uint160(address(this)), 20), "/"));
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
    
    function expiryOf(uint256 tokenId) public view returns (uint256) {
        return _expiries[tokenId];
    }

    function balanceOf(address account, uint256 id) public view returns (uint256 balance) {
        (uint96 _badgeType, address _address) = decodeTokenId(id);
        if (_address != account) return 0;
        uint256 bitmapIndex = _badgeType / 256;
        uint256 bitmap = _ownershipBitmaps[account][bitmapIndex];
        uint256 bitValue = getBitValue(bitmap, _badgeType - (bitmapIndex * 256)); // correct number for in the 256 bit bitmap
        balance = bitValue > 0 ? 1 : 0;
    }

    function getBitValue(uint256 bitmap, uint256 tokenId) private pure returns(uint256){
        return bitmap & (1 << tokenId);
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
        uint96 badgeType,
        uint256 expiryTimestamp
    ) external onlyOwner returns (uint256 tokenId) {
        if (isExpired(expiryTimestamp)) revert ExpiryPassed();
        address validatedAddress = validateAddress(account);
        tokenId = encodeTokenId(badgeType, validatedAddress);
        if (balanceOf(validatedAddress, tokenId) > 0) revert TokenAlreadyOwned();
        uint256 bitmapIndex = badgeType / 256;
        uint256 bitmapChanged = _ownershipBitmaps[validatedAddress][bitmapIndex] | (1 << badgeType - (bitmapIndex * 256));
        _ownershipBitmaps[validatedAddress][bitmapIndex] = bitmapChanged; // set it to 1
        _expiries[tokenId] = expiryTimestamp;
        if (tokenTypeCount < badgeType) tokenTypeCount = badgeType;
        address operator = _msgSender();
        emit TransferSingle(operator, address(0), validatedAddress, tokenId, 1);
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
            uint256 bitmapIndex = badgeTypes[i] / 256;
            uint256 bitmapChanged = _ownershipBitmaps[validatedAddress][bitmapIndex] | (1 << badgeTypes[i] - (bitmapIndex * 256));
            _ownershipBitmaps[validatedAddress][bitmapIndex] = bitmapChanged; // set it to 1
            _expiries[tokenId] = expiryTimestamps[i];
            if (tokenTypeCount < badgeTypes[i]) tokenTypeCount = badgeTypes[i];
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
    ) public onlyOwner returns(uint256 tokenId) {
        address validatedAddress = validateAddress(account);
        tokenId = encodeTokenId(badgeType, validatedAddress);
        if (balanceOf(validatedAddress, tokenId) == 0) revert InsufficientBalance();
        uint256 bitmapIndex = badgeType / 256;
        uint256 bitmapChanged = _ownershipBitmaps[validatedAddress][bitmapIndex] &~ (1 << badgeType);
        _ownershipBitmaps[validatedAddress][bitmapIndex] = bitmapChanged; // set it to 0
        delete _expiries[tokenId];
        emit TransferSingle(_msgSender(), validatedAddress, address(0), tokenId, 1);
    }

    function revokeBatch(
        address to,
        uint96[] memory badgeTypes
    ) external onlyOwner {
        address operator = _msgSender();
        address validatedAccount = validateAddress(to);
        uint[] memory amounts = new uint[](badgeTypes.length);
        uint[] memory tokenIds = new uint[](badgeTypes.length);
        for (uint256 i = 0; i < badgeTypes.length; i++) {
            uint256 tokenId = revoke(validatedAccount, badgeTypes[i]);
            amounts[i] = 1;
            tokenIds[i] = tokenId;
        }
        emit TransferBatch(operator, validatedAccount, address(0), tokenIds, amounts);
    }

    function transitionWallet(address kycAddress, address walletAddress) external {
        if (validateAddress(kycAddress) != walletAddress) revert InvalidAddress();
        uint256 bitmapCount = tokenTypeCount / 256;
        for (uint256 i = 0; i <= bitmapCount; i++) {
            uint256 bitmap = _ownershipBitmaps[kycAddress][i];
            if (bitmap != 0) {
                transitionBitmap(bitmap, kycAddress, walletAddress);
                _ownershipBitmaps[walletAddress][i] = bitmap;
                delete _ownershipBitmaps[kycAddress][i];
            }
        }
    }

    function transitionBitmap(uint256 bitmap, address kycAddress, address walletAddress) private {
        for(uint256 i = 0; i < 256; i++) {
            if (bitmap & (1 << i) > 0) {
                emit TransferSingle(_msgSender(), address(0), walletAddress, encodeTokenId(uint96(i), walletAddress), 1);
                emit TransferSingle(_msgSender(), kycAddress, address(0), encodeTokenId(uint96(i), kycAddress), 1);
            }
        } 
    }

    function isExpired(uint256 expiryTimestamp) internal view returns (bool) {
        return expiryTimestamp > 0 && expiryTimestamp <= block.timestamp;
    }

    function validateAddress(address _address) public view returns (address) {
        return IKycRegistry(kycRegistry).getLinkedWallet(_address);
    }

    function encodeTokenId(uint96 _tokenType, address _address) public pure returns (uint256){
        return uint256(bytes32(abi.encodePacked(_tokenType, _address)));
    }

    function decodeTokenId(uint256 data) public pure returns (uint96 _tokenType, address _address) {
        _tokenType = uint96(data >> 160);
        _address = address(uint160(uint256(((bytes32(data) << 96) >> 96)))); // use this https://medium.com/@imolfar/bitwise-operations-and-bit-manipulation-in-solidity-ethereum-1751f3d2e216
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
