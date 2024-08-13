const { expect } = require("chai");
const { ethers } = require("hardhat");
const ERC721 = require('@openzeppelin/contracts/build/contracts/ERC721.json');

const generateSignature = async (address, plotSize, contract, signer) => {
  const nonce = await contract.getNonce(address);

  const raw_msg = new Array(address.toLowerCase(), plotSize, nonce);
  const message = raw_msg.join("_");

  const hash = await contract.getMessageHash(message);

  return {
    signature: await signer.signMessage(ethers.utils.arrayify(hash)),
    message,
  };
};

const expected_errors = [
  "function InvalidVestingGlobalId(uint256 gived_global_id)",
  "function TokenNotVested(uint256 current_time,uint256 token_vesting_time)",
  "function NoPlotsAvailable()",
  "function Address0Error()",
  "function WrongDateForProcess(uint256 correct_date, uint256 current_date)",
  "function DeniedProcessDuringMinting()"
];
const expected_errors_interface = new ethers.utils.Interface(expected_errors);

describe("🔥 Deploy Test", function () {
  it("Deployment should work for contract and minter.", async function () {
    const [owner] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory(
      "RuniverseLandMinter"
    );
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract);

  });
});


describe("🔥 Setters and getters test", function () {
  it("All the getters and setters should work.", async function () {
    const [owner] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory(
      "RuniverseLandMinter"
    );
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(owner.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('52500'),
      ethers.BigNumber.from('16828'),
      ethers.BigNumber.from('560'),
      ethers.BigNumber.from('105'),
      ethers.BigNumber.from('7')
    ];
    const mintClaimStartTime = ethers.BigNumber.from('100');
    const mintListStartTime = ethers.BigNumber.from('200');
    const mintStartTime = ethers.BigNumber.from('300');

    await hardhatRuniverseMinterContract.setPrices(plotPrices);
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

describe("🔥 Vesting Test", function () {
  it("Owner minting and vesting should work.", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10')
    ];
    const mintClaimStartTime = ethers.BigNumber.from('0');
    const mintListStartTime = ethers.BigNumber.from('0');
    const mintStartTime = ethers.BigNumber.from('0');



    await hardhatRuniverseMinterContract.setPrices(plotPrices);
    await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
    await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

    await hardhatRuniverseContract.setVestingEnabled(1);
    try {
      await hardhatRuniverseContract.setLastVestingGlobalId(5);
    } catch (e) {
      const decoded = expected_errors_interface.decodeFunctionData(
        expected_errors_interface.functions["InvalidVestingGlobalId(uint256)"],
        e.data
      );
      console.warn("Invalid Vesting Global Id, the gived Global ID : '" + decoded.gived_global_id + "' must be greater than 0");
    }

    await expect(hardhatRuniverseMinterContract.ownerMint(
      [0, 0],
      [owner.address]
    )).to.be.revertedWith("Arrays should have the same size");

    //Mints an extra plot
    await hardhatRuniverseMinterContract.ownerMint(
      [0, 0, 0, 0, 0, 0],
      [owner.address,
      owner.address,
      owner.address,
      owner.address,
      owner.address,
      owner.address]);

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
    const startTimeVesting = blockBefore.timestamp;
    const endTimeVesting = blockBefore.timestamp + 1000;
    const badStartTimeVesting = blockBefore.timestamp + 2000;
    await hardhatRuniverseContract.setVestingStart(startTimeVesting);
    await expect(hardhatRuniverseContract.setVestingEnd(
      mintClaimStartTime
    )).to.be.revertedWith("End must be greater than start");
    await hardhatRuniverseContract.setVestingEnd(endTimeVesting);
    await expect(hardhatRuniverseContract.setVestingStart(
      badStartTimeVesting
    )).to.be.revertedWith("Start must be less than end");

    //LastVestingGlobalId + 1 should be free of vesting
    await expect(await hardhatRuniverseContract.isVestingToken(tokenIds[5])).to.be.equal(false);

    try {
      await hardhatRuniverseContract.transferFrom(owner.address, addr1.address, tokenIds[5]);
    } catch (e) {
      const decoded = expected_errors_interface.decodeFunctionData(
        expected_errors_interface.functions["TokenNotVested(uint256,uint256)"],
        e.data
      );
      expect(decoded.token_vesting_time.toNumber() > decoded.current_time).to.be.equal(true);
    }

    //Testing before and after times
    for (let counter = 0; counter < 5; counter++) {
      await ethers.provider.send("evm_mine", [startTimeVesting + (counter + 1) * 200 - 2]);
      await expect(await hardhatRuniverseContract.isVested(tokenIds[counter])).to.be.equal(false);
      await expect(await hardhatRuniverseContract.isVestingToken(tokenIds[counter])).to.be.equal(true);
      try {
        await hardhatRuniverseContract.transferFrom(owner.address, addr1.address, tokenIds[counter]);
      } catch (e) {
        const decoded = expected_errors_interface.decodeFunctionData(
          expected_errors_interface.functions["TokenNotVested(uint256,uint256)"],
          e.data
        );
        expect(decoded.token_vesting_time.toNumber() > decoded.current_time).to.be.equal(true);
      }
      await ethers.provider.send("evm_mine", [startTimeVesting + (counter + 1) * 200 + 2]);
      await hardhatRuniverseContract.transferFrom(owner.address, addr1.address, tokenIds[counter]);
      await expect(await hardhatRuniverseContract.isVested(tokenIds[counter])).to.be.equal(true);
    }

    await expect(await hardhatRuniverseContract.totalSupply()).to.be.equal(6);

  });
});

describe("🔥 Mint Test + Enumerability", function () {
  it("Single mint + enumerability should work.", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);
    hardhatRuniverseContract.setSecondaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('1'),
      ethers.BigNumber.from('1'),
      ethers.BigNumber.from('1'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10')
    ];
    const mintClaimStartTime = ethers.BigNumber.from('0');
    const mintListStartTime = ethers.BigNumber.from('0');
    const mintStartTime = ethers.BigNumber.from('0');

    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const startPublicSale = blockBefore.timestamp + 1000;

    await hardhatRuniverseMinterContract.setPrices(plotPrices);
    await hardhatRuniverseMinterContract.setPublicMintStartTime(startPublicSale);
    await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

    await hardhatRuniverseContract.setVestingEnabled(0);

    try {
      await hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") });
    } catch (e) {
      const decoded = expected_errors_interface.decodeFunctionData(
        expected_errors_interface.functions["WrongDateForProcess(uint256,uint256)"],
        e.data
      );
      expect(decoded.current_date.toNumber() < decoded.correct_date.toNumber()).to.be.equal(true);
    }
    await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
    await expect(
      hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.02") })
    ).to.be.revertedWith("Ether value sent is not accurate");
    await hardhatRuniverseMinterContract.mint(2, 1, { value: ethers.utils.parseEther("0.03") })
    await hardhatRuniverseMinterContract.mint(3, 20, { value: ethers.utils.parseEther("0.8") })
    await hardhatRuniverseMinterContract.mint(3, 20, { value: ethers.utils.parseEther("0.8") })
    await hardhatRuniverseMinterContract.mint(3, 20, { value: ethers.utils.parseEther("0.8") })
    await hardhatRuniverseMinterContract.mint(3, 20, { value: ethers.utils.parseEther("0.8") })
    await hardhatRuniverseMinterContract.mint(3, 20, { value: ethers.utils.parseEther("0.8") })
    await expect(
      hardhatRuniverseMinterContract.mint(3, 20, { value: ethers.utils.parseEther("0.8") })
    ).to.be.revertedWith("Trying to mint too many plots");

    // Test enumerability
    const tokensOwned = await hardhatRuniverseContract.getTokens(owner.address);
    expect(tokensOwned.length).to.equal(101);

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

    //Withdraw test
    var beforeWithdraw = await hardhatRuniverseMinterContract.provider.getBalance(owner.address);
    var withdrawEther = ethers.utils.parseEther("0.01")
    var transactionWhithdraw = await hardhatRuniverseMinterContract.withdraw(ethers.utils.parseEther("0.01"));
    var receiptWithdraw = await transactionWhithdraw.wait();
    var expectedWithdrawEther = beforeWithdraw.add(withdrawEther.sub(receiptWithdraw.cumulativeGasUsed.mul(receiptWithdraw.effectiveGasPrice)));

    expect(await hardhatRuniverseMinterContract.provider.getBalance(owner.address)).to.equal(expectedWithdrawEther);

    //Withdraw all test
    var beforeWithdrawAll = await hardhatRuniverseMinterContract.provider.getBalance(owner.address);
    var withdrawAllEther = await hardhatRuniverseMinterContract.provider.getBalance(hardhatRuniverseMinterContract.address);
    var transactionWithdrawAll = await hardhatRuniverseMinterContract.withdrawAll();
    var receiptWithdrawAll = await transactionWithdrawAll.wait();
    var expectedWithdrawAllEther = beforeWithdrawAll.add(withdrawAllEther.sub(receiptWithdrawAll.cumulativeGasUsed.mul(receiptWithdrawAll.effectiveGasPrice)));

    expect(await hardhatRuniverseMinterContract.provider.getBalance(owner.address)).to.equal(expectedWithdrawAllEther);
    expect(await hardhatRuniverseMinterContract.provider.getBalance(hardhatRuniverseMinterContract.address)).to.equal(mintClaimStartTime);

    await hardhatRuniverseContract.withdrawAll();
  });
});

