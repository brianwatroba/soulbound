# Soulbound 🪪

Non-transferrable ERC1155 Token standard. Designed to represent certifications, accomplishments, and proof of completion for anything--big or small.

## Access

Landing page: https://www.placeholderwebsite.com

DAPP: https://www.placeholderwebsite.com

_Alpha launching Winter 2022_

## Why build this?

What we do makes up who we are.

The problem: Our accomplishments don't really "live anywhere" where we can prove them, show them, and share them.

And if they do exist online, they're fragmented. Our career history is on LinkedIn. Our travel history is on Instagram. My PADI Scuba certification is a plastic card in my wallet. A few digital platforms have accrued the ultimate "power of endorsement" (blue checkmarks).

What if we were able to collect our experiences and accomplishments in a central place? What if the community involved in those experiences could issue them? And what if those accomplishments were totally trustworthy and provable?

## Our solution

A protocol for communities to issue proof of completion/endorsement for anything. Imagine a world where organizations can issue and govern their own blue checkmarks.

What's included:

- Token standard: open source ERC1155 Non-Tradeable token standard for communities to create, govern, mint, and manage the certifications that matter to them. (This repo).
- Community dapp (web2): client app for community token management, optional custodial wallet service, and metadata storage. Not required, but a method for less web3 savvy communities to create and manage their tokens without having to worry about wallets and crypto complexity.
- User dapp (web2): client app to view your Soulbound Tokens, prove ownership.

## Project North Stars

- Communities can issue provable certifications and endorsements to use for anything
- People have central control over their certifications and endorsements
- No fancy crypto stuff. Make this easy, delightful, and useful.

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

![Smart contract systems design](https://brianwatroba.s3.amazonaws.com/soulboundsc3.png)

## Contract addresses

#### Mainnet (Polygon)

- _BadgeSetFactory.sol:_ to be deployed
- _WalletRegistry.sol:_ to be deployed
- _BadgeSet.sol (Test1):_ to be deployed
- _BadgeSet.sol (Test2):_ to be deployed

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
