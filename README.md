# Soulbound 🪪

Non-transferrable ERC1155 Token standard for accomplishments, certifications, and proof of completion.

## Access

Landing page: https://www.placeholderwebsite.com

DAPP: https://www.placeholderwebsite.com

_Alpha launching Winter 2022_

## The problem

What we do makes up who we are.

Our accomplishments don't "live anywhere" where we can easily prove them, show them, and share them.

If they do exist online, they're fragmented. Our career history is on LinkedIn. Our travel history is on Instagram. My PADI Scuba certification is a plastic card in my wallet.

What if we were able to collect our experiences in a central place? What if the community involved in those accomplishments could issue them? What if they were totally provable and trustworthy?

## Our solution

A protocol for communities to issue proof of completion/endorsement for _anything_.

Imagine a world where organizations issue and govern their own blue checkmarks.

## Products

#### TOKEN STANDARD:

Soulbound is an open source non-transferrable token standard (ERC1155 compliant interface). Communities can use it to create, govern, mint, and manage the certifications that matter to them. (This repo).

#### DAPP FOR COMMUNITIES:

Client app for community token management, optional custodial wallet service, and metadata storage. Not required, but a method for less web3 savvy communities to create and manage their tokens without having to worry about wallets and crypto complexity.

#### DAPP FOR USERS:

client app for people to view their Soulbound Tokens, prove ownership.

## Project North Stars

1. Communities can issue provable certifications and endorsements to use for anything
2. People have central control over their certifications and endorsements
3. No fancy crypto stuff. Make this easy, delightful, and useful.

## How it works

- **Organization creates and deploys a BadgeSet (contract):** _to finish_
- **Organization creates Badge Types:** _to finish_
- **Organization mints badges to users via "lite wallets":** _to finish_
- **Users view minted tokens:** _to finish_
- **Users can link lite wallet to hot wallet:** _to finish_
- **Badges can be used in a variety of applications:** _to finish_

Technical callouts:

- Lite wallets: _to finish_
- Wallet linking and ID verification: _to finish_
- Contract management/ownership: _to finish_
- Using Soulbound web2 management apps: _to finish_

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
