
# Overview

This contract mints plots of land for Forgotten Runiverse, an MMO based on the Forgotten Runes IP. The plot TokenId represents both the identity of the plot and the type of plot (explained in the **TokenId** section). There are 5 plot sizes:

* 8x8
* 16x16
* 32x32
* 64x64
* 128x128

There are 4 phases:

* Private sale minting:
    * At the beginning, 10924 plots will be minted and distributed to investors. Those plots will be transfer timelocked, explained in the **Vesting** section. A csv table with wallets and a number of plots of each size will be used. Owner wallet will pay all the gas cost.
    * Note that 128x128 plots are not intended to be available during the public sale. Only 1 128x128 is minted during the private sale. The rest are intended for auction at a later date.
* Claim list:
    * A whitelist of addresses that will be able to claim plots. This whitelist is stored in a Merkle tree and it includes the amount of plots of each size the address can claim. There is no plot cost, only gas cost for the address.
* Mint list:
    * A whitelist of addresses that will be able to buy plots before the public sale. This whitelist is stored in a Merkle tree and it includes the amount of plots of each size the address can buy. The address has to pay the plot cost and gas cost.
* Public mint:
    * Any wallet can buy plots.

Plot properties are defined on the game server. The TokenId is meant to uniquely identify the type and identity of plot for interoperability with the game server, which assigns properties (explained in the **TokenId** section). 

# Scope


### Files in scope
|File|SLOC|Description|Libraries|
|:-|:-:|:-|:-|
|_Contracts (2)_|
|[contracts/RuniverseLand.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLand.sol) [💰](#nowhere "Payable Functions") [📤](#nowhere "Initiates ETH Value Transfer")|108|Contract in charge of minting. This contract contains all the tokens. This contract stores the URI and vesting initial values. A minter contract is attached to this contract.| [`@openzeppelin/*`](https://openzeppelin.com/contracts/)|
|[contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol) [💰](#nowhere "Payable Functions") [📤](#nowhere "Initiates ETH Value Transfer") [🧮](#nowhere "Uses Hash-Functions")|325|Contract in charge of receiving the mint requests. This contract validates all the rules (owner plot, mint list, claim list and public mint)| [`@openzeppelin/*`](https://openzeppelin.com/contracts/)|
|_Abstracts (1)_|
|[contracts/ERC721Vestable.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/ERC721Vestable.sol)|70|ERC721 class with a _beforeTokenTransfer modification. A vesting property is implemented, so the plots can't be transferred until a certain time is reached.| [`@openzeppelin/*`](https://openzeppelin.com/contracts/)|
|_Interfaces (1)_|
|[contracts/IRuniverseLand.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/IRuniverseLand.sol)|27|Interface for the main contract (RuniverseLand.sol)||
|Total (over 4 files):| 530 ||




## External imports
* **@openzeppelin/contracts/access/Ownable.sol**
  * [contracts/ERC721Vestable.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/ERC721Vestable.sol)
  * [contracts/RuniverseLand.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLand.sol)
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)
* **@openzeppelin/contracts/security/ReentrancyGuard.sol**
  * [contracts/ERC721Vestable.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/ERC721Vestable.sol)
  * [contracts/RuniverseLand.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLand.sol)
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)
* **@openzeppelin/contracts/token/ERC20/IERC20.sol**
  * [contracts/ERC721Vestable.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/ERC721Vestable.sol)
  * [contracts/RuniverseLand.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLand.sol)
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)
* **@openzeppelin/contracts/token/ERC721/ERC721.sol**
  * [contracts/ERC721Vestable.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/ERC721Vestable.sol)
  * [contracts/RuniverseLand.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLand.sol)
