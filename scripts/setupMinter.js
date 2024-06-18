// Import ethers.js library
const { ethers } = require('ethers');
var fs = require('fs');

async function main() {
    // Contract address and ABI
    const contractAddress = ''; // Contract address
    const jsonFile = 'artifacts/contracts/RuniverseLandMinter.sol/RuniverseLandMinter.json';
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

    // Owner mint
    let transaction = await contractWithSigner.ownerMint(
        [], // plotSizes
        [] // recipients
    );
    await transaction.wait();
    console.log("Owner mint performed!");

    // Set vault address
    transaction = await contractWithSigner.setVaultAddress(
        "" // _newVaultAddress
    );
    await transaction.wait();
    console.log("Set new vault address!");

    // Set prices
    transaction = await contractWithSigner.setPrices(
        [] // _newPrices
    );
    await transaction.wait();
    console.log("Set new prices!");

    // Set public mint start time
    transaction = await contractWithSigner.setPublicMintStartTime(
        1 // _newPublicMintStartTime
    );
    await transaction.wait();
    console.log("Set public mint start time!");

    // Set mintlist start time
    transaction = await contractWithSigner.setMintlistStartTime(
        1 // _newAllowlistMintStartTime
    );
    await transaction.wait();
    console.log("Set mintlist start time!");

    // Set claimlist start time
    transaction = await contractWithSigner.setClaimsStartTime(
        1 // _newClaimsStartTime
    );
    await transaction.wait();
    console.log("Set claimlist start time!");

    // Set mintlist merkle roots
    transaction = await contractWithSigner.setMintlistMerkleRoot1(
        1 // newMerkleRoot1
    );
    await transaction.wait();
    console.log("Set mintlist merkle root 1!");

    transaction = await contractWithSigner.setMintlistMerkleRoot2(
        1 // newMerkleRoot2
    );
    await transaction.wait();
    console.log("Set mintlist merkle root 2!");

    // Set claimlist merkle roots
    transaction = await contractWithSigner.setClaimlistMerkleRoot(
        1 // newMerkleRoot
    );
    await transaction.wait();
    console.log("Set claimlist merkle root!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
