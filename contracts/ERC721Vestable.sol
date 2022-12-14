// Runiverse Land Plots
// Website: https://runiverse.world
//
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

abstract contract ERC721Vestable is ERC721 {
    /// @notice master switch for vesting
    bool public vestingEnabled = true;

    /// @notice the tokens from 0 to lastVestedTokenId will vest over time
    uint256 public lastVestingGlobalId = 10000;

    /// @notice the time the vesting started
    uint256 public vestingStart = 1668142800; // January 1st, 2022

    /// @notice the time the vesting ends
    uint256 public vestingEnd = 1668142920; // January 1st, 2024



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
        uint256 globalId = getGlobalId(tokenId);
        if (
            vestingEnabled &&
            from != address(0) && // minting
            globalId <= lastVestingGlobalId &&
            block.timestamp < vestingEnd
        ) {
            uint256 vestingDuration = vestingEnd - vestingStart;
            uint256 chunk = vestingDuration / lastVestingGlobalId;
            require(
                block.timestamp >= (chunk * globalId) + vestingStart,
                "Not vested"
            );
        }
        
    }

    function isVestingToken(uint256 tokenId) public view returns (bool) {
        return tokenId <= lastVestingGlobalId;
    }

    function vestsAt(uint256 globalId) public view returns (uint256) {
        uint256 vestingDuration = vestingEnd - vestingStart;
        uint256 chunk = vestingDuration / lastVestingGlobalId;
        return (chunk * globalId) + vestingStart;
    }

    function isVested(uint256 tokenId) public view returns (bool) {
        uint256 globalId = getGlobalId(tokenId);
        if (!vestingEnabled) return true;
        if (globalId > lastVestingGlobalId) return true;
        if (block.timestamp > vestingEnd) return true;
        return block.timestamp >= globalId;
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
    function _setLastVestingGlobalId(uint256 _newTokenId) internal virtual {
        require(_newTokenId > 0, "Must be greater than zero");
        lastVestingGlobalId = _newTokenId;
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

    /**
     * @notice extracts global id from token id
     */
    function getGlobalId(uint256 tokenId) public pure returns (uint256) {
        return tokenId>>40;
    }

}
