"""Configuration utilities."""

import logging

from configparser import ConfigParser


def load_config(config_file):
    """Load the configuration file.

    Parameters
    ----------
    config_file : str
        The path to the configuration file.

    Returns
    -------
    config : ConfigParser
        A configuration object loaded from file.
    """

    config = ConfigParser()
    config.read(config_file)

    return config


def setup_custom_logger(name='plot-minter',
                        filename='plot.log',
                        level=logging.INFO):
    """Setup a custom logger.

    Parameters
    ----------
    name : str
        The name of the logger. This is used to load the logger later.
    filename : str
        The path to the log file.
    level : int, optional
        The logging level, by default set to INFO.
    """

    msg_format = '%(asctime)s - %(levelname)s - %(module)s - %(message)s'
    formatter = logging.Formatter(fmt=msg_format)

    handler = logging.FileHandler(filename=filename)
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)

    logger.info('Logger initialized correctly!')

    return logger