* **@openzeppelin/contracts/utils/Address.sol**
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)
* **@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol**
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)
* **@openzeppelin/contracts/utils/cryptography/ECDSA.sol**
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)
* **@openzeppelin/contracts/utils/cryptography/MerkleProof.sol**
  * [contracts/RuniverseLandMinter.sol](https://github.com/code-423n4/2022-12-forgotten-runiverse/blob/master/contracts/RuniverseLandMinter.sol)


# Additional Context

## Token Format
The TokenId is stored in a uint256 format. However, the token represents multiple values, not only the consecutive minted plot id. Those are the values encoded in the TokenId:

* **Plot Size**
    * The first 8 bits (From bit 0 to bit 7)
        * 0 represents a Plot Size of 8x8
        * 1 represents a Plot Size of 16x16
        * 2 represents a Plot Size of 32x32
        * 3 represents a Plot Size of 64x64
        * 4 represents a Plot Size of 128x128
* **Loca ld**: Consecutive number within its Plot Size
    * The next 32 bits, (from bit 8 to bit 39)
    * For example, the 15th minted plot of size 8x8
* **Global Id**: consecutive number of all the minted plots
    * The next 32 bits, (from bit 40 to bit 71)
    * For example, the 35th minted plot of any size

For example, if we are minting the 11th plot of size 64x64, and it is the 45th minted plot over all the sizes, the TokenId will look like this:

* Data encoded (right is the least significant bit ):
    * [45][11][3]
* Binary format will look like (right is the least significant bit ):
    * 1011010000000000000000000000000000101100000011
* Decimal format will look like:
    * 49478023252739
* Mask:
    * **(GlobalId<<40) + (LocalId<<8) + uint256(PlotSize)**

## Vesting


The vesting method restricts the plots to be transferred to another wallet before some specific date.

The date transfer is different for each plot and it is distributed uniformly based on the Global Id.

For example, if the total vesting duration is 100 days and there are total 5 minted plots with vesting property, then each plot will unlock in the next days:

* Plot with Global Id 1 will unlock in the day 20
* Plot with Global Id 2 will unlock in the day 40
* Plot with Global Id 3 will unlock in the day 60
* Plot with Global Id 4 will unlock in the day 80
* Plot with Global Id 5 will unlock in the day 100


In order to have a fair distribution, the minting order is randomized. A list of all desired individual mints is generated. Then, a Fisher-Yates shuffle is used to randomize the list. This algorithm makes sure that the probability is uniform and each mint has the same chance to be minted in a specific order.

A seeded uniform random generator number is used, so it is always a deterministic result.

* Random permutation method: **scripts/private_mint.ts::random_shuffle**
* Seeded uniform normalized random: **scripts/private_mint.ts::random**

For the final private minting with vesting, 10924 plots will be minted and the vesting period will be 2 years. The script allows to call the minting in consecutive segments changing **MINT_LIST_START** and **MINT_LIST_END**, but keeping always the same **SEED** value.

## Scoping Details 
```
- If you have a public code repo, please share it here: https://github.com/bisonic-official/plot-contract
- How many contracts are in scope?: 4
- Total SLoC for these contracts?:  671
- How many external imports are there?: 8  
- How many separate interfaces and struct definitions are there for the contracts within scope?:  1
- Does most of your code generally use composition or inheritance?:   balanced
- How many external calls?:   0
- What is the overall line coverage percentage provided by your tests?:  80
- Is there a need to understand a separate part of the codebase / get context in order to audit this part of the protocol?:   no
- Please describe required context:   none
- Does it use an oracle?:  no
- Does the token conform to the ERC20 standard?:  ERC721
- Are there any novel or unique curve logic or mathematical models?: Only weird thing in the contract is vesting for a certain number of private sale plots which only works if the private sale plot mint order is randomly shuffled (ie, if several people bought tranches of NFTs in the private sale, their tranches are broken up into individual mint commands that are randomly shuffled with the other investors).
- Does it use a timelock function?:  Yes, there are public mint periods and vesting periods preventing transfer of NFTs
- Is it an NFT?: Yes
- Does it have an AMM?:   No
- Is it a fork of a popular project?:   No
- Does it use rollups?:   No
- Is it multi-chain?:  No
- Does it use a side-chain?: No
```

# Tests
## Environment

* Maker sure you have the following environment:
    * Node version: 18.0.0
    * Npm version: 8.6.0
    * Npx version: 0.39.2
    * Nvm version: 0.39.2
    * Solidity compilers: 0.8.0, 0.8.6
* Libraries (included in package.json)
    * hardhat: "^2.12.2"
    * @nomicfoundation/hardhat-toolbox: "^2.0.0"
    * @openzeppelin/contracts: "^4.2.0"
    * chai: "^4.3.7"
    * ethers: "^5.7.2"
* Tested with WLS2 in Windows 10
* Addresses used:
    * 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
        * Owner/Signer
        * Whitelisted in the unit test with 2 plots of 8x8 (plot index 0)
    * 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        * Whitelisted in the unit test with 2 plots of 8x8 (plot index 0)
* [`Hardhat environment setup`](https://hardhat.org/tutorial/setting-up-the-environment)

## Quickstart command
`rm -Rf 2022-12-forgotten-runiverse || true && git clone https://github.com/code-423n4/2022-12-forgotten-runiverse.git -j8 && cd 2022-12-forgotten-runiverse && nvm install 18.0 && npm install && npx hardhat compile && REPORT_GAS=true npx hardhat test`


## Run and Test

1. Clone the project in a new folder.
1. Run `npm install` to install all the dependencies.
1. Run `npx hardhat compile` to compile the contract.
1. Run `npx hardhat test` to run the unit tests.
1. Open a new terminal and run `npx hardhat node` to start a node in localhost.
1. Run in the original terminal `npx hardhat run scripts/desploy.ts --network localhost` to deploy the contract to the local network.
    * Two addresses will be printed. RuniverseLand address and RuniverseLandMinter address.
1. Modify runiverseMinterContractAddress and runiverseContractAddress in scripts/private_mint.ts with the new addresses. 
1. Run in the original terminal `npx hardhat run scripts/vesting.ts --network localhost` to 



NOTE: Slither does not currently work on the repo. If you find a workaround, please share in the discord.