from time import sleep
import os, csv, random, sys

class walletOrder:
    wallet  = ""


    def __init__(self, wallet, plot8, plot16, plot32, plot64, plot128):
        self.wallet = wallet
        self.plot8 = plot8
        self.plot16 = plot16
        self.plot32 = plot32
        self.plot64 = plot64
        self.plot128 = plot128



class atomicWalletOrder:
    wallet = ""
    plotSize = 0    #0 => 8x8, 1 => 16x16, 2 => 32x32, 3 => 64x64, 4 => 128x128
    globalCounter = 0
    localCounter = 0
    tokenId  = 0

    def __init__(self, wallet, plotSize):
        self.wallet = wallet
        self.plotSize = plotSize
    



def main():

    myWalletOrderList = list()

    #Read the CSV file for minting 
    with open(os.path.dirname(__file__) + '\minting_list1.csv') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        line_count = 0
        for row in csv_reader:
            if line_count == 0:
                print(f'\nColumn names are {", ".join(row)}\n')
                line_count += 1            
            print(f'Wallet #{line_count}: {row["wallet"]} [8]: {row["8_8"]} [16]: {row["16_16"]} [32]: {row["32_32"]} [64]: {row["64_64"]} [128]: {row["128_128"]}')             

            myWalletOrder = walletOrder(row["wallet"], row["8_8"], row["16_16"], row["32_32"], row["64_64"], row["128_128"])
            myWalletOrderList.insert(line_count, myWalletOrder)     
            
            line_count += 1            

        print(f'\nProcessed {line_count} lines.\n\n')

    #for i in myWalletOrderList:
        #print(i.wallet, i.plot8, i.plot16, i.plot32, i.plot64, i.plot128)


    myAtomicWalletOrderList = list()

    for i in myWalletOrderList:
        for j in range(int(i.plot8)):
            myAtomicWalletOrder = atomicWalletOrder(i.wallet, 0)
            myAtomicWalletOrderList.insert(0, myAtomicWalletOrder)

        for j in range(int(i.plot16)):
            myAtomicWalletOrder = atomicWalletOrder(i.wallet, 1)
            myAtomicWalletOrderList.insert(0, myAtomicWalletOrder)

        for j in range(int(i.plot32)):
            myAtomicWalletOrder = atomicWalletOrder(i.wallet, 2)
            myAtomicWalletOrderList.insert(0, myAtomicWalletOrder)

        for j in range(int(i.plot64)):
            myAtomicWalletOrder = atomicWalletOrder(i.wallet, 3)
            myAtomicWalletOrderList.insert(0, myAtomicWalletOrder)

        for j in range(int(i.plot128)):
            myAtomicWalletOrder = atomicWalletOrder(i.wallet, 4)
            myAtomicWalletOrderList.insert(0, myAtomicWalletOrder)

    #for i in myAtomicWalletOrderList:        
    #    print(i.wallet, i.plotSize)        

    for i in range(1000):
        random.shuffle(myAtomicWalletOrderList)
    
    for i in myAtomicWalletOrderList:        
        print(i.wallet, i.plotSize, i.globalCounter, i.localCounter, i.tokenId)
    
    print()

    plotSizeCounter = [0, 0, 0, 0, 0]
    plotsCounter = 0

    for i in myAtomicWalletOrderList:
        #print(i.wallet, i.plotSize, i.globalCounter, i.localCounter, i.tokenId)

        plotSizeCounter[i.plotSize] = plotSizeCounter[i.plotSize] + 1
        plotsCounter = plotsCounter + 1

        i.localCounter  = plotSizeCounter[i.plotSize]
        i.globalCounter = plotsCounter

        i.tokenId = i.globalCounter
        #i.tokenId = (pow(2, 32) - 1)
        #i.tokenId = 1
        
        #print(format(i.tokenId, '#074b'))
        i.tokenId = i.tokenId << 32

        i.tokenId = i.tokenId + i.localCounter
        #i.tokenId = i.tokenId + (pow(2, 32) - 1)
        #i.tokenId = i.tokenId + 1
        
        #print(format(i.tokenId, '#074b'))
        i.tokenId = i.tokenId << 8
        
        i.tokenId = i.tokenId + i.plotSize
        #i.tokenId = i.tokenId + (pow(2, 8) - 1)        
        
        #print(format(i.tokenId, '#074b'))
        #print(i.tokenId)

    for i in myAtomicWalletOrderList:        
        print(i.wallet, i.tokenId, i.globalCounter, i.localCounter, i.plotSize, format(i.tokenId, '#074b'))

    print()

    originalStdout = sys.stdout

    with open(os.path.dirname(__file__) + '\mintInstructions.csv', 'w') as f:
        sys.stdout = f
        print("wallet,plotSize,tokenId")
        for i in myAtomicWalletOrderList:                
            print("{},{},{}".format(i.wallet, i.plotSize, i.tokenId))
        sys.stdout = originalStdout


    '''
    for i in range(100):
        a = i

        print(a)
        a = a << 40
        print(a)
        #print(format(a, '#255b'))

        a = a >> 40
        #print(a)
        #print(format(a, '#255b'))
    '''

main()