describe("🔥 Verify signature + mint + enumerability", function () {
  it("Check if signer matches with recovered signer", async function () {
    const [user, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseLand = await ethers.getContractFactory("RuniverseLand");
    const runiverseLand = await RuniverseLand.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseLandMinter = await ethers.getContractFactory("RuniverseLandMinter");
    const runiverseLandMinter = await RuniverseLandMinter.deploy(
      runiverseLand.address
    );

    await runiverseLand.setPrimaryMinter(runiverseLandMinter.address);
    await runiverseLandMinter.setSigner(signer.address);

    const plot_type = 0;
    const { message, signature } = await generateSignature(
      user.address,
      plot_type,
      runiverseLandMinter,
      signer
    );

    // Correct signature and message returns true
    expect(await runiverseLandMinter.verify(message, signature)).to.equal(true);
  });

  it("Verify signer and mint token function + test enumerability", async function () {
    const [user, signer, hacker] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseLand = await ethers.getContractFactory("RuniverseLand");
    const runiverseLand = await RuniverseLand.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseLandMinter = await ethers.getContractFactory("RuniverseLandMinter");
    const runiverseLandMinter = await RuniverseLandMinter.deploy(
      runiverseLand.address
    );

    await runiverseLand.setPrimaryMinter(runiverseLandMinter.address);
    await runiverseLandMinter.setSigner(signer.address);

    const plot_type = 0;
    const { signature } = await generateSignature(
      user.address,
      plot_type,
      runiverseLandMinter,
      signer
    );

    // Verify can't use signature to mint wrong token type
    await expect(runiverseLandMinter.verifyAndMint(
      signature, plot_type + 1
    )).to.be.revertedWith(
      "Bad signature"
    );

    // Verify wrong use can't use the same signature
    await expect(
      runiverseLandMinter.connect(hacker).verifyAndMint(signature, plot_type)
    ).to.be.revertedWith("Bad signature");

    // Verify signature and mint token
    await runiverseLandMinter.verifyAndMint(signature, plot_type);

    // Verify can't use same signature to mint another token - IMPORTANT!
    await expect(runiverseLandMinter.verifyAndMint(signature, 0)).to.be.revertedWith(
      "Bad signature"
    );

    // Check if token was minted
    const tokens = await runiverseLand.getTokens(user.address);
    const token_id = tokens[0];
    expect(await runiverseLand.exists(token_id)).to.equal(true);
    expect(await runiverseLand.ownerOf(token_id)).to.equal(user.address);

    // Get balance of signer (total of tokens minted by signer)
    const balanceOf = await runiverseLand.balanceOf(user.address);
    expect(balanceOf).to.equal(1);

    // Get token of owner by index
    const tokenOfOwnerByIndex = await runiverseLand.tokenOfOwnerByIndex(
      user.address, 0
    );
    expect(tokenOfOwnerByIndex).to.equal(token_id);

    // Test enumerablity
    const tokensOwned = await runiverseLand.getTokens(user.address);
    expect(tokensOwned.length).to.equal(1);

  });

  it("Verify error when signer does not match", async function () {
    const [user, signer] = await ethers.getSigners();

    // Deploy contracts
    const RuniverseLand = await ethers.getContractFactory("RuniverseLand");
    const runiverseLand = await RuniverseLand.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseLandMinter = await ethers.getContractFactory("RuniverseLandMinter");
    const runiverseLandMinter = await RuniverseLandMinter.deploy(
      runiverseLand.address
    );

    await runiverseLand.setPrimaryMinter(runiverseLandMinter.address);
    // Do not set signer to try minting with another signer

    const plot_type = 0;
    const { signature } = await generateSignature(
      user.address,
      plot_type,
      runiverseLandMinter,
      signer
    );

    // Verify signature using another signer
    await expect(
      runiverseLandMinter.verifyAndMint(signature, plot_type)
    ).to.be.revertedWith("Bad signature");
  });
});

describe("🔥 Test pausing and unpausing contract", function () {
  it("Pausing contract should pause minting", async function () {
    const [user, signer, hacker] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);
    hardhatRuniverseContract.setSecondaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const mintClaimStartTime = ethers.BigNumber.from('0');
    const mintListStartTime = ethers.BigNumber.from('0');
    const mintStartTime = ethers.BigNumber.from('0');

    await hardhatRuniverseMinterContract.setPrices(plotPrices);
    await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
    await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

    await hardhatRuniverseContract.setVestingEnabled(0);

    // Mint before pausing contract 
    hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") })

    // Verify only owner can pause contract minting
    await expect(hardhatRuniverseContract.connect(hacker).pauseContract()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Pause contract minting
    await hardhatRuniverseContract.pauseContract();

    // Should revert with paused minting 
    await expect(
      hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("ERC721Pausable: token transfer while paused");

    // Verify only owner can unpause contract minting
    await expect(hardhatRuniverseContract.connect(hacker).unpauseContract()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Unpause contract minting
    await hardhatRuniverseContract.unpauseContract();

    // Verify signature and mint token
    await hardhatRuniverseMinterContract.mint(0, 1, { value: ethers.utils.parseEther("0.01") });
  });
});



describe("🔥 Whitelist Test", function () {
  it("White list should work", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10')
    ];
    const mintClaimStartTime = ethers.BigNumber.from('0');
    const mintListStartTime = ethers.BigNumber.from('0');
    const mintListFarTime = ethers.BigNumber.from('999999999999999');
    const mintStartTime = ethers.BigNumber.from('0');



    await hardhatRuniverseMinterContract.setPrices(plotPrices);
    await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
    await hardhatRuniverseMinterContract.setMintlistStartTime(mintListFarTime);
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

    await hardhatRuniverseContract.setVestingEnabled(0);

    //Mint list have not started
    try {
      await hardhatRuniverseMinterContract.mintlistMint(
        0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"],
        { value: ethers.utils.parseEther("0.01") }
      );
    } catch (e) {
      const decoded = expected_errors_interface.decodeFunctionData(
        expected_errors_interface.functions["WrongDateForProcess(uint256,uint256)"],
        e.data
      );
      expect(decoded.current_date.toNumber() < decoded.correct_date.toNumber()).to.be.equal(true);
    }

    await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);

    //Dummy Merkle
    await hardhatRuniverseMinterContract.setMintlistMerkleRoot1("0xaaaaa5fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");

    //Corret proof bad Merkle
    await expect(
      hardhatRuniverseMinterContract.mintlistMint(
        0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"],
        { value: ethers.utils.parseEther("0.01") }
      )
    ).to.be.revertedWith("Invalid proof.");

    //Good Merkle in second tree
    await hardhatRuniverseMinterContract.setMintlistMerkleRoot2("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");

    //Correct in second merkle
    await hardhatRuniverseMinterContract.mintlistMint(
      0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"],
      { value: ethers.utils.parseEther("0.01") }
    );

    //Swap
    await hardhatRuniverseMinterContract.setMintlistMerkleRoot1("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");
    await hardhatRuniverseMinterContract.setMintlistMerkleRoot2("0xaaaaa5fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");

    //Still correct and last avialable plot for this wallet
    await hardhatRuniverseMinterContract.mintlistMint(
      0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"],
      { value: ethers.utils.parseEther("0.01") }
    );

    //Mints with invalid proof
    await expect(
      hardhatRuniverseMinterContract.mintlistMint(
        0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"],
        { value: ethers.utils.parseEther("0.01") }
      )
    ).to.be.revertedWith("Invalid proof.");

    //Ran out of slots
    await expect(
      hardhatRuniverseMinterContract.mintlistMint(
        0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"],
        { value: ethers.utils.parseEther("0.01") }
      )
    ).to.be.revertedWith("Minting more than allowed");

  });
});


