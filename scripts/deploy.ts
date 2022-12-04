const { expect } = require("chai");
const { ethers } = require("hardhat");
const ERC721 = require('@openzeppelin/contracts/build/contracts/ERC721.json');

async function deploy() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://18.208.114.170:9080/GetPlotInfo?PlotId='); //Change to subdomain
        console.log(hardhatRuniverseContract.address);
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        console.log(hardhatRuniverseMinterContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        //Add final values
        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('20000'), ethers.BigNumber.from('200000') ,ethers.BigNumber.from('20000') ,ethers.BigNumber.from('20000') ,ethers.BigNumber.from('20000')];
        const mintClaimStartTime = ethers.BigNumber.from('0');
        const mintListStartTime = ethers.BigNumber.from('0');
        const mintStartTime = ethers.BigNumber.from('0');

        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);
        


        //Vesting setup
        await hardhatRuniverseContract.setVestingEnabled( false );
        //await hardhatRuniverseContract.setLastVestingGlobalId( 5 );

        //Sets vesting times 
        /*const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const startTimeVesting = blockBefore.timestamp + 10;
        const endTimeVesting = blockBefore.timestamp + 20;
        await hardhatRuniverseContract.setVestingStart( startTimeVesting );
        await hardhatRuniverseContract.setVestingEnd( endTimeVesting );*/

  }
  
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });