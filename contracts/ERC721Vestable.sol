// Runiverse Land Plots
// Website: https://runiverse.world
//
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

abstract contract ERC721Vestable is ERC721 {
    /// @notice master switch for vesting
    bool public vestingEnabled = true;

    /// @notice the tokens from 0 to lastVestedTokenId will vest over time
    uint256 public lastVestingTokenId = 10000;

    /// @notice the time the vesting started
    uint256 public vestingStart = 1640995200; // January 1st, 2022

    /// @notice the time the vesting ends
    uint256 public vestingEnd = 1704067200; // January 1st, 2024

    /**
     * @dev See {ERC721-_beforeTokenTransfer}.
     *
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (
            vestingEnabled &&
            from != address(0) && // minting
            tokenId < lastVestingTokenId &&
            block.timestamp < vestingEnd
        ) {
            uint256 vestingDuration = vestingEnd - vestingStart;
            uint256 chunk = vestingDuration / lastVestingTokenId;
            require(
                block.timestamp >= (chunk * tokenId) + vestingStart,
                "Not vested"
            );
        }
    }

    function isVestingToken(uint256 tokenId) public view returns (bool) {
        return tokenId < lastVestingTokenId;
    }

    function vestsAt(uint256 tokenId) public view returns (uint256) {
        uint256 vestingDuration = vestingEnd - vestingStart;
        uint256 chunk = vestingDuration / lastVestingTokenId;
        return (chunk * tokenId) + vestingStart;
    }

    function isVested(uint256 tokenId) public view returns (bool) {
        if (!vestingEnabled) return true;
        if (tokenId > lastVestingTokenId) return true;
        if (block.timestamp > vestingEnd) return true;
        return block.timestamp >= vestsAt(tokenId);
    }

    /**
     * @notice set the vesting toggle
     */
    function _setVestingEnabled(bool _newVestingEnabled) internal virtual {
        vestingEnabled = _newVestingEnabled;
    }

    /**
     * @notice set the last vesting token Id
     */
    function _setLastVestingTokenId(uint256 _newTokenId) internal virtual {
        require(_newTokenId > 0, "Must be greater than zero");
        lastVestingTokenId = _newTokenId;
    }

    /**
     * @notice set the new vesting start time
     */
    function _setVestingStart(uint256 _newVestingStart) internal virtual {
        vestingStart = _newVestingStart;
    }

    /**
     * @notice set the new vesting start time
     */
    function _setVestingEnd(uint256 _newVestingEnd) internal virtual {
        require(
            _newVestingEnd > vestingStart,
            "End must be greater than start"
        );
        vestingEnd = _newVestingEnd;
    }
}
