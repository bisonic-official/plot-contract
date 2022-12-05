const { expect } = require("chai");
const { ethers } = require("hardhat");
const ERC721 = require('@openzeppelin/contracts/build/contracts/ERC721.json');

describe("Deploy Test", function () {
  it("Deployment should work for contract and minter.", async function () {
    const [owner] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
    
    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract);
    
  });
});


describe("Setters and getters test", function () {
    it("All the getters and setters should work.", async function () {
        const [owner] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(owner.address);

        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('1'), ethers.BigNumber.from('2') ,ethers.BigNumber.from('3') ,ethers.BigNumber.from('4') ,ethers.BigNumber.from('5')];
        const mintClaimStartTime = ethers.BigNumber.from('100');
        const mintListStartTime = ethers.BigNumber.from('200');
        const mintStartTime = ethers.BigNumber.from('300');

        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

        //Big numbers problem
        expect((await hardhatRuniverseMinterContract.getPlotPrices())).to.deep.equal(plotPrices)
        expect((await hardhatRuniverseMinterContract.getPlotsAvailablePerSize())).to.deep.equal(plotsAvailable)

        //expect(await hardhatRuniverseMinterContract.publicMintStartTime).to.deep.equal(mintStartTime);
      //  expect(await hardhatRuniverseMinterContract.mintlistStartTime).to.deep.equal(mintListStartTime);
      //  expect(await hardhatRuniverseMinterContract.claimsStartTime).to.deep.equal(mintClaimStartTime);

    });
  });

  describe("Vesting", function () {
    it("Owner minting and vesting should work.", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('10'), ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10')];
        const mintClaimStartTime = ethers.BigNumber.from('0');
        const mintListStartTime = ethers.BigNumber.from('0');
        const mintStartTime = ethers.BigNumber.from('0');



        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

        await hardhatRuniverseContract.setVestingEnabled( true );
        await hardhatRuniverseContract.setLastVestingGlobalId( 5 );

        
       //Mints an extra plot
       for(let counter = 0; counter<6; counter ++)
            await hardhatRuniverseMinterContract.ownerMint(0 , 1, owner.address);

        //Search for events to know minted plots
        const sentLogs = await hardhatRuniverseContract.queryFilter(
            hardhatRuniverseContract.filters.Transfer(owner.addres, null),
        );
        const receivedLogs = await hardhatRuniverseContract.queryFilter(
            hardhatRuniverseContract.filters.Transfer(null, owner.address),
        );
        const logs = sentLogs.concat(receivedLogs)
            .sort(
                (a, b) =>
                a.blockNumber - b.blockNumber ||
                a.transactionIndex - b.TransactionIndex,
            );
        const owned = new Set();
        for (const log of logs) {
            const { tokenId } = log.args;
            owned.add(tokenId.toString());
        }
        const tokenIds = Array.from(owned);

        //Should be 6 plots
        expect(tokenIds.length).to.equal(6);

        //Sets vesting times 
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const startTimeVesting = blockBefore.timestamp + 10;
        const endTimeVesting = blockBefore.timestamp + 20;
        await hardhatRuniverseContract.setVestingStart( startTimeVesting );
        await hardhatRuniverseContract.setVestingEnd( endTimeVesting );

        await expect( hardhatRuniverseContract.transferFrom(owner.address, addr1.address,   tokenIds[0] )).to.be.revertedWith("Not vested");
        //Should be free of vesting
        await hardhatRuniverseContract.transferFrom(owner.address, addr1.address,   tokenIds[5] );
        //msc: quite sensitive to CPU, thinking on another way
        await new Promise(f => setTimeout(f, 10000));
        await hardhatRuniverseContract.transferFrom(owner.address, addr1.address,   tokenIds[0] );

    });
  });

describe("Mint Test", function () {
    it("Single mint should work.", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('1'), ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10')];
        const mintClaimStartTime = ethers.BigNumber.from('0');
        const mintListStartTime = ethers.BigNumber.from('0');
        const mintStartTime = ethers.BigNumber.from('0');

        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const startPublicSale = blockBefore.timestamp + 1000;

        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(startPublicSale);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

        await hardhatRuniverseContract.setVestingEnabled( false );

        await expect(hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Mint not started");        
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await expect(hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.02") } )).to.be.revertedWith("Ether value sent is not accurate");        
        hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") } )
        await expect(hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("All plots of that size minted");        
    });
  });



  describe("White list test", function () {
    it("White list should work", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('10'), ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10')];
        const mintClaimStartTime = ethers.BigNumber.from('0');
        const mintListStartTime = ethers.BigNumber.from('0');
        const mintStartTime = ethers.BigNumber.from('0');



        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

        await hardhatRuniverseContract.setVestingEnabled( false );

        await hardhatRuniverseMinterContract.setMintlistMerkleRoot1("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");
        
        //Mints with invalid proof
        await expect(hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Invalid proof.");        

        //Mints with valid proof
        await hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } );


    });
  });