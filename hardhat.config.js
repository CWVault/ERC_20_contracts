/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require('@nomiclabs/hardhat-ethers');

 module.exports = {
  defaultNetwork: "ropston",
  networks: {
    hardhat: {
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    ropston: {
      url: "https://eth-ropsten.alchemyapi.io/v2/JIUw_JKrbJbJ66xPcrrlwch2NboJklbG",
      accounts: ["e282e539a62ce2f961911939e1ae90fb4ebca0974dfc7cc5136cca8aa82a6634"]
    }
  },
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}