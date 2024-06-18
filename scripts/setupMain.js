// Import ethers.js library
const { ethers } = require('ethers');
var fs = require('fs');

async function main() {
    // Contract address and ABI
    const contractAddress = ''; // Contract address
    const jsonFile = 'artifacts/contracts/RuniverseLand.sol/RuniverseLand.json';
    const parsed = JSON.parse(fs.readFileSync(jsonFile));
    const contractABI = parsed.abi;

    // Create an ethers.js provider
    const provider = new ethers.providers.JsonRpcProvider('https://saigon-testnet.roninchain.com/rpc');
    const signer = new ethers.Wallet(
        '', // Wallet secret key
        provider
    );

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const contractWithSigner = contract.connect(signer);

    // Pause contract
    let transaction = await contractWithSigner.pauseContract();
    await transaction.wait();
    console.log("Contract paused!");

    // Unpause contract
    transaction = await contractWithSigner.unpauseContract();
    await transaction.wait();
    console.log("Contract unpaused!");

    // Set new URI for Tokens
    const newBaseURI = '' // New URI
    transaction = await contractWithSigner.setNewBaseURI(newBaseURI);
    await transaction.wait();
    console.log("New base URI set:", await contract.getBaseURI());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
