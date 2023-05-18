# Soulbound 🪪

Non-transferrable ERC1155 token standard for accomplishments, certifications, and proof of completion.

Empowering communities to govern their own "blue checkmarks".

<div style="display: flex;">
<img src="https://img.shields.io/badge/Solidity-e6e6e6?style=for-the-badge&logo=solidity&logoColor=black" height="20" />
<img src="https://img.shields.io/badge/Base-1652f0?style=for-the-badge&logo=data:image/png;base64,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" height="20" />
<img src="https://img.shields.io/badge/Hardhat-181a1f?style=for-the-badge&logo=data:image/png;base64,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" height="20" />
<img src="https://img.shields.io/badge/OpenZeppelin-f4f4f4?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAA5CAYAAAB0+HhyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAULSURBVHgB5ZlbTBxVGID//+zMLiAQiUJsxWiUekmwpIppm6gxmmhMlYvVF0m0wNKCirdUQWphUxqrNfJCE1tZhFCpKVp0oeD1wQc10RSTYsCqtTVWXjQFUovszOzM778YGgoIu2dmt45+LzvXnfnmP5f/nINFj/z6KAJeD25G4KCCiCVEVAIuhQAm0KO2C3A5Qojdfe05x90tgvDNmqtW7I5uulnEAsT6QACt6I5rRbhud4U6Vn46u+9OEaJIRESaWYZmD7lShBCbBjquPDH3mPtEEIYzzdQ98w+7ToRQberuvuTM/OOuEuEM5EBfR05osXOuEeFaHfZEItvnVvC5uEaEX7Sl98D5FXzeeReAeCyTTr+01CUKx+x7DtwR+BcjyNO4f3/BFPwfQEgSPFRAf592DVi0njPWfCLIJgR16ZuATPI+2VmKk8v9f8JFHuohb6ZPuxNR1HGat5bfLTXWe7l96g2W+jbGcq0CCaT6sJZvGPpb3IsVcEQgTiYV0mtivTghrdZMMXpfLzciOMQxLwAJLKKGvQ9k/Bbr9QkRqew3nuCf11nJCxJwpzei+3zdcd0DDlPdT3cYpjHAEmkghykUcXvbfeqX8dzkaET8g5RrmFq3DYkoB+OViOKoCBnGVg7ySpCE24PTKKwXQQLHRCpCeiG3+36wgQDaHixKPQkSONb8cpvPgx26CCRBhJ9yi337QBJHIlIVmi5jibUgCX8EAyzhD+DfMyIy2Bap7aFsi8QusIElrPeCpepnYAPbRWvaa0TT6ytAEm7/J1Qv1IFNbEWkMqSv4dzpYbABITXuvTf1Z7CJLRH+mtHKKd1noMDvzHFfEBxAWqQiFC7inOoWkIcssJ7uLMcwOICUyKaBs5ch4R6wg4CuN4tSPgaHkBJRdKUBbFRw7jT+4G58JzhI3CIVH9B1PGW5GWwgBAbai1OOg4PEJVL7I/lQMzp50wfyDOEKpRUcJi6R6WM6L9HROpCFwEKgxjcK0QCHiVnk+c8pwzLhNbCDwJ5gScogJICYRcZ/N17hfuNykAbHhWI1QYKISaSql67lclEFNuAi1dK2IeUHSBDLigSIBAktyHNQ0nkZz5+M5hZ7bSWWy7Hsy431m6UEeBvIY3I06uem6DXDk1kGpm7gEeFdHKurOVyXIpF0S8id8+ElJx9quilLT9e/4k+6CmQfgvh2W5FaFl0OeGyE0jVLq+aJumf4hPSQeMEzeN1kyYhEMoyd/FBpCS5Suuo1GxC9VH1Uy9cieg8L3JCI+c1/FKn8MJxnhmmLnWdyBWyKpuj+o/o67jg+4TKQDgli0coeCJCCGrayhAck4TH48MWp3lb/t9pqC61QIiWiLCpyarVRZhHcA7JwmfIIzwvpd8M0b3ZxGc6BBLNApHaQssFD29DGLCRH4+C++5XBX4b1epaSmvuNlwUi04ZRZ6eVYqYwAs1bRsOrOMvdCkniPJHyQ1M38TjhKbABT+20tD3oG4mYuINHkFmQJM4Vn81HSKUx/V2uG0UgDY6aE+rNakHkVku1PuLIJmWxNdqPnHsQS2y0JxFdKBPb1t8IJim0K1kSs8w8jKORxhLNYAMO7aEzhqf/6xSjio0KIcnMiFhj2g7+yQNJWEIzwXw2My+cy0tNL8MFQFT0ny3gpPBxsAEvdL7aUZJ2ChQR4N0MuAAoYHlVsKznQBaPMNK9f76z6SSlwJTxBf/XECQbk07Af4W/AI+CygKI3mZ1AAAAAElFTkSuQmCC" height="20" />
<img src="https://img.shields.io/badge/Alchemy-f4f4f4?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAVCAYAAACzK0UYAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHJSURBVHgBpVXdUcJAEN49SeCRDkwJOCM8icQO6MBYAVoBsQLoAKxERJ/AGezA0IG+mURuvU1MJn+Dl/g95fY2+93t7rcHUAOD0ZfXt4Me1ITQdRxc+i4AngLJGdQE6jj1bLIMCnbKuctrknizfTaXoAmtmxgycBOC+C+aKeIuaEIvXQjj/BK6pgxuQRNaJEgwryCechpBA0dJBkN/zGnZrNuuqsS+uG+Qv4D/kHBwErAwZOjyWh5OnKIPAtp8EGhKooo959wj0oS18fpirIjoqRyB/mzpShIOigjXqeFXG6FoO2VvtGIN1SQBKXOF5rT0h4HztkIPCO6L7oQwOdYEJRIOhoijUiBSBAqBMOfFJohamoKZFkkksIocE8ED14S/1W0+SAq3Itb4/CK0K+zQyi4igSHklEwAn6Ew3ayNR4oK6BWDfbdaJRsDM7ew1JXfSx6qBrFOmiO9iSH9JWBxXtJ+s+64nEY1IB/VrsaYJy/A9hmnNbFENWFBVRU7ESALUo+AgRZrLGeJSNRjFL0V2fMo4W3XHTvSDNEOakIexFXSLCJ9jApIhVfQjC7w5DBNvoUasU7pFJLuWHix8stp1CJhATd4qhvjB3LwvmsBYBzSAAAAAElFTkSuQmCC" height="20" />
</div>

---

## Access

- Landing: https://www.soulbound.fyi (coming soon)
- App client: TBD

_Alpha launching Summer 2023_

## The problem

What we do makes up who we are.

But our accomplishments don't "live anywhere" and it's hard to prove and share them.

If they do exist online, they're scattered. Career history is on LinkedIn. Travel history is on Instagram. My scuba diving certification is a plastic card in my wallet.

What if we could collect our experiences in a single place? What if the community that shared in those accomplishments could issue them? What if they were provable and trustworthy? What if other apps and services could easily integrate them?

## Our solution

A platform where:

- Communities can issue proof of completion/endorsement for _anything_
- Users can collect, share, and prove their endorsements without necessarily managing a wallet
- Other services and platforms can easily integrate, display, and build on top of these endorsements

## Use cases and examples

- **New York Road Runners (Marathon/Race Org):** issues race medals as Soulbound tokens to participants. Includes rich metadata for race placement, timing, age group, and charity involvement.
- **Padi Scuba Diving Organization:** represents various diving certifications (Open Water Diver, Underwater Hunter, Master Diver, etc.) via Soulbound tokens with expiration date stored on chain. Tokens are proveable and recognizable at any international dive shop.
- **Forbes 30 under 30 Award:** represents being a recipeient of the Forbes 30 under 30 award. This badge can then be shared across socials including Instagram (Instagram Collectibles) and Twitter.

## How it works

### 1. **Organization deploys a `BadgeSet` (contract)**

Org customizes their `BadgeSet` (contract-level) metadata and deploys it. Can manage via their own wallets, or use Soulbound's DAPP client with wallet custody (WIP).

### 2. **Organization creates `badgeTypes`**

`badgeTypes` are like token blueprints. For example: PADI may create a high level "Open Water Diver" certification badge, which has a base set of metadata, but that badgeType can be minted to any number of people. Each individual's badge can have token-level metadata, such as expiration, location of certification, etc. badgeTypes are fully customizable.