describe("🔥 Claimlist Test", function () {
  it("White list claim should work", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10')
    ];
    const mintClaimStartTime = ethers.BigNumber.from('0');
    const mintListStartTime = ethers.BigNumber.from('0');
    const mintListFarTime = ethers.BigNumber.from('999999999999999');
    const mintStartTime = ethers.BigNumber.from('0');

    await hardhatRuniverseMinterContract.setPrices(plotPrices);
    await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintListFarTime);
    await hardhatRuniverseMinterContract.setMintlistStartTime(mintClaimStartTime);

    await hardhatRuniverseContract.setVestingEnabled(0);

    try {
      await hardhatRuniverseMinterContract.claimlistMint(
        0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"]
      )
    } catch (e) {
      const decoded = expected_errors_interface.decodeFunctionData(
        expected_errors_interface.functions["WrongDateForProcess(uint256,uint256)"],
        e.data
      );
      expect(decoded.current_date.toNumber() < decoded.correct_date.toNumber()).to.be.equal(true);
    }
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintListStartTime);
    await hardhatRuniverseMinterContract.setClaimlistMerkleRoot("0x194a85fd3d1fd2023357cc245f795fb7129bc2bc646df8b1dc9fb1f4342e4091");

    //Mints with invalid proof
    await expect(
      hardhatRuniverseMinterContract.claimlistMint(
        0, 1, 2, ["0xae0840ecd9936be1fa9a01a65174f8b8917233e75dd92c89cea9372282f6703b"]
      )
    ).to.be.revertedWith("Invalid proof.");

    //Mints with valid proof
    await hardhatRuniverseMinterContract.claimlistMint(
      0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"]
    );
    await hardhatRuniverseMinterContract.claimlistMint(
      0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"]
    );

    //Ran out of slots
    await expect(
      hardhatRuniverseMinterContract.claimlistMint(
        0, 1, 2, ["0x404ffa69e506be1899daa19c82154a85be53410304e1ebbc1fe89911fa3b9c6f"]
      )
    ).to.be.revertedWith("Claiming more than allowed");


  });
});


describe("🔥 URI Test", function () {
  it("URI should work", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const tokenId = ethers.BigNumber.from('1099511628032');
    const tokenBad = ethers.BigNumber.from('0');

    await hardhatRuniverseMinterContract.ownerMint([0], [owner.address]);

    // Test Token URI
    const tokenUri_0 = await hardhatRuniverseContract.tokenURI(tokenId);
    await expect(tokenUri_0).to.be.equal("http://localhost:9080/GetPlotInfo?PlotId=1099511628032");
    await hardhatRuniverseContract.setNewBaseURI("https://api.runiverse.world/GetPlotInfo?PlotId=")
    expect(
      await hardhatRuniverseContract.getBaseURI()
    ).to.be.equal("https://api.runiverse.world/GetPlotInfo?PlotId=");


    const tokenUri_1 = await hardhatRuniverseContract.tokenURI(tokenId);
    await expect(tokenUri_1).to.be.equal("https://api.runiverse.world/GetPlotInfo?PlotId=1099511628032");

    await expect(tokenUri_1).to.be.equal("https://api.runiverse.world/GetPlotInfo?PlotId=1099511628032");
    await expect(
      hardhatRuniverseContract.tokenURI(tokenBad)
    ).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");

  });
});


describe("🔥 Offsets Test", function () {
  it("Local and global offsets shouldwork", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const tokenId = ethers.BigNumber.from('5497558140672');

    await hardhatRuniverseMinterContract.setGlobalIdOffset(5);
    await hardhatRuniverseMinterContract.setLocalIdOffsets([7, 3, 3, 3, 3]);
    await hardhatRuniverseMinterContract.ownerMint([0], [owner.address]);

    await expect(await hardhatRuniverseContract.exists(tokenId)).to.be.equal(true);
  });
});

describe("🔥 Start Times Test", function () {
  it("Start times for public, mint list and claim list should work.", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10')
    ];

    await hardhatRuniverseMinterContract.setPrices(plotPrices);

    await hardhatRuniverseContract.setVestingEnabled(0);

    //Public test
    const blockNumBeforePublic = await ethers.provider.getBlockNumber();
    const blockBeforePublic = await ethers.provider.getBlock(blockNumBeforePublic);
    const beforeTimePublic = blockBeforePublic.timestamp + 5;
    const currentTimePublic = blockBeforePublic.timestamp + 10;
    const afterTimePublic = blockBeforePublic.timestamp + 15;

    await hardhatRuniverseMinterContract.setPublicMintStartTime(currentTimePublic);

    await ethers.provider.send("evm_mine", [beforeTimePublic]);
    await expect(await hardhatRuniverseMinterContract.publicStarted()).to.be.equal(false);
    await ethers.provider.send("evm_mine", [afterTimePublic]);
    await expect(await hardhatRuniverseMinterContract.publicStarted()).to.be.equal(true);

    //Mint test
    const blockNumBeforeMintList = await ethers.provider.getBlockNumber();
    const blockBeforeMintList = await ethers.provider.getBlock(blockNumBeforeMintList);
    const beforeTimeMintList = blockBeforeMintList.timestamp + 5;
    const currentTimeMintList = blockBeforeMintList.timestamp + 10;
    const afterTimeMintList = blockBeforeMintList.timestamp + 15;

    await hardhatRuniverseMinterContract.setMintlistStartTime(currentTimeMintList);

    await ethers.provider.send("evm_mine", [beforeTimeMintList]);
    await expect(await hardhatRuniverseMinterContract.mintlistStarted()).to.be.equal(false);
    await ethers.provider.send("evm_mine", [afterTimeMintList]);
    await expect(await hardhatRuniverseMinterContract.mintlistStarted()).to.be.equal(true);

    //Claim test
    const blockNumBeforeClaimList = await ethers.provider.getBlockNumber();
    const blockBeforeClaimList = await ethers.provider.getBlock(blockNumBeforeClaimList);
    const beforeTimeClaimList = blockBeforeClaimList.timestamp + 5;
    const currentTimeClaimList = blockBeforeClaimList.timestamp + 10;
    const afterTimeClaimList = blockBeforeClaimList.timestamp + 15;

    await hardhatRuniverseMinterContract.setClaimsStartTime(currentTimeClaimList);


    await ethers.provider.send("evm_mine", [beforeTimeClaimList]);
    await expect(await hardhatRuniverseMinterContract.claimsStarted()).to.be.equal(false);
    await ethers.provider.send("evm_mine", [afterTimeClaimList]);
    await expect(await hardhatRuniverseMinterContract.claimsStarted()).to.be.equal(true);

  });
});



