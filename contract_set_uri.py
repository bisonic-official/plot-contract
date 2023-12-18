from utils.config import load_config
from utils.config import setup_custom_logger
from utils.contract import connect_to_web3
from utils.contract import load_contract
from utils.transact import set_token_uri


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

        # Get base token uri before setup
        token_uri = contract.functions.baseTokenURI().call()
        print(f'[INFO] Token URI: {token_uri}')

        # Set the new token uri
        new_token_uri = ''
        txn_receipt = set_token_uri(w3, contract, private_key, address,
                                    new_token_uri)
        txn_msg = f'Transaction receipt (setVaultAddress): {txn_receipt}'
        print(f'[INFO] {txn_msg}')

        # Get base token uri after setup
        token_uri = contract.functions.baseTokenURI().call()
        print(f'[INFO] Token URI: {token_uri}')


if __name__ == '__main__':
    main()
