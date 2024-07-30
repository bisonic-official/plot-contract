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
    // const provider = new ethers.providers.JsonRpcProvider('https://api.roninchain.com/rpc');
    const signer = new ethers.Wallet(
        '', // Wallet secret key
        provider
    );

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const contractWithSigner = contract.connect(signer);

    // Get minters
    const primaryMinter = await contract.primaryMinter();
    console.log("Primary minter:", primaryMinter);
    const secondaryMinter = await contract.secondaryMinter();
    console.log("Secondary minter:", secondaryMinter);

    // Set minters
    const primaryAddress = '0xF8492A2f0EAAb896F6b54E07d1506be9285A2500';
    let transaction = await contractWithSigner.setPrimaryMinter(
        primaryAddress, { gasPrice: 30000000000 }
    );
    await transaction.wait();

    const secondaryAddress = '';
    transaction = await contractWithSigner.setSecondaryMinter(secondaryAddress);
    await transaction.wait();
    console.log("Minters set!");
    console.log("Primary minter:", await contract.primaryMinter());
    console.log("Secondary minter:", await contract.secondaryMinter());

    // Pause contract
    transaction = await contractWithSigner.pauseContract();
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
