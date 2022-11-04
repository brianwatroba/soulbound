# Soulbound 🪪

Non-transferrable ERC1155 Token standard for accomplishments, certifications, and proof of completion.

Enabling communities to issue and govern their own blue checkmarks.

## Access

Landing page: https://www.placeholderwebsite.com
DAPP: https://www.placeholderwebsite.com

_Alpha launching Winter 2022_

## The problem

What we do makes up who we are.

But our accomplishments don't "live anywhere" where we can easily prove them, show them, and share them.

If they do exist online, they're fragmented. Our career history is on LinkedIn. Our travel history is on Instagram. My scuba diving certification is a plastic card in my wallet.

What if we could collect our experiences in a central place? What if the community that shared in those accomplishments could issue them? What if they were provable and trustworthy?

## Our solution

A protocol for communities to issue proof of completion/endorsement for _anything_.

Imagine a world where organizations issue and govern their own blue checkmarks.

## Use cases and examples

- **New York Road Runners (Marathon/Race Org):** issues race badges as Soulbound tokens to participants. They rich metadata for race placement, timing, age group, and charity involvement.
- **Padi Scuba Diving Organization:** represents various diving certifications (Open Water Diver, Underwater Hunter, Master Diver, etc.) via Soulbound tokens with expiration date stored on chain. Tokens are proveable and recognizeable at any international dive shop.

## How it works

1. **Organization creates and deploys a BadgeSet (contract):** org customizes their BadgeSet (contract-level) metadata and deploys. Can deploy and manage via their own wallets, or use Soulbound's DAPP front end and wallet custody.

2. **Organization creates Badge Types:** badge types are like blueprints for individual minted tokens. For example: PADI may create a high level "Open Water Diver" certification badge, which has a base set of metadata, but that token type can be minted to any number of people. And each individual can have token-level metadata, such as expiration, location of certification, etc. Badge types are fully customizeable.

3. **Organization mints badges to users via "lite wallets":** orgs can mint to any address, but they have the option to mint to a user's "lite wallet". A lite wallet is an address representing the hashed combination of a user's first name, last name, and phone number. Because tokens are non-transferable and issued to real people, it does not matter if a user (or anyone) has the private key to the lite wallet. Instead, it acts as an escrow account that users can prove is theirs (via KYC) if they ever choose to.

4. **Users view minted tokens:** users can view all Soulbound tokens minted to their lite wallet or hot wallet via smart contract view functions, or via our user DAPP. Openness and free discovery of tokens is important. In many cases, lite wallets will be enough for people to demonstrate ownership of Soulbound tokens, especially when people sufficiently trust a user has a particular name and phone number. That is up to the community and its people. This will give rise to all sorts of lightweight authentication and proof of completion, without the need for on-chain signatures.

5. **Users can link lite wallet to hot wallet:** a lite wallet can be associated with a real wallet if a user ever wants to. Once linked, a user can use a real wallet to sign transactions proving ownership of Soulbound tokens, which can be very useful accross a variety of applications. For instance: showing Soulbound tokens on Instagram Collectibles, adding them to an Open Sea account, etc. These use cases will gain even more utility over time as more applications are built with token gating and proof of ownership. In order to link a lite wallet to a real wallet, a user must verify their identity to ensure Soulbound tokens are not attributed to the wrong person. To start, this verification process will be centralized, but we will explore ways to decentralize it in the future. Once verified, a lite wallet to real wallet mapping is added to the WalletRegistry smart contract, all BadgeSets will update balances to the real wallet, and any future mints to a lite wallet will be automatically forwarded to the real wallet.

6. **Badges can be used in a variety of applications:** communities and users can use Soulbound tokens for a variety of use cases. For instance: sharing and proving accomplishments online and through various platforms, token gating to services and events, replacement for ID or loyalty cards, and many more.

## Technical callouts:

- **Lite wallets:** orgs can mint to any address, but they have the option to mint to a user's "lite wallet". A lite wallet is an address representing the hashed combination of a user's first name, last name, and phone number. Because tokens are non-transferable and issued to real people, it does not matter if a user (or anyone) has the private key to the lite wallet. Instead, it acts as an escrow account that users can prove is theirs (via KYC) if they ever choose to.

- **WalletRegistry**: lite wallet to real wallet mapping is maintained in the separate WalletRegistry contract. This contract is the only centrally owned contract by the Soulbound protocol, as full KYC verification must be done centrally for cases where users want to link a wallet. We are exploring decentralized KYC options to make this feature decentralized as well, but for the interim the registry is managed by the Soulbound organization.

- **Serialized `tokenIds`:** traditionally, ERC1155 tokenIds are sequential/static (uint256). Soulbound tokens, however, derive tokenIds by serializing a user's address and the tokenType (uint96). Because each user can only have one of each tokenType, this allows for unique ids for each user/tokenType combination, and in turn the ability to blend both tokenType and user level metadata.

- **Contract management/ownership:** Soulbound smart contracts are designed so that any community can deploy and manage their own contracts within the Soulbound ecosystem on their own and with their own wallets. However, we will also provide a number of custodial services and user-friendly front ends to remove complexity and friction for commnunities.

## Structure

![Smart contract systems design](https://brianwatroba.s3.amazonaws.com/soulboundsc4.png)

## Contract addresses

#### Mainnet (Polygon)

- _BadgeSetFactory.sol:_ `0xdAb981A6655e5E3b85b46e0f2D741537C60E8259`
- _WalletRegistry.sol:_ `0x60352Ff30f4698eA5FB0A2cf17D28Afe2CBeb775`
- _BadgeSet.sol (Test1):_ `0x72E8B2FcAd08F2dc0568Ab1A6eBcf09eC49d7b88`
- _BadgeSet.sol (Test2):_ `0xe686929B0Aad06AB8EF867506B72753392798687`

_Note: Mainnet contracts are still under development (alpha)_

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

ALCHEMY_API_KEY=XXX
POLYGON_PRIVATE_KEY=xxx
```

## Usage

1. Local testing: tests written in Chai/Mocha using Hardhat/Ethers.js. Run `npx hardhat test` for test suite.
2. Deployment to Polygon Test (Mumbai): ensure your .env file includes your Rinkeby private key. Then run `npx hardhat run scripts/deployMumbai.ts --network polygon-mumbai`. Deploy script only deploys the ProjectFactory.sol contract.
3. Deployment to other test nets: add your desired network to the `networks` object in `hardhat-config.js` using the following format:

```javascript
/hardhat.config.js

polygon: {
      url: `https://polygon-mumbai.g.alchemy.com/v2${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.POLYGON_TEST_PRIVATE_KEY}`],
    },
```

## Contributing

Pull requests are welcome. Thanks for your interest!

## License

[MIT](https://choosealicense.com/licenses/mit/)
