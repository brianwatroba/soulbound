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
import "../interfaces/IBadgeSet.sol";
import "hardhat/console.sol";

/// @title BadgeSet
/// @author Brian watroba
/// @dev Modified ERC-1155 contract allowing for Soulbound (non-transferrable), semi-fungible NFT. Allows minting to a read-only, hashed user address as a "lite wallet". Users can also prove their identiy and claim their NFTs by linking their wallet to their hashed user address. Deployed from the BadgeSetFactory contract.
/// @custom:version 1.0.2
contract BadgeSet is Context, ERC165, IERC1155, IBadgeSet, Ownable, IERC1155MetadataURI {

    address public kycRegistry;
    uint96 public tokenTypeCount;
    mapping(address => mapping(uint256 => uint256)) private _ownershipBitmaps;
    mapping(uint256 => uint256) private _expiries; // id/address to badge expiration
    
    string private _uri;
    string private _contractURI;

    constructor(address _owner, address _kycRegistry, string memory _baseUri) {
        kycRegistry = _kycRegistry;
        setURI(string.concat(_baseUri, Strings.toHexString(uint160(address(this)), 20), "/"));
        setContractURI(string.concat(_baseUri, Strings.toHexString(uint160(address(this)), 20), "/"));
        transferOwnership(_owner);
    } 

    function uri(uint256 id) public view returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }
    
    function setURI(string memory newuri) public onlyOwner {
        _uri = newuri;
    }

    function setContractURI(string memory newuri) public onlyOwner {
        _contractURI = newuri;
    }
    
    function expiryOf(uint256 tokenId) public view returns (uint256) {
        return _expiries[tokenId];
    }

    function balanceOf(address account, uint256 id) public view returns (uint256 balance) {
        (uint96 _badgeType, address _address) = decodeTokenId(id);
        // TODO: added next line:
        address validatedAddress = validateAddress(_address);
        if (validatedAddress != account) return 0;
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
        emit TransitionWallet(kycAddress, walletAddress);
    }

    function transitionBitmap(uint256 bitmap, address kycAddress, address walletAddress) private {
        for(uint256 i = 0; i < 256; i++) {
            if (bitmap & (1 << i) > 0) {
                emit TransferSingle(_msgSender(), kycAddress, walletAddress, encodeTokenId(uint96(i), kycAddress), 1);

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
        _address = address(uint160(uint256(((bytes32(data) << 96) >> 96))));
    }

    // NOOPs for non needed ERC1155 functions

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
