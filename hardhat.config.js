require("@nomicfoundation/hardhat-toolbox");

const ALCHEMY_API_KEY = "Xl0pm6KtG500eaYf2p89MHHJWdqbVSVh";
const GOERLI_PRIVATE_KEY = "4f768fd6721871e27706d8c43470b890e29d1c361c5e9594303e5b0df51ec0df";

module.exports = {
    networks: {
        hardhat: {
            hardfork: "london",
            // base fee of 0 allows use of 0 gas price when testing
            initialBaseFeePerGas: 0,
            // brownie expects calls and transactions to throw on revert
            throwOnTransactionFailures: true,
            throwOnCallFailures: true
       },
       goerli: {
        url: 'https://eth-goerli.g.alchemy.com/v2/Xl0pm6KtG500eaYf2p89MHHJWdqbVSVh',
        accounts: ['4f768fd6721871e27706d8c43470b890e29d1c361c5e9594303e5b0df51ec0df']
      }
    },
    solidity:{
        compilers: [
          {
            version: "0.8.0",
          },
          {
            version: "0.8.6",
          }
        ],
      },
}