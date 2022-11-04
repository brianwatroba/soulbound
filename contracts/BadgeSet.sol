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

// TODO: guards against minting way too high of a token
// TODO: don't redeploy bitmaps for every badge set

/**
* @title BadgeSet
* @author Brian watroba
* @dev Non-transferrable ERC1155 Token standard for accomplishments certifications, and proof of completion. Allows minting to a read-only, hashed user address as a "lite wallet". Users can also * * prove their identiy and claim their NFTs by linking their wallet to their hashed user address. Deployed from the BadgeSetFactory contract.
* @custom:version 1.0.3
*/
contract BadgeSet is Context, ERC165, IERC1155, IBadgeSet, Ownable, IERC1155MetadataURI {

    using BitMaps for BitMaps.BitMap;

    address public kycRegistry;
    string public contractURI;
    uint256 public maxTokenType;
    string private _uri;
    mapping(address => BitMaps.BitMap) private _balances;
    mapping(uint256 => uint256) private _expiries;
    address private constant ZERO_ADDRESS = address(0);
    uint256 private constant BITMAP_SIZE = 256;

    constructor(address _owner, address _kycRegistry, string memory _baseUri) {
        kycRegistry = _kycRegistry;
        setURI(string.concat(_baseUri, Strings.toHexString(uint160(address(this)), 20), "/")); // base + address(this) + /
        setContractURI(string.concat(_baseUri, Strings.toHexString(uint160(address(this)), 20), "/")); // base + address(this) + /
        transferOwnership(_owner);
    } 


    function uri(uint256 id) public view returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }

    function setURI(string memory newuri) public onlyOwner {
        _uri = newuri;
    }

    function setContractURI(string memory newuri) public onlyOwner {
        contractURI = newuri;
    }
    
    function expiryOf(uint256 tokenId) public view returns (uint256) {
        return _expiries[tokenId];
    }

    function balanceOf(address account, uint256 id) public view returns (uint256 balance) {
        (uint96 _badgeType, address _account) = decodeTokenId(id);
        address user = getUser(_account);
        if (user != account) return 0;
        BitMaps.BitMap storage bitmap = _balances[user];
        bool owned = BitMaps.get(bitmap, _badgeType);
        return owned ? 1 : 0;
    }

     function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory) {
        uint256 count = accounts.length;
        if (count != ids.length) revert ArrayParamsUnequalLength();
        uint256[] memory batchBalances = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        return batchBalances;
    }

    function mint(
        address to,
        uint96 tokenType,
        uint256 expiry
    ) external onlyOwner returns (uint256 tokenId) {
        address user = getUser(to);
        
        tokenId = _mint(user, tokenType, expiry);

        emit TransferSingle(_msgSender(), ZERO_ADDRESS, user, tokenId, 1);
        _doSafeTransferAcceptanceCheck(_msgSender(), ZERO_ADDRESS, user, tokenId, 1, "");
    }

    function mintBatch(
        address account,
        uint96[] memory tokenTypes,
        uint256[] memory expiries
    ) external onlyOwner returns (uint256[] memory tokenIds) {
        if (tokenTypes.length != expiries.length) revert ArrayParamsUnequalLength();
        address user = getUser(account);
        uint256 mintCount = tokenTypes.length;
        
        tokenIds = new uint[](mintCount);
        uint[] memory amounts = new uint[](mintCount); // used in event

        for (uint256 i = 0; i < mintCount; i++) {
            uint256 tokenId = _mint(user, tokenTypes[i], expiries[i]);
            tokenIds[i] = tokenId;
            amounts[i] = 1;
        }

        emit TransferBatch(_msgSender(), ZERO_ADDRESS, user, tokenIds, amounts);
        _doSafeBatchTransferAcceptanceCheck(_msgSender(), ZERO_ADDRESS, user, tokenIds, amounts, "");
    }

    function _mint(address user, uint96 tokenType, uint256 expiry) internal returns (uint256 tokenId) {
        tokenId = encodeTokenId(tokenType, user);

        bool isExpired = expiry > 0 && expiry <= block.timestamp;
        bool ownsToken = balanceOf(user, tokenId) > 0;
        if (isExpired) revert ExpiryAlreadyPassed(expiry);
        if (ownsToken) revert TokenAlreadyOwned(user, tokenType);
        
        BitMaps.BitMap storage balances = _balances[user];
        BitMaps.set(balances, tokenType);
        _expiries[tokenId] = expiry;  

        if (maxTokenType < tokenType) maxTokenType = tokenType;
    }

    function revoke(
        address account,
        uint96 badgeType
    ) public onlyOwner returns(uint256 tokenId) {
        address user = getUser(account);
        tokenId = _revoke(user, badgeType);
        emit TransferSingle(_msgSender(), user, ZERO_ADDRESS, tokenId, 1);
    }

    function revokeBatch(
        address account,
        uint96[] memory tokenTypes
    ) external onlyOwner returns (uint[] memory tokenIds) {
        address user = getUser(account);
        uint256 revokeCount = tokenTypes.length;

        tokenIds = new uint[](revokeCount);
        uint[] memory amounts = new uint[](revokeCount); // used in event
        
        for (uint256 i = 0; i < revokeCount; i++) {
            uint256 tokenId = _revoke(user, tokenTypes[i]);
            tokenIds[i] = tokenId;
            amounts[i] = 1;
        
        }
        emit TransferBatch(_msgSender(), user, ZERO_ADDRESS, tokenIds, amounts);
    }

     function _revoke(address user, uint96 badgeType) internal returns (uint256 tokenId) {
        tokenId = encodeTokenId(badgeType, user);
        if (balanceOf(user, tokenId) == 0) revert InsufficientBalance();
        BitMaps.BitMap storage balances = _balances[user];
        BitMaps.unset(balances, badgeType);
        delete _expiries[tokenId];
    }

    function moveUserTokensToWallet(address from, address to) external {
        if (getUser(from) != to) revert WalletNotLinked();
        uint256 bitmapCount = maxTokenType / BITMAP_SIZE;
        for (uint256 i = 0; i <= bitmapCount; i++) {
            uint256 bitmap = _balances[from]._data[i];
            if (bitmap != 0) {
                emitTransferEvents(bitmap, from, to);
                _balances[to]._data[i] = bitmap; // copy over ownership bitmap
                delete _balances[from]._data[i]; // delete old ownership bitmap
            }
        }
        emit TransitionWallet(from, to);
    }

    function emitTransferEvents(uint256 bitmap, address from, address to) private {
        for(uint256 i = 0; i < BITMAP_SIZE; i++) {
            if (bitmap & (1 << i) > 0) { // a token type is owned
                emit TransferSingle(_msgSender(), from, to, encodeTokenId(uint96(i), from), 1);
            }
        } 
    }

    function getUser(address account) internal view returns (address) {
        return IKycRegistry(kycRegistry).getLinkedWallet(account);
    }

    function encodeTokenId(uint96 tokenType, address account) public pure returns (uint256 tokenId){
        tokenId = uint256(bytes32(abi.encodePacked(tokenType, account)));
    }

    function decodeTokenId(uint256 tokenId) public pure returns (uint96 tokenType, address account) {
        tokenType = uint96(tokenId >> 160);
        account = address(uint160(uint256(((bytes32(tokenId) << 96) >> 96))));
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

    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * No-Ops for ERC1155 transfer and approval functions. BadgeSet tokens are Soulbound and cannot be transferred.
     */
    
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

}
