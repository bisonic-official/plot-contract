from brownie import RuniverseLand, RuniverseLandMinter, accounts, network, config
from time import sleep
import os, csv

def main(): 

    print("Current Network: {}\n".format(network.show_active()))

    #Security check to avoid publishing 
    if network.show_active() != "development":        
        return  

    #Read the CSV file for minting 
    with open(os.path.dirname(__file__) + '\minting_list.csv') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        line_count = 0
        for row in csv_reader:
            if line_count == 0:
                print(f'Column names are {", ".join(row)}')
                line_count += 1            
            print(f'Wallet #{line_count}: {row["wallet"]} [8]: {row["8_8"]} [16]: {row["16_16"]} [32]: {row["32_32"]} [64]: {row["64_64"]} [128]: {row["128_128"]}')
            line_count += 1

            accounts.at(row["wallet"], force=True)

        print(f'Processed {line_count} lines.')


    print()
    for i in range(len(accounts)):
        print("Wallet #{} = {}".format(i, accounts[i]))
    print()        

    #return


    deployer_account = accounts[0]
    runiverseLand = RuniverseLand.deploy("tokenBaseURI", {'from': deployer_account})
    print("Deployed at: ", runiverseLand.address)
    
    runiverseLandMinter = RuniverseLandMinter.deploy(runiverseLand, {'from': deployer_account})
    runiverseLand.setPrimaryMinter(runiverseLandMinter)
    #sleep(1)

    myRuniverseLand = RuniverseLand[-1]
    myRuniverseLandMinter = RuniverseLandMinter[-1]

    print(runiverseLand)
    print(runiverseLandMinter)

    print(myRuniverseLand)
    print(myRuniverseLandMinter)

    myRuniverseLand.setPrimaryMinter(myRuniverseLandMinter)
    #sleep(1)
    
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

    """
    for j in range(int(8000 / 30)):
        for i in range(len(accounts)):
            myRuniverseLandMinter.ownerMint(0, 1, accounts[i])

    for j in range(int(1000 / 30)):
        for i in range(len(accounts)):
            myRuniverseLandMinter.ownerMint(1, 1, accounts[i])

    for j in range(int(100 / 30)):
        for i in range(len(accounts)):
            myRuniverseLandMinter.ownerMint(2, 1, accounts[i])            

    for i in range(10):
        myRuniverseLandMinter.ownerMint(3, 1, accounts[i])  
    """

    """
    myRuniverseLandMinter.ownerMint(0, 1, accounts[0])
    myRuniverseLandMinter.ownerMint(1, 1, accounts[0])
    myRuniverseLandMinter.ownerMint(2, 1, accounts[0])
    myRuniverseLandMinter.ownerMint(3, 1, accounts[0])

    print()

    myRuniverseLandMinter.ownerMint(0, 1, accounts[0])
    myRuniverseLandMinter.ownerMint(1, 1, accounts[0])
    myRuniverseLandMinter.ownerMint(2, 1, accounts[0])
    myRuniverseLandMinter.ownerMint(3, 1, accounts[0])    
    
    """

    #myRuniverseLandMinter.ownerMintUsingTokenId(0, 100, accounts[0])
    #myRuniverseLandMinter.ownerMintUsingTokenId(0, 1234, accounts[0])
    


    #myRuniverseLand.mintTokenId(deployer_account, 0, 0)
    #myRuniverseLandMinter.mint(1, 1)    
    
    ###myRuniverseLandMinter.ownerMint(1, 1, deployer_account)        

    sleep(1)