from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.transact import set_vault_address
from utils.transact import set_plot_prices


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

        # Get vault address before setup
        vault_address = contract.functions.vault().call()
        print(f'[INFO] Vault address: {vault_address}')

        # # Set the vault address
        # vault_address = config['account']['address']
        # txn_receipt = set_vault_address(w3, contract, private_key, address,
        #                                 vault_address)
        # txn_msg = f'Transaction receipt (setVaultAddress): {txn_receipt}'
        # print(f'[INFO] {txn_msg}')

        # # Get vault address after setup
        # vault_address = contract.functions.vault().call()
        # print(f'[INFO] Vault address: {vault_address}')

        # Get plots available to mint
        plots_available = contract.functions.getAvailableLands().call()
        print(f'[INFO] Plots available: {plots_available}')

        # Verify the plot prices before setup
        plot_prices = contract.functions.getPlotPrices().call()
        print(f'[INFO] Plot prices: {plot_prices}')

        # # Set the ring price
        # plot_prices = [1, 1, 1, 1, 1, 1]
        # txn_receipt = set_plot_prices(w3, contract, private_key, address,
        #                               plot_prices)
        # txn_msg = f'Transaction receipt (setPrices): {txn_receipt}'
        # print(f'[INFO] {txn_msg}')

        # # Verify the plot prices after setup
        # plot_prices = contract.functions.getPlotPrices().call()
        # print(f'[INFO] Plot prices: {plot_prices}')


if __name__ == '__main__':
    main()
