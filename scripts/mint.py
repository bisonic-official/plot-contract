from brownie import RuniverseLand, RuniverseLandMinter, accounts, network, config
from time import sleep
import os, csv

def main(): 

    print("Current Network: {}\n".format(network.show_active()))

    #Security check to avoid publishing 
    #if network.show_active() != "development":        
    #    return 


    #deployer_account = accounts[0]
    deployer_account = accounts.add(config["wallets"]["from_key"])

    myRuniverseLand = RuniverseLand[len(RuniverseLand) - 1]
    myRuniverseLandMinter = RuniverseLandMinter[len(RuniverseLandMinter) - 1]

    print(myRuniverseLand)
    print(myRuniverseLandMinter)
    
    print(myRuniverseLandMinter.getPlotPrices())
    print(myRuniverseLandMinter.getPlotsAvailablePerSize())

    print(myRuniverseLandMinter.mintlistStarted())
    print(myRuniverseLandMinter.claimsStarted())
    print(myRuniverseLandMinter.publicStarted())

    #myRuniverseLandMinter.setPublicMintStartTime(0)
    #myRuniverseLandMinter.setMintlistStartTime(0)
    #myRuniverseLandMinter.setClaimsStartTime(0)

    print(myRuniverseLandMinter.mintlistStarted())
    print(myRuniverseLandMinter.claimsStarted())
    print(myRuniverseLandMinter.publicStarted())    

    print()
    for i in range(len(accounts)):
        print("Wallet #{} = {}".format(i, accounts[i]))
    print()


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