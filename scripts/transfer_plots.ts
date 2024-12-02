import { exit } from "process";

const { ethers } = require("hardhat");

type PlotRequirement = {
    address_from: string,
    address_to: string,
    plot_id: string
};

//Setup vars
const CSV_PATH = "scripts/transfer_plots.csv";
const MAIN_CONTRACT_ADDRESS = "CONTRACT_ADDRESS";
const TRANSFER_LIST_START = 0;
const TRANSFER_LIST_END = 1000000;   //Be careful, is 0 index based!!

const provider = new ethers.providers.JsonRpcProvider("RPC_ADDRESS");
const privateKey = "PRIVATE_KEY";
const wallet = new ethers.Wallet(privateKey, provider);

async function plot_transfer() {
    //Read the csv and add each mint as a single line
    let list_to_transfer: PlotRequirement[] = [];
    let data: string = require("fs").readFileSync(CSV_PATH, "utf8").toString();
    let rows = data.split("\n");
    for (let row of rows) {
        let data_row = row.split(",");
        
        // Load transfer data
        list_to_transfer.push(
            {
                address_from: data_row[0],
                address_to: data_row[1],
                plot_id: data_row[2]
            }
        );
    }

    console.log("[INFO] Transfer list:\n", list_to_transfer);

    // This is hardhat address, change when deployed to another network.
    const runiverseContractAddress = MAIN_CONTRACT_ADDRESS;
    const runiverseContract = await ethers.getContractAt(
        "RuniverseLand",
        runiverseContractAddress,
        wallet
    );

    await delay(2500);

    const from_id = Math.max(TRANSFER_LIST_START, 0);
    const to_id = Math.min(TRANSFER_LIST_END, list_to_transfer.length - 1);

    // First approve transfer
    const originalGasPrice = await runiverseContract.provider.getGasPrice();
    const gasPrice = (originalGasPrice).add(
        originalGasPrice.div(ethers.BigNumber.from('10'))
    );

    // Transfers the loaded list 
    for (let r = from_id; r <= to_id; r += 1) {
        console.log("[INFO] Preparing transaction", gasPrice);  
        console.log(
            "[INFO] Plot transfer",
            r,
            list_to_transfer[r].address_from,
            list_to_transfer[r].address_to,
            list_to_transfer[r].plot_id
        );

        console.log("[INFO] Waiting for tx");

        // Transfer plot
        const tx = await runiverseContract.transferFrom(
            list_to_transfer[r].address_from,
            list_to_transfer[r].address_to,
            list_to_transfer[r].plot_id, 
            { gasLimit: 8000000, gasPrice: gasPrice }
        ).catch(
            (error) => { errorMessage("[ERROR] Transaction error", r, error); }
        );

        if (tx) {
            console.log("[INFO] Waiting for receipt");
            let receipt = await tx.wait().catch(
                (error) => { errorMessage("[ERROR] Transfer Tx.Wait() error", r, error); }
            );
            onTransfer(receipt, r);
        }
        else
            errorMessage("[ERROR] Transaction null", r, tx);

        // Validate ownership per address, this returns the token_ids owned
        console.log(
            "[INFO] ADDRESS:",
            list_to_transfer[r].address_to, "\n",
            await runiverseContract.getTokens(list_to_transfer[r].address_to)
        );

    }
}

function errorMessage(msg, index, error) {
    console.log(msg, index, error);
    exit();
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function onTransfer(receipt, id) {
    console.log(
        "[INFO] Transfer finished:",
        receipt.cumulativeGasUsed,
        receipt.effectiveGasPrice,
        receipt.to,
        id,
        receipt.nonce
    );
}


plot_transfer()
    .then(() => exit(0))
    .catch((error) => {
        console.error(error);
        exit(1);
    });