describe("🔥 Marketplace Blacklist Test", function () {
  it("Marketplace blacklist should work.", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const RuniverseContract = await ethers.getContractFactory("RuniverseLand");
    const hardhatRuniverseContract = await RuniverseContract.deploy(
      'http://localhost:9080/GetPlotInfo?PlotId='
    );

    const RuniverseMinterContract = await ethers.getContractFactory("RuniverseLandMinter");
    const hardhatRuniverseMinterContract = await RuniverseMinterContract.deploy(
      hardhatRuniverseContract.address
    );
    hardhatRuniverseContract.setPrimaryMinter(hardhatRuniverseMinterContract.address);

    const plotPrices = [
      ethers.utils.parseEther("0.01"),
      ethers.utils.parseEther("0.02"),
      ethers.utils.parseEther("0.03"),
      ethers.utils.parseEther("0.04"),
      ethers.utils.parseEther("0.05")
    ];
    const plotsAvailable = [
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10'),
      ethers.BigNumber.from('10')
    ];
    const mintClaimStartTime = ethers.BigNumber.from('0');
    const mintListStartTime = ethers.BigNumber.from('0');
    const mintStartTime = ethers.BigNumber.from('0');

    await hardhatRuniverseMinterContract.setPrices(plotPrices);
    await hardhatRuniverseMinterContract.setPublicMintStartTime(mintStartTime);
    await hardhatRuniverseMinterContract.setMintlistStartTime(mintListStartTime);
    await hardhatRuniverseMinterContract.setClaimsStartTime(mintClaimStartTime);

    await hardhatRuniverseContract.setVestingEnabled(0);

    //Mints an extra plot
    await hardhatRuniverseMinterContract.ownerMint(
      [0, 0, 0, 0],
      [owner.address,
      owner.address,
      owner.address,
      owner.address]);

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

    //Should be 2 plots
    expect(tokenIds.length).to.equal(4);

    //Normal fail transfer, as is not approved
    await expect(
      hardhatRuniverseContract.connect(addr1).transferFrom(
        owner.address, addr2.address, tokenIds[0]
      )
    ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    //Success approve, now addr1 can transfer tokenIds[0]
    await hardhatRuniverseContract.approve(addr1.address, tokenIds[0]);
    //Success transfer
    await hardhatRuniverseContract.connect(addr1).transferFrom(
      owner.address, addr2.address, tokenIds[0]
    );
    //Denying add1 as "marketplace"
    await hardhatRuniverseContract.setDeniedMarketplace(addr1.address, true);
    //Address is in blacklist, signer can't approve addr1 to transfer his token
    await expect(
      hardhatRuniverseContract.approve(addr1.address, tokenIds[1])
    ).to.be.revertedWith("Invalid Marketplace");
    //If trying to transfer, first require is the market blacklist, so it should fail
    await expect(
      hardhatRuniverseContract.connect(addr1).transferFrom(
        owner.address, addr2.address, tokenIds[1]
      )
    ).to.be.revertedWith("Invalid Marketplace");
    //Removing "addr1" from the blacklist
    await hardhatRuniverseContract.setDeniedMarketplace(addr1.address, false);
    //Success approve, now addr1 and add2 can transfer tokenIds[1]
    await hardhatRuniverseContract.approve(addr1.address, tokenIds[1]);
    await hardhatRuniverseContract.approve(addr1.address, tokenIds[2]);
    //Correct transfer
    await hardhatRuniverseContract.connect(addr1).transferFrom(
      owner.address, addr2.address, tokenIds[1]
    );
    //Denying the addr1 as marketplace
    await hardhatRuniverseContract.setDeniedMarketplace(addr1.address, true);
    //add2 was not transferred and now addr1 is blocked as marketplace
    await expect(
      hardhatRuniverseContract.connect(addr1).transferFrom(
        owner.address, addr2.address, tokenIds[2]
      )
    ).to.be.revertedWith("Invalid Marketplace");


    //Addr1 is blocked as marketplace, setApprovalForAll should fail
    await expect(
      hardhatRuniverseContract.setApprovalForAll(addr1.address, true)
    ).to.be.revertedWith("Invalid Marketplace");
    //Allowing the  marketplace again
    await hardhatRuniverseContract.setDeniedMarketplace(addr1.address, false);
    //Now approved for all tokens
    await hardhatRuniverseContract.setApprovalForAll(addr1.address, true);
    //Correct transfer
    await hardhatRuniverseContract.connect(addr1).transferFrom(
      owner.address, addr2.address, tokenIds[2]
    );
    //Denying addr1 as marketplace again
    await hardhatRuniverseContract.setDeniedMarketplace(addr1.address, true);
    //Failed trasnfer
    await expect(
      hardhatRuniverseContract.connect(addr1).transferFrom(
        owner.address, addr2.address, tokenIds[3]
      )
    ).to.be.revertedWith("Invalid Marketplace");

    //Allowing marketplace
    await hardhatRuniverseContract.setDeniedMarketplace(addr1.address, false);
    //Remiving approval
    await hardhatRuniverseContract.setApprovalForAll(addr1.address, false);
    //Normal not approved fail
    await expect(
      hardhatRuniverseContract.connect(addr1).transferFrom(
        owner.address, addr2.address, tokenIds[3]
      )
    ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    //Single approving
    await hardhatRuniverseContract.approve(addr1.address, tokenIds[3]);
    //Success transfer
    await hardhatRuniverseContract.connect(addr1).transferFrom(
      owner.address, addr2.address, tokenIds[3]
    );

  });
});