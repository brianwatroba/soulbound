// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "../interfaces/IWalletRegistry.sol";
import "../interfaces/IBadgeSet.sol";
import "./BitMaps.sol";

/**
* @title BadgeSet
* @author Brian Watroba
* @notice Non-transferrable ERC1155 Token standard for accomplishments, certifications, and proof of completion
* @dev Standard ERC1155 approval and transfer functions are overridden to revert
* @custom:version 1.0.4
*/
contract BadgeSet is
    Context,
    ERC165,
    IERC1155,
    IBadgeSet,
    Ownable,
    IERC1155MetadataURI
{
    using BitMaps for BitMaps.BitMap;

    address public walletRegistry;
    uint96 public maxBadgeType;
    string public contractURI;
    string private _uri;
    mapping(address => BitMaps.BitMap) private _balances;
    mapping(uint256 => uint256) private _expiries;
    address private constant ZERO_ADDRESS = address(0);
    uint256 private constant BITMAP_SIZE = 256;

    constructor(
        address _owner,
        address _walletRegistry,
        string memory _baseUri
    ) {
        walletRegistry = _walletRegistry;
        setURI(
            string.concat(
                _baseUri,
                Strings.toHexString(uint160(address(this)), 20),
                "/"
            )
        ); // base + address(this) + /
        setContractURI(
            string.concat(
                _baseUri,
                Strings.toHexString(uint160(address(this)), 20),
                "/"
            )
        ); // base + address(this) + /
        transferOwnership(_owner);
    }

    /**
     * @notice Get token metadata URI
     * @param id token id
     * @return URI string
     */
    function uri(uint256 id) external view returns (string memory) {
        return string.concat(_uri, Strings.toString(id));
    }

    /**
     * @notice Get token expiry timestamp (unix)
     * @param tokenId token id
     * @return expiry timestamp (unix)
     */
    function expiryOf(uint256 tokenId) external view returns (uint256) {
        return _expiries[tokenId];
    }

    /**
     * @notice Get balances for a list of token/address pairs
     * @param accounts account addresses
     * @param ids token ids
     * @return array of balances for each token/address pair
     */
    function balanceOfBatch(
        address[] memory accounts,
        uint256[] memory ids
    ) external view returns (uint256[] memory) {
        uint256 count = accounts.length;
        if (count != ids.length) revert ArrayParamsUnequalLength();
        uint256[] memory batchBalances = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        return batchBalances;
    }

    /**
     * @notice Mint token to an account address
     * @dev Checks if "to" address param has an associated linked wallet (in WalletRegistry). If yes, mints to that address. If no, mints to the "to" address. Only callable by contract owner.
     * @param to Address to mint to
     * @param badgeType Desired badge type to mint (must not currently own)
     * @param expiry Token expiration timestamp (unix). If no expiry, input "0"
     * @return tokenId Token id of successfully minted token
     */
    function mint(
        address to,
        uint96 badgeType,
        uint256 expiry
    ) external onlyOwner returns (uint256 tokenId) {
        address user = getUser(to);

        tokenId = _mint(user, badgeType, expiry);

        emit TransferSingle(_msgSender(), ZERO_ADDRESS, user, tokenId, 1);
        _doSafeTransferAcceptanceCheck(
            _msgSender(),
            ZERO_ADDRESS,
            user,
            tokenId,
            1,
            ""
        );
    }

    /**
     * @notice Mint multiple tokens to an account address
     * @dev Checks if "to" address param has an associated linked wallet (in WalletRegistry). If yes, mints to that address. If no, mints to the "to" address. Only callable by contract owner.
     * @param account Address to mint to
     * @param badgeTypes Badge types to mint
     * @param expiries Token expiration timestamps (unix). If no expiries, input array of "0" (matching badgeTypes length)
     * @return tokenIds Token ids of successfully minted tokens
     */
    function mintBatch(
        address account,
        uint96[] memory badgeTypes,
        uint256[] memory expiries
    ) external onlyOwner returns (uint256[] memory tokenIds) {
        if (badgeTypes.length != expiries.length)
            revert ArrayParamsUnequalLength();
        address user = getUser(account);
        uint256 mintCount = badgeTypes.length;

        tokenIds = new uint[](mintCount);
        uint[] memory amounts = new uint[](mintCount); // used in event

        for (uint256 i = 0; i < mintCount; i++) {
            uint256 tokenId = _mint(user, badgeTypes[i], expiries[i]);
            tokenIds[i] = tokenId;
            amounts[i] = 1;
        }

        emit TransferBatch(_msgSender(), ZERO_ADDRESS, user, tokenIds, amounts);
        _doSafeBatchTransferAcceptanceCheck(
            _msgSender(),
            ZERO_ADDRESS,
            user,
            tokenIds,
            amounts,
            ""
        );
    }

    /**
     * @notice Revoke (burn) a token from an account address
     * @dev Checks if "account" address param has an associated linked wallet (in WalletRegistry). If yes, revokes from that address. If no, revokes from the "account" address. Only callable by contract owner. Deletes token expiry.
     * @param account Address to revoke from
     * @param badgeType Badge type to revoke (must currently own)
     * @return tokenId Token id of successfully revoked token
     */
    function revoke(
        address account,
        uint96 badgeType
    ) external onlyOwner returns (uint256 tokenId) {
        address user = getUser(account);
        tokenId = _revoke(user, badgeType);
        emit TransferSingle(_msgSender(), user, ZERO_ADDRESS, tokenId, 1);
    }

    /**
     * @notice Revoke (burn) multiple tokens from an account address
     * @dev Checks if "account" address param has an associated linked wallet (in WalletRegistry). If yes, revokes from that address. If no, revokes from the "account" address. Only callable by contract owner. Deletes token expiry.
     * @param account Address to revoke from
     * @param badgeTypes Desired badge types to revoke (must currently own)
     * @return tokenIds Token ids of successfully revoked tokens
     */
    function revokeBatch(
        address account,
        uint96[] memory badgeTypes
    ) external onlyOwner returns (uint[] memory tokenIds) {
        address user = getUser(account);
        uint256 revokeCount = badgeTypes.length;

        tokenIds = new uint[](revokeCount); // used in event, return value
        uint[] memory amounts = new uint[](revokeCount); // used in event

        for (uint256 i = 0; i < revokeCount; i++) {
            uint256 tokenId = _revoke(user, badgeTypes[i]);
            tokenIds[i] = tokenId;
            amounts[i] = 1;
        }

        emit TransferBatch(_msgSender(), user, ZERO_ADDRESS, tokenIds, amounts);
    }

    // TODO: this should have a return check value
    /**
     * @notice Transition tokens from a lite wallet to a linked real wallet
     * @dev Badge (token) ownership state is stored in bitmaps. To save gas, this function copies over the "from" address's bitmap state (1 uint256 for each 256 token types) to the "to" address, and emits individual transfer events in a loop.
     * @param from Address to transiton all tokens from
     * @param to Address to transition all tokens to
     */
    function moveUserTokensToWallet(address from, address to) external {
        if (getUser(from) != to) revert WalletNotLinked(to);
        uint256 bitmapCount = maxBadgeType / BITMAP_SIZE;
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

    // No-Ops for ERC1155 transfer and approval functions. BadgeSet tokens are Soulbound and cannot be transferred. Functions are included for ERC1155 interface compliance

    /** 
     * @notice will revert. Soulbound tokens cannot be transferred.
    */
    function setApprovalForAll(address operator, bool approved) external pure {
        revert SoulboundTokenNoSetApprovalForAll(operator, approved);
    }

    /** 
     * @notice will revert. Soulbound tokens cannot be transferred.
    */
    function isApprovedForAll(
        address account,
        address operator
    ) external pure returns (bool) {
        revert SoulboundTokenNoIsApprovedForAll(account, operator);
    }

    /** 
     * @notice will revert. Soulbound tokens cannot be transferred.
    */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external pure {
        revert SoulboundTokenNoSafeTransferFrom(from, to, id, amount, data);
    }

    /** 
     * @notice will revert. Soulbound tokens cannot be transferred.
    */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external pure {
        revert SoulboundTokenNoSafeBatchTransferFrom(
            from,
            to,
            ids,
            amounts,
            data
        );
    }

    /**
     * @notice Update token metadata base URI
     * @param newuri New URI
     */
    function setURI(string memory newuri) public onlyOwner {
        _uri = newuri;
    }

    /**
     * @notice Update contract metadata URI
     * @param newuri New URI
     */
    function setContractURI(string memory newuri) public onlyOwner {
        contractURI = newuri;
    }

    /**
     * @notice Get token balance of an account address
     * @param account Account address
     * @param id Token id
     * @return balance Token balance (1 or 0)
     */
    function balanceOf(
        address account,
        uint256 id
    ) public view returns (uint256 balance) {
        (uint96 _badgeType, address _account) = decodeTokenId(id);
        address user = getUser(_account);
        if (user != account) return 0;
        BitMaps.BitMap storage bitmap = _balances[user];
        bool owned = BitMaps.get(bitmap, _badgeType);
        return owned ? 1 : 0;
    }

    /**
     * @notice Returns a serialized token id based on a badgeType and owner account address
     * @dev Each user can only own one of each badge type. Serializing ids based on a badgeType and owner address allows us to have both shared, badgeType level metadata as well as individual token data (e.g. expiry timestamp). First 12 bytes = badgeType (uint96), next 20 bytes = owner address.
     * @param badgeType Badge type
     * @param account Owner account address
     * @return tokenId Serialized token id
     */
    function encodeTokenId(
        uint96 badgeType,
        address account
    ) public pure returns (uint256 tokenId) {
        tokenId = uint256(bytes32(abi.encodePacked(badgeType, account)));
    }

    /**
     * @notice Decodes a serialized token id to reveal its badgeType and owner account address
     * @param tokenId Serialized token id
     * @return badgeType Badge type
     * @return account Owner account address
     */
    function decodeTokenId(
        uint256 tokenId
    ) public pure returns (uint96 badgeType, address account) {
        badgeType = uint96(tokenId >> 160);
        account = address(uint160(uint256(((bytes32(tokenId) << 96) >> 96))));
    }

    /** 
     * @dev Verifies contract supports the standard ERC1155 interface
    */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /** 
     * @dev Internal shared function to mint tokens and set expiries
    */
    function _mint(
        address user,
        uint96 badgeType,
        uint256 expiry
    ) internal returns (uint256 tokenId) {
        tokenId = encodeTokenId(badgeType, user);

        bool isExpired = expiry > 0 && expiry <= block.timestamp;
        uint256 priorBalance = balanceOf(user, tokenId);
        if (isExpired) revert IncorrectExpiry(user, badgeType, expiry);
        if (priorBalance > 0)
            revert IncorrectBalance(user, badgeType, priorBalance); // token already owned

        BitMaps.BitMap storage balances = _balances[user];
        BitMaps.set(balances, badgeType);
        _expiries[tokenId] = expiry;

        uint96 nextPossibleNewBadgeType = uint96(maxBadgeType) + 1; // ensure new badgeTypes are one greater, pack bitmaps sequentially
        if (badgeType > nextPossibleNewBadgeType)
            revert NewBadgeTypeNotIncremental(badgeType, maxBadgeType);
        if (badgeType == nextPossibleNewBadgeType) maxBadgeType = badgeType;
    }

    /** 
     * @dev Internal shared function to revoke (burn) tokens and delete associated expiries
    */
    function _revoke(
        address user,
        uint96 badgeType
    ) internal returns (uint256 tokenId) {
        tokenId = encodeTokenId(badgeType, user);

        uint256 priorBalance = balanceOf(user, tokenId);
        if (priorBalance == 0)
            revert IncorrectBalance(user, badgeType, priorBalance); // token not owned

        BitMaps.BitMap storage balances = _balances[user];
        BitMaps.unset(balances, badgeType);
        delete _expiries[tokenId];
    }

    /** 
     * @dev Checks if an account address has an associated linked real wallet in WalletRegistry. If so, returns it. Otherwise, returns original account address param value
    */
    function getUser(address account) internal view returns (address) {
        return IWalletRegistry(walletRegistry).getLinkedWallet(account);
    }

    /** 
     * @dev Internal function to emit transfer events for each owned badge (used in transitioning tokens after wallet linking)
    */
    function emitTransferEvents(
        uint256 bitmap,
        address from,
        address to
    ) private {
        for (uint256 i = 0; i < BITMAP_SIZE; i++) {
            if (bitmap & (1 << i) > 0) {
                // token type is owned
                emit TransferSingle(
                    _msgSender(),
                    from,
                    to,
                    encodeTokenId(uint96(i), from),
                    1
                );
            }
        }
    }

    /** 
     * @dev ERC1155 receiver check to ensure a "to" address can receive the ERC1155 token standard, used in single mint
    */
    function _doSafeTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            // check if contract
            try
                IERC1155Receiver(to).onERC1155Received(
                    operator,
                    from,
                    id,
                    amount,
                    data
                )
            returns (bytes4 response) {
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

    /** 
     * @dev ERC1155 receiver check to ensure a "to" address can receive the ERC1155 token standard, used in batch mint
    */
    function _doSafeBatchTransferAcceptanceCheck(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            // check if contract
            try
                IERC1155Receiver(to).onERC1155BatchReceived(
                    operator,
                    from,
                    ids,
                    amounts,
                    data
                )
            returns (bytes4 response) {
                if (
                    response != IERC1155Receiver.onERC1155BatchReceived.selector
                ) {
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
