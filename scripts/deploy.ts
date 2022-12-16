const { expect } = require("chai");
const { ethers } = require("hardhat");
const ERC721 = require('@openzeppelin/contracts/build/contracts/ERC721.json');

async function deploy() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('https://api.runiverse.world/GetPlotInfo?PlotId=');
        console.log('Runiverse Main Address:', hardhatRuniverseContract.address);
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        console.log('Runiverse Minter Address:', hardhatRuniverseMinterContract.address);
        await hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);
  }
  
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });