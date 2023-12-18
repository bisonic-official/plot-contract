"""Transaction functions."""

import logging


def set_vault_address(w3, contract, private_key, owner_address, vault_address):
    """Set the vault address.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    vault_address : str
        The vault address.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('plot-minter')

    txn = contract.functions.setVaultAddress(vault_address).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        1000000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def set_plot_prices(w3, contract, private_key, owner_address, plot_prices):
    """Set the ring price.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    plot_prices : list
        The list of plot prices.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('plot-minter')

    txn = contract.functions.setPrices(plot_prices).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        1000000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def owner_mint(w3, contract, private_key, owner_address, plot_sizes,
               recipients):
    """Mints a list of plots.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    plot_sizes : list
        The list of plot sizes.
    recipients : list
        The list of recipients.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('plot-minter')

    txn = contract.functions.ownerMint(
        plot_sizes, recipients).build_transaction({
            'nonce':
            w3.eth.get_transaction_count(owner_address),
            'gas':
            1000000
        })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def withdraw_eth(w3, contract, private_key, owner_address, amount):
    """Withdraw ETH.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.
    amount : int
        The amount of Mana to withdraw.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('plot-minter')

    txn = contract.functions.withdraw(amount).build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        1000000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt


def withdraw_all_eth(w3, contract, private_key, owner_address):
    """Withdraw all Mana.

    Parameters
    ----------
    w3 : Web3
        The web3 object.
    contract
        The contract object.
    private_key : str
        The private key.
    owner_address : str
        The owner address.

    Returns
    -------
    txn : dict
        The transaction dictionary.
    """

    logger = logging.getLogger('plot-minter')

    txn = contract.functions.withdrawAll().build_transaction({
        'nonce':
        w3.eth.get_transaction_count(owner_address),
        'gas':
        100000
    })

    # Sign the transaction
    txn_signed = w3.eth.account.sign_transaction(txn, private_key)

    # Send the transaction and wait for the transaction receipt
    txn_hash = w3.eth.send_raw_transaction(txn_signed.rawTransaction)
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)
    txn_receipt = txn_receipt.transactionHash.hex()

    log_msg = f"TXN with hash: { txn_receipt }"
    logger.info(log_msg)

    return txn_receipt