### 3. **Organization mints badges to users via `liteWallet`s:**

Orgs can mint tokens to any address. However, they have the special ability to mint to a user's liteWallet.

A liteWallet is an address representing the hashed combination of a user's first name, last name, and phone number.

Because tokens are non-transferable and issued to real people, it does not matter if a user (or anyone) has the private key to the liteWallet. Instead, it acts as an escrow account that users can prove is theirs (via KYC) if they ever choose to (but not required).

### 4. **Users view their badges**

Users can view all Soulbound tokens minted to their liteWallet or real wallet via smart contract view functions, or via our DAPP client (WIP).

Openness and free discovery of tokens is important. In many cases, liteWallets will be enough for people to demonstrate token ownership, especially when there is already sufficient social trust (someone believes your name and phone number). This will give rise to all sorts of lightweight authentication and proof of completion, without the need for on-chain signatures.

With that said, users can still link their liteWallets to a real wallet to provide signing functionality and prove they own their tokens.

### 5. **Users can link their `liteWallet` to a real wallet**

A liteWallet can be associated with a real wallet if a user decides to link them. Once linked, a user can use their linked real wallet to sign transactions proving ownership of Soulbound tokens.

This can be very useful across a variety of applications. For example: showing Soulbound tokens on Instagram Collectibles, adding them to an OpenSea account, etc. These use cases will gain even more utility over time as more applications are built with token gating and proof of ownership.

In order to link a liteWallet to a real wallet, a user must verify their identity to ensure Soulbound tokens are not attributed to the wrong person. To start, this verification process will be centralized, but we will explore ways to decentralize it in the future.

Once wallets are linked:

1. A liteWallet to real wallet mapping is added to the WalletRegistry smart contract for reference
2. All BadgeSets will update their balances to point to the real wallet
3. Any future mints to a liteWallet will automatically be forwarded to the real wallet.

Wallets can also be unlinked and re-linked.

### 6. **Badges can be used in a variety of applications**

Communities and users can use Soulbound tokens for a variety of use cases.

For instance: sharing and proving accomplishments online and through various platforms, token gating to services and events, replacement for ID or loyalty cards, and many more.

## Technical callouts:

- **Tokens are `ERC1155` compliant:** Soulbound tokens use the ERC1155 token interface, and are fully ERC1155 compliant. This means Soulbound tokens will show up on OpenSea or any protocol that supports the ERC1155 standard.

- **Tokens are non-transferable:** Soulbound tokens _cannot be transferred_ once they are minted. All ERC1155 standard transfer and approval functions (`transfer()`, `transferFrom()`, `setApprovalForAll()`) are overridden to revert. However, the issuing organization can `revoke` Soulbound tokens, effectively burning them for a given user. An organization can `revoke` and `mint` new tokens as many times as they'd like.

- **Token `expiry` stored on chain:** Soulbound token contracts store a specific token's expiration timestamp directly on chain (if provided at mint). This is queryable via the contract's `expiryOf()` function, and can be included in a token's metadata.

- **Metadata is customizable, can be hosted anywhere:** organizations can decide how they'd like to structure token metadata and where they'd like to host it. Soulbound will provide a centralized, out of the box metadata creation and storage solution if orgs decide to use it.

- **`liteWallet`s:** orgs can mint to any address, but they have the option to mint to a user's liteWallet. A liteWallet is a read-only ETH address representing the hashed combination of a user's first name, last name, and phone number. Because tokens are non-transferable and issued to real people, it does not matter if a user (or anyone) has the private key to the liteWallet. Instead, it acts as an escrow account that users can prove is theirs (via KYC) if they ever choose to.

- **`WalletRegistry` stores liteWallet mapping**: liteWallet to real wallet mapping is maintained in the separate WalletRegistry.sol contract. This contract is the only centrally owned contract by the Soulbound protocol, as full KYC verification must be done centrally for cases where users want to link a wallet. We are exploring other KYC options to make this feature fully decentralized, but for the interim the registry is managed by the Soulbound organization. We're getting there!

- **`tokenIds` are serialized:** traditionally, ERC1155 tokenIds are sequential/static (`uint256`). Soulbound tokens, however, derive tokenIds by serializing a user's address (`address`) and the badgeType (`uint96`). Because each user can only have one of each badgeType, this allows for unique ids for each user/badgeType combination, and in turn the ability to blend both badgeType and user level metadata.

