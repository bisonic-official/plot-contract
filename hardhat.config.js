require("@nomicfoundation/hardhat-toolbox");
require('solidity-coverage');
require('hardhat-deploy');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer: 'privatekey://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    ronin: {
      chainId: 2020,
      url: 'https://api.roninchain.com/rpc',
      gasPrice: 20_000_000_000,
    },
    saigon: {
      chainId: 2021,
      url: 'https://saigon-testnet.roninchain.com/rpc',
      gasPrice: 20_000_000_000,
    }
  }
};