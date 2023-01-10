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
    uint256 public vestingEnabled = 1;

    /// @notice the tokens from 0 to lastVestedTokenId will vest over time
    uint256 public lastVestingGlobalId = 9513;

    /// @notice the time the vesting started
    uint256 public vestingStart = 1673236800; // Dec 24th, 2022

    /// @notice the time the vesting ends
    uint256 public vestingEnd = 1673323200; // Dec 24th, 2024



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
            vestingEnabled == 1 &&
            from != address(0) && // minting
            globalId <= lastVestingGlobalId &&
            block.timestamp < vestingEnd
        ) {
            uint256 vestingDuration = vestingEnd - vestingStart;
            require(
                block.timestamp >= (vestingDuration * globalId) / lastVestingGlobalId + vestingStart,
                "Not vested"
            );
        }
        
    }
    /**
     * @notice returns true if a tokenId has besting property.
     */
    function isVestingToken(uint256 tokenId) external view returns (bool) {
        uint256 globalId = getGlobalId(tokenId);
        return globalId <= lastVestingGlobalId;
    }
    /**
     * @notice returns the time when a tokenId will be vested.
     */
    function vestsAt(uint256 tokenId) public view returns (uint256) {
        uint256 globalId = getGlobalId(tokenId);
        uint256 vestingDuration = vestingEnd - vestingStart;
        return (vestingDuration * globalId) / lastVestingGlobalId + vestingStart;
    }

    /**
     * @notice returns true if a tokenId is already vested.
     */
    function isVested(uint256 tokenId) public view returns (bool) {
        uint256 globalId = getGlobalId(tokenId);
        if (vestingEnabled == 0) return true;
        if (globalId > lastVestingGlobalId) return true;
        if (block.timestamp > vestingEnd) return true;
        return block.timestamp >= vestsAt(tokenId);
    }

    /**
     * @notice set the vesting toggle
     */
    function _setVestingEnabled(uint256 _newVestingEnabled) internal virtual {
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
        require(
            _newVestingStart < vestingEnd,
            "Start must be less than start"
        );
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
