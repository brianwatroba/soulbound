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
import "../interfaces/IBadgeSet.sol";
import "./BitMaps.sol";
import "hardhat/console.sol";

// TODO: rename badge to token
// TODO: guards against minting way too high of a token
// TODO: don't redeploy bitmaps for every badge set
// TODO: bitmaps function to check an entire mask

/// @title BadgeSet
/// @author Brian watroba
/// @dev Non-transferrable ERC1155 Token standard for accomplishments, certifications, and proof of completion. Allows minting to a read-only, hashed user address as a "lite wallet". Users can also prove their identiy and claim their NFTs by linking their wallet to their hashed user address. Deployed from the BadgeSetFactory contract.
/// @custom:version 1.0.3
contract BadgeSet is Context, ERC165, IERC1155, IBadgeSet, Ownable, IERC1155MetadataURI {

    using BitMaps for BitMaps.BitMap;

    address public kycRegistry;
    string private _uri;
    string public _contractURI;

    uint96 public maxTokenType;
    mapping(address => BitMaps.BitMap) private _balances;
    mapping(uint256 => uint256) private _expiries; // badgeId to expiration timestamp
    
    address private constant ZERO_ADDRESS = address(0);

    constructor(address _owner, address _kycRegistry, string memory _baseUri) {
        kycRegistry = _kycRegistry;
        setURI(string.concat(_baseUri, Strings.toHexString(uint160(address(this)), 20), "/"));
        setContractURI(string.concat(_baseUri, Strings.toHexString(uint160(address(this)), 20), "/"));
        transferOwnership(_owner);
    } 

    function uri(uint256 id) public view returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
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
        address validatedAddress = getCorrectAccount(_address);
        if (validatedAddress != account) return 0;
        BitMaps.BitMap storage bitmap = _balances[validatedAddress];
        bool owned = BitMaps.get(bitmap, _badgeType);
        return owned ? 1 : 0;
    }

     function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
        if (accounts.length != ids.length) revert ArrayParamsUnequalLength();
        uint256[] memory batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        return batchBalances;
    }

    function _mint(address to, uint96 tokenType, uint256 expiry) internal {
            uint256 tokenId = encodeTokenId(tokenType, account);

            bool expired = expiry > 0 && expiry <= block.timestamp
            bool tokenAlreadyOwned = balanceOf(to, tokenId) > 0;
            if (expired) revert ExpiryAlreadyPassed(expiry);
            if (tokenAlreadyOwned) revert TokenAlreadyOwned(to, tokenType);
          
            BitMaps.BitMap storage balances = _balances[account];
            BitMaps.set(balances, tokenType);
            _expiries[tokenId] = expiry;  

            if (maxTokenType < tokenType) maxTokenType = tokenType;
    }

    function mint(
        address account,
        uint96 tokenType,
        uint256 expiry
    ) external onlyOwner returns (uint256 tokenId) {
        if (isExpired(expiry)) revert ExpiryAlreadyPassed(expiry);
        address validatedAddress = getCorrectAccount(account);
        tokenId = encodeTokenId(tokenType, validatedAddress);
        if (balanceOf(validatedAddress, tokenId) > 0) revert TokenAlreadyOwned();
        BitMaps.BitMap storage balances = _balances[validatedAddress];
        BitMaps.set(balances, tokenType);
        _expiries[tokenId] = expiry;
        if (maxTokenType < tokenType) maxTokenType = tokenType;
        emit TransferSingle(_msgSender(), ZERO_ADDRESS, validatedAddress, tokenId, 1);
        _doSafeTransferAcceptanceCheck(_msgSender(), ZERO_ADDRESS, validatedAddress, tokenId, 1, "");
    }

    function mintBatch(
        address to,
        uint96[] memory tokenTypes,
        uint256[] memory expiries
    ) external onlyOwner {
        if (tokenTypes.length != expiries.length) revert ArrayParamsUnequalLength();
        uint256 mintCount = tokenTypes.length;
        address account = getCorrectAccount(to);
        uint[] memory tokenIds = new uint[](mintCount);
        uint[] memory amounts = new uint[](mintCount);
        for (uint256 i = 0; i < mintCount; i++) {
            
            uint96 tokenType = tokenTypes[i];
            uint256 expiry = expiries[i];
            uint256 tokenId = encodeTokenId(tokenType, account);

            bool expired = expiry > 0 && expiry <= block.timestamp
            bool tokenAlreadyOwned = balanceOf(to, tokenId) > 0;
            if (expired) revert ExpiryAlreadyPassed(expiry);
            if (tokenAlreadyOwned) revert TokenAlreadyOwned();
          
            BitMaps.BitMap storage balances = _balances[account];
            BitMaps.set(balances, tokenType);
            _expiries[tokenId] = expiry;  

            if (maxTokenType < tokenType) maxTokenType = tokenType;
            tokenIds[i] = tokenId;
            amounts[i] = 1;
        }
        emit TransferBatch(_msgSender(), ZERO_ADDRESS, account, tokenIds, amounts);
        _doSafeBatchTransferAcceptanceCheck(_msgSender(), ZERO_ADDRESS, account, tokenIds, amounts, "");
    }

    function revoke(
        address account,
        uint96 badgeType
    ) public onlyOwner returns(uint256 tokenId) {
        address validatedAddress = getCorrectAccount(account);
        tokenId = encodeTokenId(badgeType, validatedAddress);
        if (balanceOf(validatedAddress, tokenId) == 0) revert InsufficientBalance();
        BitMaps.BitMap storage balances = _balances[validatedAddress];
        BitMaps.unset(balances, badgeType);
        delete _expiries[tokenId];
        emit TransferSingle(_msgSender(), validatedAddress, ZERO_ADDRESS, tokenId, 1);
    }

    function revokeBatch(
        address to,
        uint96[] memory badgeTypes
    ) external onlyOwner {
        address operator = _msgSender();
        address validatedAddress = getCorrectAccount(to);
        uint[] memory amounts = new uint[](badgeTypes.length);
        uint[] memory tokenIds = new uint[](badgeTypes.length);
        for (uint256 i = 0; i < badgeTypes.length; i++) {
            uint256 tokenId = encodeTokenId(badgeTypes[i], validatedAddress);
            if (balanceOf(validatedAddress, tokenId) == 0) revert InsufficientBalance();
            BitMaps.BitMap storage balances = _balances[validatedAddress];
            BitMaps.unset(balances, badgeTypes[i]);
            delete _expiries[tokenId];
        }
        emit TransferBatch(operator, validatedAddress, ZERO_ADDRESS, tokenIds, amounts);
    }

    function transitionWallet(address kycAddress, address walletAddress) external {
        if (getCorrectAccount(kycAddress) != walletAddress) revert WalletNotLinked();
        uint256 bitmapCount = maxTokenType / 256;
        for (uint256 i = 0; i <= bitmapCount; i++) {
            uint256 bitmap = _balances[kycAddress]._data[i];
            if (bitmap != 0) {
                transitionBitmap(bitmap, kycAddress, walletAddress);
                _balances[walletAddress]._data[i] = bitmap;
                delete _balances[kycAddress]._data[i];
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

    // function isExpired(uint256 expiry) internal view returns (bool) {
    //     return expiry > 0 && expiry <= block.timestamp;
    // }

    function getCorrectAccount(address _address) internal view returns (address) {
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

    function setApprovalForAll(address operator, bool approved) external pure {
        revert SoulboundTokenNoSetApprovalForAll(operator, approved);
    }
 
    function isApprovedForAll(address account, address operator) external pure returns (bool) {
        revert SoulboundTokenNoIsApprovedForAll(account, operator);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external pure {
        revert SoulboundTokenNoSafeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external pure {
        revert SoulboundTokenNoSafeBatchTransferFrom(from, to, ids, amounts, data);
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
                    revert ERC1155ReceiverRejectedTokens();
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert ERC1155ReceiverNotImplemented();
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
                    revert ERC1155ReceiverRejectedTokens();
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert ERC1155ReceiverNotImplemented();
            }
        }
    }
}
