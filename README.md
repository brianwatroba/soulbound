# Soulbound 🪪

Non-transferrable ERC1155 token standard for accomplishments, certifications, and proof of completion.

Empowering communities to govern their own "blue checkmarks".

## Access

- Landing: https://www.placeholderwebsite.com
- App client: TBD

_Alpha launching Winter 2022_

## The problem

What we do makes up who we are.

But our accomplishments don't "live anywhere" central. And it's hard to prove and share them.

If they do exist online, they're scattered. Career history on LinkedIn. Travel history on Instagram. My scuba diving certification is a plastic card in my wallet.

What if we could collect our experiences in a central place? What if the community that shared in those accomplishments could issue them? What if they were provable and trustworthy? What if other apps and services could easily integrate them?

## Our solution

A protocol where:

- Communities can issue proof of completion/endorsement for _anything_
- Users can collect, share, and prove their endorsements without necessarily managing a wallet
- Other services and platforms can easily integrate, display, and build on top of these endorsements

## Use cases and examples

- **New York Road Runners (Marathon/Race Org):** issues race medals as Soulbound tokens to participants. Includes rich metadata for race placement, timing, age group, and charity involvement.
- **Padi Scuba Diving Organization:** represents various diving certifications (Open Water Diver, Underwater Hunter, Master Diver, etc.) via Soulbound tokens with expiration date stored on chain. Tokens are proveable and recognizable at any international dive shop.

## How it works

### 1. **Organization deploys a `BadgeSet` (contract)**

Org customizes their `BadgeSet` (contract-level) metadata and deploys it. Can manage via their own wallets, or use Soulbound's DAPP client with wallet custody (WIP).

### 2. **Organization creates `badgeTypes`**

`badgeTypes` are like token blueprints. For example: PADI may create a high level "Open Water Diver" certification badge, which has a base set of metadata, but that `badgeType` can be minted to any number of people. Each individual's badge can have token-level metadata, such as expiration, location of certification, etc. `badgeTypes` are fully customizable.

### 3. **Organization mints badges to users via `lite wallets`:**

Orgs can mint tokens to any address. However, they have the special ability to mint to a user's `lite wallet`.

A `lite wallet` is an address representing the hashed combination of a user's first name, last name, and phone number.

Because tokens are non-transferable and issued to real people, it does not matter if a user (or anyone) has the private key to the `lite wallet`. Instead, it acts as an escrow account that users can prove is theirs (via KYC) if they ever choose to (but not required).

### 4. **Users view their badges**

Users can view all Soulbound tokens minted to their `lite wallet` or real wallet via smart contract view functions, or via our DAPP client (WIP).

Openness and free discovery of tokens is important. In many cases, `lite wallets` will be enough for people to demonstrate token ownership, especially when there is already sufficient social trust (someone believes your name and phone number). This will give rise to all sorts of lightweight authentication and proof of completion, without the need for on-chain signatures.

With that said, users can still link their `lite wallets` to a real wallet to provide signing functionality and prove they own their tokens.

### 5. **Users can link `lite wallet` to real wallet**

A `lite wallet` can be associated with a real wallet if a user decides to link them. Once linked, a user can use their linked real wallet to sign transactions proving ownership of Soulbound tokens.

This can be very useful across a variety of applications. For example: showing Soulbound tokens on Instagram Collectibles, adding them to an OpenSea account, etc. These use cases will gain even more utility over time as more applications are built with token gating and proof of ownership.

In order to link a lite wallet to a real wallet, a user must verify their identity to ensure Soulbound tokens are not attributed to the wrong person. To start, this verification process will be centralized, but we will explore ways to decentralize it in the future.

Once wallets are linked:

1. A `lite wallet` to real wallet mapping is added to the `WalletRegistry` smart contract for reference
2. All `BadgeSets` will update their balances to point to the real wallet
3. any future mints to a lite wallet will automatically be forwarded to the real wallet.

Wallets can also be unlinked and re-linked.

### 6. **Badges can be used in a variety of applications**

Communities and users can use Soulbound tokens for a variety of use cases.

For instance: sharing and proving accomplishments online and through various platforms, token gating to services and events, replacement for ID or loyalty cards, and many more.

## Technical callouts:

- **Tokens are `ERC1155` compliant:** Soulbound tokens use the ERC1155 token interface, and are fully ERC1155 compliant. This means Soulbound tokens will show up on OpenSea or any protocol that supports the ERC1155 standard.

- **Tokens are non-transferable:** Soulbound tokens _cannot be transferred_ once they are minted. All ERC1155 standard transfer and approval functions (`transfer()`, `transferFrom()`, `setApprovalForAll()`) are overridden to revert. However, the issuing organization can `revoke` Soulbound tokens, effectively burning them for a given user. An organization can `revoke` and `mint` new tokens as many times as they'd like.

- **Token `expiry` stored on chain:** Soulbound token contracts store a specific token's expiration timestamp directly on chain (if provided at mint). This is queryable via the contract's `expiryOf()` function, and can be included in a token's metadata.

- **Metadata is customizable, can be hosted anywhere:** organizations can decide how they'd like to structure token metadata and where they'd like to host it. Soulbound will provide a centralized, out of the box metadata creation and storage solution if orgs decide to use it.

- **`Lite wallets`:** orgs can mint to any address, but they have the option to mint to a user's `lite wallet`. A lite wallet is a read-only ETH address representing the hashed combination of a user's first name, last name, and phone number. Because tokens are non-transferable and issued to real people, it does not matter if a user (or anyone) has the private key to the `lite wallet`. Instead, it acts as an escrow account that users can prove is theirs (via KYC) if they ever choose to.

- **`WalletRegistry` stores lite wallet mapping**: lite wallet to real wallet mapping is maintained in the separate `WalletRegistry` contract. This contract is the only centrally owned contract by the Soulbound protocol, as full KYC verification must be done centrally for cases where users want to link a wallet. We are exploring other KYC options to make this feature fully decentralized, but for the interim the registry is managed by the Soulbound organization. We're getting there!

- **`tokenIds` are serialized:** traditionally, ERC1155 tokenIds are sequential/static (`uint256`). Soulbound tokens, however, derive tokenIds by serializing a user's address (`address`) and the `badgeType` (`uint96`). Because each user can only have one of each `badgeType`, this allows for unique ids for each user/`badgeType` combination, and in turn the ability to blend both `badgeType` and user level metadata.

- **Bitmaps:** token ownership is represented via Bitmaps. Bitmaps are a great fit data structure because each user can only own one of each `badgeType`, and ownership state must be transitioned on-chain to a real wallet (if a user links) as gas-efficiently as possible. Copying over bitmaps is easy (a single `uint256` to store 256 badgeType ownership flags)! Individual key/value mappings are not a good fit for these use cases.

- **Orgs decide contract management/ownership:** Soulbound smart contracts are designed so that any community can deploy and manage their own contracts within the Soulbound ecosystem on their own and with their own wallets. However, we will also provide a number of custodial services and user-friendly front end clients to remove complexity and friction for communities (if they so choose).

- **Built on Polygon:** Soulbound smart contracts will be deployed to Polygon (to start). Polygon is a good fit for transaction costs, existing partnerships with other services (Instagram, etc), and EVM compatibility.

## Product timeline and roadmap

1. **Contracts drafted:** version 1.0 finished, deployed to testnet (_done_)
2. **Contracts finalized:** audited and deployed to mainnet (_January 2023_)
3. **Closed alpha:** 5 orgs, tokens managed and minted manually with white-glove service, gather feedback (_January 2023_)
4. **Client DAPPS:** Org and user front ends finished, allowing for self service signup, minting, basic wallet custody, and token management (_March 2023_)
5. **Open beta:** 25 orgs (_April 2023_)

## Risks and unsolved challenges:

