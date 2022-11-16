from brownie import RuniverseLand, RuniverseLandMinter, accounts, network, config, chain
from time import sleep
import os, csv

def main(): 

    print("Current Network: {}\n".format(network.show_active()))

    #Security check to avoid publishing 
    #if network.show_active() != "development":        
    #    return  

    print(chain.time())
    #chain.sleep(31337)
    #print(chain.time())


    #deployer_account = accounts[0]
    deployer_account = accounts.add(config["wallets"]["from_key"])

    runiverseLand = RuniverseLand.deploy("tokenBaseURI", {'from': deployer_account})
    
    print("Deployed at: ", runiverseLand.address)
    print(runiverseLand.info())
    
    runiverseLandMinter = RuniverseLandMinter.deploy(runiverseLand, {'from': deployer_account})
    print(runiverseLandMinter.info())
    
    tx = runiverseLand.setPrimaryMinter(runiverseLandMinter)
    print(tx.info())
    #sleep(1)


    myRuniverseLand = RuniverseLand[-1]
    myRuniverseLandMinter = RuniverseLandMinter[-1]

    print(runiverseLand)
    print(runiverseLandMinter)

    print(myRuniverseLand)
    print(myRuniverseLandMinter)
    
    print(myRuniverseLandMinter.getPlotPrices())
    print(myRuniverseLandMinter.getPlotsAvailablePerSize())

    print(myRuniverseLandMinter.mintlistStarted())
    print(myRuniverseLandMinter.claimsStarted())
    print(myRuniverseLandMinter.publicStarted())

    myRuniverseLandMinter.setPublicMintStartTime(1668097022)
    myRuniverseLandMinter.setMintlistStartTime(1668097022)
    myRuniverseLandMinter.setClaimsStartTime(1668097022)

    print(myRuniverseLandMinter.mintlistStarted())
    print(myRuniverseLandMinter.claimsStarted())
    print(myRuniverseLandMinter.publicStarted())    

    accounts.at("0x23bd468E58d8d3af23717176C0C0634D861cF58A", force=True)
    accounts.at("0x1Beca05b33c842271932FbAB94865F19786C1190", force=True)

    accounts[0].transfer(accounts[10], "100 ether")
    accounts[0].transfer(accounts[11], "100 ether")
    accounts[0].transfer(accounts[12], "100 ether")

    print()
    for i in range(len(accounts)):
        print("Wallet #{} = {} - Balance = {}".format(i, accounts[i], accounts[i].balance()))
    print()    

    #tx = myRuniverseLandMinter.mint(0, 1, {'from': accounts[0], 'amount':120000000000000000})
    #print(tx.info())

    merkleRoot1 = "0x798d81a96f0097d844075a912f98aad9055ef9694a57d18417b6bc3cac05240b"
    
    leafA = "0xda9e3b832616047a989569a3dec1fecadec528d702b1b070135f7bc5d395ca20"
    leafB = "0x90843e2a2f7d6dac45934430a6c7931f4d2d8e41a28af1d734360e24d92e45c4"

    merkleProofA = ["0xa1ec2077887615f9c16692007938648bdccba9a0937ec13817bcd4150317e9fe","0xa1ec2077887615f9c16692007938648bdccba9a0937ec13817bcd4150317e9fe","0x88059edbb3932b923d0ed7bd0bd7534b84c1ec25d29efeefa09f2525e5b52a8c"]
    merkleProofB = ["0xa1d3aad41348d0b2236f7feb44775fcea25151bd9d0b432e8f1b0dbbf6804f69","0x88059edbb3932b923d0ed7bd0bd7534b84c1ec25d29efeefa09f2525e5b52a8c"]

    tx = myRuniverseLandMinter.mintlisted("0x23bd468E58d8d3af23717176C0C0634D861cF58A", leafA, merkleProofA)

    tx = myRuniverseLandMinter.setMintlistMerkleRoot1(merkleRoot1)
    print(tx.info())

    tx = myRuniverseLandMinter.mintlistMint(0, 1, 10, merkleProofA, {'from': accounts[11], 'amount':120000000000000000})
    print(tx.info())

    tx = myRuniverseLandMinter.mintlistMint(0, 1, 10, merkleProofB, {'from': accounts[12], 'amount':120000000000000000})
    print(tx.info())


    tx = myRuniverseLand.safeTransferFrom(accounts[11], accounts[12], 1099511628032, {'from': accounts[11]})
    print(tx.info())


    sleep(1)
    return


    #Read the CSV file for minting 
    with open(os.path.dirname(__file__) + '\mintInstructions.csv') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        line_count = 0
        for row in csv_reader:
            if line_count == 0:
                print(f'Column names are {", ".join(row)}\n')
                line_count += 1            
            #print(f'Wallet #{line_count}: {row["wallet"]} [8]: {row["8_8"]} [16]: {row["16_16"]} [32]: {row["32_32"]} [64]: {row["64_64"]} [128]: {row["128_128"]}')
            print(f'Mint Order: {line_count} - Wallet Address: {row["wallet"]} - Plot Size: {row["plotSize"]} - TokenId: {row["tokenId"]}')
            line_count += 1

            accounts.at(row["wallet"], force=True)

            #tx = myRuniverseLandMinter.ownerMintUsingTokenId(row["plotSize"], row["tokenId"], row["wallet"], {'from': deployer_account})   
            #print(tx.info())         

            tx = myRuniverseLandMinter.ownerMint(row["plotSize"], 1, row["wallet"], {'from': deployer_account})   
            print(tx.info())   

        print(f'Processed {line_count} lines.')

    '''
    print()
    for i in range(len(accounts)):
        print("Wallet #{} = {}".format(i, accounts[i]))
    print()
    '''


    #myRuniverseLandMinter.ownerMintUsingTokenId(0, 100, accounts[0])
    #myRuniverseLandMinter.ownerMintUsingTokenId(0, 1234, accounts[0])
    

    x = myRuniverseLandMinter.getPlotPrices()
    print(x)

    x = myRuniverseLandMinter.getPlotsAvailablePerSize()
    print(x)

    x = myRuniverseLandMinter.getTotalMintedLands()
    print(x)    
     
    x = myRuniverseLandMinter.getTotalMintedLandsBySize()
    print(x)

    x = myRuniverseLandMinter.getAvailableLands()
    print(x)

    x = myRuniverseLandMinter.getOwnerByPlot(1099511628032)
    print(x)

    x = myRuniverseLandMinter.getPlotsByOwner("0xbBDfE3973A6de042c34D772Ff04bFc9942937F56")
    print(x)

    sleep(1)