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

        expect(await hardhatRuniverseMinterContract.publicMintStartTime()).to.deep.equal(mintStartTime);
        expect(await hardhatRuniverseMinterContract.mintlistStartTime()).to.deep.equal(mintListStartTime);
        expect(await hardhatRuniverseMinterContract.claimsStartTime()).to.deep.equal(mintClaimStartTime);

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

        await hardhatRuniverseContract.setVestingEnabled( 1 );
        await hardhatRuniverseContract.setLastVestingGlobalId( 5 );

        
       //Mints an extra plot
       for(let counter = 0; counter<6; counter ++)
            await hardhatRuniverseMinterContract.ownerMint(0 , 1, owner.address);

        //Search for events to know minted plots
        const sentLogs = await hardhatRuniverseContract.queryFilter(
            hardhatRuniverseContract.filters.Transfer(owner.address, null),
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
        const startTimeVesting = blockBefore.timestamp ;
        const endTimeVesting = blockBefore.timestamp + 1000;
        await hardhatRuniverseContract.setVestingStart( startTimeVesting );
        await hardhatRuniverseContract.setVestingEnd( endTimeVesting );
        
        //LastVestingGlobalId + 1 should be free of vesting
        await expect( await hardhatRuniverseContract.isVestingToken( tokenIds[5] )).to.be.equal(false);
        await hardhatRuniverseContract.transferFrom(owner.address, addr1.address,   tokenIds[5] );

        //Testing before and after times
        for(let counter = 0; counter < 5; counter ++){
          await ethers.provider.send("evm_mine", [startTimeVesting + (counter+1)*200-2]);
          await expect( await hardhatRuniverseContract.isVested(tokenIds[counter] )).to.be.equal(false);
          await expect( await hardhatRuniverseContract.isVestingToken(tokenIds[counter] )).to.be.equal(true);
          await expect( hardhatRuniverseContract.transferFrom(owner.address, addr1.address,   tokenIds[counter] )).to.be.revertedWith("Not vested");
          await ethers.provider.send("evm_mine", [startTimeVesting + (counter+1)*200+2]);
          await hardhatRuniverseContract.transferFrom(owner.address, addr1.address,   tokenIds[counter] );
          await expect( await hardhatRuniverseContract.isVested(tokenIds[counter] )).to.be.equal(true);
        }

        await expect( await hardhatRuniverseContract.totalSupply()).to.be.equal(6);

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
        hardhatRuniverseContract.setSecondaryMinter(hardhatRuniverseMinterContract.address);

        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('1'), ethers.BigNumber.from('1') ,ethers.BigNumber.from('1') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10')];
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

        await hardhatRuniverseContract.setVestingEnabled( 0 );

        await expect(hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Mint not started");        
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await expect(hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.02") } )).to.be.revertedWith("Ether value sent is not accurate");        
        await hardhatRuniverseMinterContract.mint(2, 1, { value: ethers.utils.parseEther("0.03") } )
        await expect(hardhatRuniverseMinterContract.mint(2, 1, { value: ethers.utils.parseEther("0.03") } )).to.be.revertedWith("All plots of that size minted");        
        //Search for events to know minted plots
        const sentLogs = await hardhatRuniverseContract.queryFilter(
            hardhatRuniverseContract.filters.Transfer(owner.address, null),
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
        expect((await hardhatRuniverseMinterContract.getTokenIdPlotType(tokenIds[0]))).to.equal(2);

        await hardhatRuniverseContract.withdrawAll();
        await hardhatRuniverseMinterContract.withdraw(ethers.utils.parseEther("0.01"));
        await hardhatRuniverseMinterContract.withdrawAll();
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
        const mintListFarTime = ethers.BigNumber.from('99999999999999999999');
        const mintStartTime = ethers.BigNumber.from('0');



        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListFarTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

        await hardhatRuniverseContract.setVestingEnabled( 0 );

        //Mint list have not started
        await expect(hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Mint not started");

        await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);

        //Dummy Merkle
        await hardhatRuniverseMinterContract.setMintlistMerkleRoot1("0xaaaaa5fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");
        
        //Corret proof bad Merkle
        await expect( hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Invalid proof.");
        
        //Good Merkle in second tree
        await hardhatRuniverseMinterContract.setMintlistMerkleRoot2("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");

        //Correct in second merkle
        await hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } );

        //Swap
        await hardhatRuniverseMinterContract.setMintlistMerkleRoot1("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");
        await hardhatRuniverseMinterContract.setMintlistMerkleRoot2("0xaaaaa5fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");

        //Still correct and last avialable plot for this wallet
        await hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } );

        //Mints with invalid proof
        await expect(hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Invalid proof.");        

        //Ran out of slots
        await expect(hardhatRuniverseMinterContract.mintlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Minting more than allowed");

    });
  });


  describe("Claim list test", function () {
    it("White list claim should work", async function () {
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
        const mintListFarTime = ethers.BigNumber.from('99999999999999999999');
        const mintStartTime = ethers.BigNumber.from('0');



        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);
        await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
        await hardhatRuniverseMinterContract.setClaimsStartTime(mintListFarTime);
        await hardhatRuniverseMinterContract.setMintlistStartTime(mintClaimStartTime);

        await hardhatRuniverseContract.setVestingEnabled( 0 );

        await expect(hardhatRuniverseMinterContract.claimlistMint(0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Claims not started"); 

        await hardhatRuniverseMinterContract.setClaimsStartTime(mintListStartTime);

        await hardhatRuniverseMinterContract.setClaimlistMerkleRoot("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");
        
        //Mints with invalid proof
        await expect(hardhatRuniverseMinterContract.claimlistMint(0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Invalid proof.");        

        //Mints with valid proof
        await hardhatRuniverseMinterContract.claimlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"]);
        await hardhatRuniverseMinterContract.claimlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"]);

        //Ran out of slots
        await expect(hardhatRuniverseMinterContract.claimlistMint(0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"], { value: ethers.utils.parseEther("0.01") } )).to.be.revertedWith("Claiming more than allowed");


    });
  });


  describe("Uri test", function () {
    it("Uri should work", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        const tokenId = ethers.BigNumber.from('1099511628032');
        const tokenBad = ethers.BigNumber.from('0');

        await hardhatRuniverseMinterContract.ownerMint(0 , 1, owner.address);

        const tokenUri_0 = await hardhatRuniverseContract.tokenURI(tokenId);
        await expect(tokenUri_0).to.be.equal("http://localhost:9080/GetPlotInfo?PlotId=1099511628032");  
        await hardhatRuniverseContract.setBaseURI("https://api.runiverse.world/GetPlotInfo?PlotId=")

        const tokenUri_1 = await hardhatRuniverseContract.tokenURI(tokenId);
        await expect(tokenUri_1).to.be.equal("https://api.runiverse.world/GetPlotInfo?PlotId=1099511628032"); 

        await expect(tokenUri_1).to.be.equal("https://api.runiverse.world/GetPlotInfo?PlotId=1099511628032"); 
        await expect(  hardhatRuniverseContract.tokenURI(tokenBad) ).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token"); 

    });
  });


  describe("Offsets test", function () {
    it("Local and global offsets shouldwork", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        const tokenId = ethers.BigNumber.from('5497558140672');

        await hardhatRuniverseMinterContract.setGlobalIdOffset(5);
        await hardhatRuniverseMinterContract.setLocalIdOffsets([7,3,3,3,3]);
        await hardhatRuniverseMinterContract.ownerMint(0 , 1, owner.address);

        await expect(await hardhatRuniverseContract.exists(tokenId)).to.be.equal(true); 
    });
  });

  describe("Start times", function () {
    it("Start times for public, mint list and claim list should work.", async function () {
        const [owner, addr1, addr2] = await ethers.getSigners();

        const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
        const hardhatRuniverseContract = await RuniverseContract.deploy('http://localhost:9080/GetPlotInfo?PlotId=');
        
        const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
        const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(hardhatRuniverseContract.address);
        hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

        const plotPrices = [ethers.utils.parseEther("0.01"),ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.03"),ethers.utils.parseEther("0.04"),ethers.utils.parseEther("0.05")];
        const plotsAvailable = [ ethers.BigNumber.from('10'), ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10') ,ethers.BigNumber.from('10')];

        await hardhatRuniverseMinterContract.setPrices(plotPrices);
        await hardhatRuniverseMinterContract.setPlotsAvailablePerSize(plotsAvailable);

        await hardhatRuniverseContract.setVestingEnabled( 0 );

        //Public test
        const blockNumBeforePublic = await ethers.provider.getBlockNumber();
        const blockBeforePublic = await ethers.provider.getBlock(blockNumBeforePublic);
        const beforeTimePublic = blockBeforePublic.timestamp  + 5;
        const currentTimePublic = blockBeforePublic.timestamp + 10;
        const afterTimePublic = blockBeforePublic.timestamp + 15;

        await hardhatRuniverseMinterContract.setPublicMintStartTime(currentTimePublic);


        await ethers.provider.send("evm_mine", [beforeTimePublic]) ;
        await expect( await hardhatRuniverseMinterContract.publicStarted() ).to.be.equal(false);
        await ethers.provider.send("evm_mine", [afterTimePublic]) ;
        await expect( await hardhatRuniverseMinterContract.publicStarted() ).to.be.equal(true);

        //Mint test
        const blockNumBeforeMintList = await ethers.provider.getBlockNumber();
        const blockBeforeMintList = await ethers.provider.getBlock(blockNumBeforeMintList);
        const beforeTimeMintList = blockBeforeMintList.timestamp  + 5;
        const currentTimeMintList = blockBeforeMintList.timestamp + 10;
        const afterTimeMintList = blockBeforeMintList.timestamp + 15;

        await hardhatRuniverseMinterContract.setMintlistStartTime(currentTimeMintList);


        await ethers.provider.send("evm_mine", [beforeTimeMintList]) ;
        await expect( await hardhatRuniverseMinterContract.mintlistStarted() ).to.be.equal(false);
        await ethers.provider.send("evm_mine", [afterTimeMintList]) ;
        await expect( await hardhatRuniverseMinterContract.mintlistStarted() ).to.be.equal(true);

        //Claim test
        const blockNumBeforeClaimList = await ethers.provider.getBlockNumber();
        const blockBeforeClaimList = await ethers.provider.getBlock(blockNumBeforeClaimList);
        const beforeTimeClaimList = blockBeforeClaimList.timestamp  + 5;
        const currentTimeClaimList = blockBeforeClaimList.timestamp + 10;
        const afterTimeClaimList = blockBeforeClaimList.timestamp + 15;

        await hardhatRuniverseMinterContract.setClaimsStartTime(currentTimeClaimList);


        await ethers.provider.send("evm_mine", [beforeTimeClaimList]) ;
        await expect( await hardhatRuniverseMinterContract.claimsStarted() ).to.be.equal(false);
        await ethers.provider.send("evm_mine", [afterTimeClaimList]) ;
        await expect( await hardhatRuniverseMinterContract.claimsStarted() ).to.be.equal(true);    

    });
  });