- **Bitmaps:** token ownership is represented via Bitmaps. Bitmaps are a great fit data structure because each user can only own one of each badgeType, and ownership state must be transitioned on-chain to a real wallet (if a user links) as gas-efficiently as possible. Copying over bitmaps is easy (a single `uint256` to store 256 badgeType ownership flags)! Individual key/value mappings are not a good fit for these use cases.

- **Orgs decide contract management/ownership:** Soulbound smart contracts are designed so that any community can deploy and manage their own contracts within the Soulbound ecosystem on their own and with their own wallets. However, we will also provide a number of custodial services and user-friendly front end clients to remove complexity and friction for communities (if they so choose).

- **Built on Polygon:** Soulbound smart contracts will be deployed to Polygon (to start). Polygon is a good fit for transaction costs, existing partnerships with other services (Instagram, etc), and EVM compatibility.

## Product timeline and roadmap

1. **Contracts drafted:** version 1.0 finished, deployed to testnet (_done_)
2. **Contracts finalized:** audited and deployed to mainnet (_January 2023_)
3. **Closed alpha:** 5 orgs, tokens managed and minted manually with white-glove service, gather feedback (_January 2023_)
4. **Client DAPPS:** Org and user front ends finished, allowing for self service signup, minting, basic wallet custody, and token management (_March 2023_)
5. **Open beta:** 25 orgs (_April 2023_)

## Risks and unsolved challenges:

- **Centralization of verifying wallet ownership during transition:** if a user decides to link a real wallet to their liteWallet, we must be sure that the user is who they say they are (and deserves the already minted badges in the liteWallet). In the future, we'll be exploring decentralized and community-based ID verification to do this, but for the initial launch we will be verifying each wallet link manually. Not ideal, but decentralization is important and we'll get there.

- **Token data is public:** a tradeoff with non-transferable tokens is that they exist on-chain, and so their data is public. If a user wishes to keep some accomplishments/verifications private, that isn't currently supported. This is an important protocol design consideration to minimize discrimination and maximize user privacy. This is a high priority, and we want to build towards a solution.

- **Token minting is permissionless:** in other words, users will always "have" minted tokens in their wallets, and will not be required to accept and approve them. Current token standards also work this way, and the filtering/hiding of unwanted tokens happens on the view layer (OpenSea, etc.). A request/approval feature for minted badges is interesting and something we're considering.

## System Design

![Smart contract systems design](https://brianwatroba.s3.amazonaws.com/soulboundsc5.png)

## Contract addresses

#### Test (Base - Goerli)

- _BadgeSetFactory.sol:_ `0x41469267878F9F0cF668A1bda2daB9CdB3838e26`
- _WalletRegistry.sol:_ `0x62dD845af0614234865E5D2A15B8C133eDC51E1b`

## Local setup

1. Clone repository: `git clone https://github.com/brianwatroba/soulbound.git`
2. Install base project dependencies: cd into root, run `npm install`
3. Add local .env file to project root. Include below env variables (replace keys with your own):
4. If you're deploying, ensure you have Base Goerli ETH in your deployer address

```bash
/.env

# Wallet private keys for deployment
PRIVATE_KEY=xxx

# RPC URL
BASE_GOERLI_URL=https://goerli.base.org
```

## Usage

1. Local testing: tests written in Chai/Mocha using Hardhat/Ethers.js. Run `npx hardhat test` for test suite.
2. Deployment to Base (Goerli): ensure your .env file includes your `BASE_GOERLI_URL` and private key corresponding to a funded account. Then run `npx hardhat run scripts/deployContracts.ts --network base-goerli`. Deploy script deploys BadgeSetFactory, two test BadgetSet contracts, WalletRegistry, and verifies all bytecode.
3. Deployment to other networks: add your desired network to the `networks` object in `hardhat-config.ts` using the following format:

```typescript
/hardhat.config.ts

polygon: {
      url: `https://polygon-mumbai.g.alchemy.com/v2${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
```

And copy/edit one of the existing deploy scripts to work with your network of choice.

## Contributing

Pull requests are welcome. Thanks for your interest!

## License

[MIT](https://choosealicense.com/licenses/mit/)
