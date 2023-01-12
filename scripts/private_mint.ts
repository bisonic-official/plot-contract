
type MintRequirement = { address: string, plot_type: number };

//Setup vars
const CSV_PATH = "scripts/private_plots.csv";
const SEED = 0;
const MINT_LIST_START = 0;
const MINT_LIST_END = 9000;
const BATCH_SIZE = 100;

async function private_mint() {

    //Read the csv and add each mint as a single line
    let list_to_mint :MintRequirement[] = [];
    let data : string = require("fs").readFileSync(CSV_PATH, "utf8").toString();
    let rows = data.split("\r\n");
    for (let row of rows) {
        let data_row = row.split(",");
        for(let plot_id = 0 ; plot_id< 5; plot_id++ ){
            const number_plots = Number(data_row[plot_id + 1]);
            for( let mint_id = 0 ;  mint_id < number_plots; mint_id ++){
                list_to_mint.push( {address : data_row[0], plot_type : plot_id} );
            }
        }
    }

    //Important line. Seed goes here
    const shuffled_list_to_mint = random_shuffle(list_to_mint, SEED /*Seed*/);

    const [owner] = await ethers.getSigners();
    
    //This is hardhat address, change when deployed to another network.
    //const runiverseMinterContractAddress = "0xC137DB16d7cf8a749e1017839F699649106b8bC2"; //goerli
    const runiverseMinterContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const runiverseMinterContract = await ethers.getContractAt("RuniverseLandMinter", runiverseMinterContractAddress);

    //This is hardhat address, change when deployed to another network.
    //const runiverseContractAddress = "0xDE6250Ac0CD9532d96b50bA9A45d104d657Bb8Ca"; //goerli
    const runiverseContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const runiverseContract = await ethers.getContractAt("RuniverseLand", runiverseContractAddress);

    await delay(2500);

    const from_id = Math.max(MINT_LIST_START, 0);
    const to_id = Math.min(MINT_LIST_END, shuffled_list_to_mint.length -1);

    //Mints the shuffled list 
    for(let r =  from_id ; r <=  to_id; r+=BATCH_SIZE ){        
        const mint_request = shuffled_list_to_mint[r];
        const originalGasPrice = await runiverseMinterContract.provider.getGasPrice();            
        const gasPrice = (originalGasPrice).add( originalGasPrice.div( ethers.BigNumber.from('10') ) );
        console.log('Preparing transaction', gasPrice);
        let addresses = new Array <string>(); 
        let plotSizes = new Array <number>(); 
        for(let c = r; c< Math.min(to_id, r + BATCH_SIZE); c++ ){
            addresses.push(shuffled_list_to_mint[c].address);
            plotSizes.push(shuffled_list_to_mint[c].plot_type);
            console.log('Batch mint', c, shuffled_list_to_mint[c].address, shuffled_list_to_mint[c].plot_type);
        }
        console.log( addresses.length, plotSizes.length );
        
        const tx = await runiverseMinterContract.ownerMint(plotSizes, addresses, {gasLimit: 8000000, gasPrice:gasPrice })
        .catch( (error) => {errorMessage("Transaction sending error", r, error);} );
        
        if(tx){
            let receipt = await tx.wait().catch( (error) => {errorMessage("Tx.Wait() error", r, error);} );                    
            onMinted(receipt, r);
        }
        else
            errorMessage("Transaction null", r, tx);

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
        owned.add( [from,to,tokenId.toString()] );
    }
    const tokenIds = Array.from(owned);

    //console.log('Transfer logs:');
    //console.log(tokenIds);
}

function errorMessage(msg, index, error){
    console.log(msg, index, error);
    process.exit();
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function onMinted(receipt, id){
    console.log("Minting finished:", receipt.cumulativeGasUsed, receipt.effectiveGasPrice, receipt.to, id, receipt.nonce );
}

//Fisher-Yates swaps for a linear uniform shuffle
function random_shuffle(array, seed_start) {
seed(seed_start);
let currentIndex = array.length,  randomIndex;

while (currentIndex != 0) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
    array[randomIndex], array[currentIndex]];
}

return array;
}

var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;

// Takes any integer
function seed(i) {
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
}

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function random()
{
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
}
  
private_mint()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});