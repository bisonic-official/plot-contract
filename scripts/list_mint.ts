import { exit } from "process";

const { ethers } = require("hardhat");

type MintRequirement = { address: string, plot_type: number };

//Setup vars
const CSV_PATH = "scripts/list_plots.csv";
const SEED = 0;
const MINT_LIST_START = 0;
//const MINT_LIST_END = 1;
const MINT_LIST_END = 10923;   //Be careful, is 0 index based!!
const BATCH_SIZE = 1;

async function private_mint() {
    //Read the csv and add each mint as a single line
    let list_to_mint: MintRequirement[] = [];
    let data: string = require("fs").readFileSync(CSV_PATH, "utf8").toString();
    let rows = data.split("\n");
    for (let row of rows) {
        let data_row = row.split(",");
        // Assigns 1 plot per address
        list_to_mint.push(
            { address: data_row[0], plot_type: parseInt(data_row[1]) }
        );
        // Assigns 5 plots per address
        // for (let plot_id = 0; plot_id < 5; plot_id++) {
        //     list_to_mint.push(
        //         { address: data_row[0], plot_type: parseInt(data_row[1]) }
        //     );
        // }
    }

    console.log(list_to_mint);

    const [owner] = await ethers.getSigners();

    //This is hardhat address, change when deployed to another network.
    const runiverseMinterContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const runiverseMinterContract = await ethers.getContractAt(
        "RuniverseLandMinter",
        runiverseMinterContractAddress
    );

    //This is hardhat address, change when deployed to another network.
    const runiverseContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const runiverseContract = await ethers.getContractAt(
        "RuniverseLand",
        runiverseContractAddress
    );

    await delay(2500);

    const from_id = Math.max(MINT_LIST_START, 0);
    const to_id = Math.min(MINT_LIST_END, list_to_mint.length - 1);

    //Mints the shuffled list 
    for (let r = from_id; r <= to_id; r += BATCH_SIZE) {
        const mint_request = list_to_mint[r];
        const originalGasPrice = await runiverseMinterContract.provider.getGasPrice();
        const gasPrice = (originalGasPrice).add(
            originalGasPrice.div(ethers.BigNumber.from('10'))
        );
        //const gasPrice = (originalGasPrice).mul( ethers.BigNumber.from('1') );

        console.log('Preparing transaction', gasPrice);
        let addresses = new Array<string>();
        let plotSizes = new Array<number>();
        for (let c = r; c < Math.min(to_id + 1, r + BATCH_SIZE); c++) {
            addresses.push(list_to_mint[c].address);
            plotSizes.push(list_to_mint[c].plot_type);
            console.log(
                "Batch mint",
                c,
                list_to_mint[c].address,
                list_to_mint[c].plot_type
            );
        }
        console.log("Waiting for tx");
        const tx = await runiverseMinterContract.ownerMint(
            plotSizes, addresses, { gasLimit: 8000000, gasPrice: gasPrice }
        ).catch(
            (error) => { errorMessage("Transaction sending error", r, error); }
        );

        if (tx) {
            console.log("Waiting for receipt");
            let receipt = await tx.wait().catch(
                (error) => { errorMessage("Tx.Wait() error", r, error); }
            );
            onMinted(receipt, r);
        }
        else
            errorMessage("Transaction null", r, tx);

        // Validate ownership per address, this returns the token_ids owned
        console.log(
            "ADDRESS:",
            list_to_mint[r].address, "\n",
            await runiverseContract.getTokens(list_to_mint[r].address)
        );

    }

    //Search for events to know minted plots
    const sentLogs = await runiverseContract.queryFilter(
        runiverseContract.filters.Transfer(owner.addres, null),
    );
    const receivedLogs = await runiverseContract.queryFilter(
        runiverseContract.filters.Transfer(null, owner.address),
    );
    const logs = sentLogs.concat(receivedLogs)
        .sort(
            (a, b) =>
                a.blockNumber - b.blockNumber ||
                a.transactionIndex - b.TransactionIndex,
        );
    const owned = new Set();
    for (const log of logs) {
        const { from, to, tokenId } = log.args;
        owned.add([from, to, tokenId.toString()]);
    }
    const tokenIds = Array.from(owned);

    console.log("Transfer logs:");
    console.log(tokenIds);
}

function errorMessage(msg, index, error) {
    console.log(msg, index, error);
    process.exit();
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function onMinted(receipt, id) {
    console.log(
        "Minting finished:",
        receipt.cumulativeGasUsed,
        receipt.effectiveGasPrice,
        receipt.to,
        id,
        receipt.nonce
    );
}


private_mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });