from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.transact import owner_mint


def main():
    """The main function to mint and NFT."""

    # Load config and setup logger
    config = load_config('config.ini')
    logger = setup_custom_logger()

    # Connect to web3
    w3, status = connect_to_web3(network=config['network']['network'],
                                 api_key=config['network']['api_key'])
    private_key = config['account']['private_key']
    address = config['account']['address']

    if status:
        connection_msg = 'Web3 connection successful!'
        print(f'[INFO] {connection_msg}')
        logger.info(connection_msg)

        # Load the contract
        contract = load_contract(w3, config['contract']['address'],
                                 config['contract']['abi'])

        # Get vault address
        vault_address = contract.functions.vault().call()
        print(f'[INFO] Vault address: {vault_address}')

        # Get plots available before mint
        plots_available = contract.functions.getAvailableLands().call()
        print(f'[INFO] Plots available: {plots_available}')

        # Verify the plot prices before mint
        plot_prices = contract.functions.getPlotPrices().call()
        print(f'[INFO] Plot prices: {plot_prices}')

        # Mint plots
        plot_sizes = []
        recipients = []
        txn_receipt = owner_mint(w3, contract, private_key, address,
                                 plot_sizes, recipients)
        print(f'[INFO] Transaction receipt: {txn_receipt}')

        # Get plots available before mint
        plots_available = contract.functions.getAvailableLands().call()
        print(f'[INFO] Plots available: {plots_available}')


if __name__ == '__main__':
    main()