- **Centralization of verifying wallet ownership during transition:** if a user decides to link a real wallet to their `lite wallet`, we must be sure that the user is who they say they are (and deserves the already minted badges in the lite wallet). In the future, we'll be exploring decentralized and community-based ID verification to do this, but for the initial launch we will be verifying each wallet link manually. Not ideal, but decentralization is important and we'll get there.

- **Token data is public:** a tradeoff with non-transferable tokens is that they exist on-chain, and so their data is public. If a user wishes to keep some accomplishments/verifications private, that isn't currently supported. This is an important protocol design consideration to minimize discrimination and maximize user privacy. This is a high priority, and we want to build towards a solution.

- **Token minting is permissionless:** in other words, users will always "have" minted tokens in their wallets, and will not be required to accept and approve them. Current token standards also work this way, and the filtering/hiding of unwanted tokens happens on the view layer (OpenSea, etc.). A request/approval feature for minted badges is interesting and something we're considering.

## System Design

![Smart contract systems design](https://brianwatroba.s3.amazonaws.com/soulboundsc5.png)

## Contract addresses

#### Mainnet (Polygon)

- _BadgeSetFactory.sol:_ `0xdAb981A6655e5E3b85b46e0f2D741537C60E8259`
- _WalletRegistry.sol:_ `0x60352Ff30f4698eA5FB0A2cf17D28Afe2CBeb775`
- _BadgeSet.sol (Test1):_ `0x72E8B2FcAd08F2dc0568Ab1A6eBcf09eC49d7b88`
- _BadgeSet.sol (Test2):_ `0xe686929B0Aad06AB8EF867506B72753392798687`

_Note: Mainnet contracts are still under development and not final_

#### Test (Polygon - Mumbai)

- _BadgeSetFactory.sol:_ `0xe3dbFA4C842A16f99fA2F685B72937C759E3e2E6`
- _WalletRegistry.sol:_ `0xfd8e336523b0f6F1f5DC343D9FB47c3c90C972E4`
- _BadgeSet.sol (Test1):_ `0xD850DA80Fc37fDe3D2eb1d4A5d5319B22A4Be45e`
- _BadgeSet.sol (Test2):_ `0x1eDc0DC5C5adb18EEA135BB8eA298B8E006fE975`

## Local setup

1. Clone repository: `git clone https://github.com/brianwatroba/soulbound.git`
2. Install base project dependencies: cd into root, run `npm install`
3. Add local .env file to project root. Include below env variables (replace keys with your own):

```bash
/.env

# Wallet private keys for deployment
POLYGON_PRIVATE_KEY=xxx
POLYGON_MUMBAI_PRIVATE_KEY=xxx

# Alchemy api URL (with your api key at end)
POLYGON_MAINNET_URL=https://polygon-mainnet.g.alchemy.com/v2/xxx
POLYGON_MUMBAI_URL=https://polygon-mumbai.g.alchemy.com/v2/xxx
POLYGON_MAINNET_KEY=xxx
POLYGON_MUMBAI_KEY=xxx

# Etherscan keys for contract verification (specific to chain)
ETHERSCAN_API_KEY=xxx
```

## Usage

1. Local testing: tests written in Chai/Mocha using Hardhat/Ethers.js. Run `npx hardhat test` for test suite.
2. Deployment to Polygon Test (Mumbai): ensure your .env file includes your Alchemy key, Polygon Mumbai wallet private key, as well as your etherscan key (for contract verification). Then run `npx hardhat run scripts/deployMumbai.ts --network polygon-mumbai`. Deploy script deploys BadgeSetFactory, two test BadgetSet contracts, WalletRegistry, and verifies all bytecode.
3. Deployment to other networks: add your desired network to the `networks` object in `hardhat-config.js` using the following format:

```javascript
/hardhat.config.js

polygon: {
      url: `https://polygon-mumbai.g.alchemy.com/v2${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.POLYGON_TEST_PRIVATE_KEY}`],
    },
```

And copy/edit one of the existing deploy scripts to work with your network of choice.

## Contributing

Pull requests are welcome. Thanks for your interest!

## License

[MIT](https://choosealicense.com/licenses/mit/)
