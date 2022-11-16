// Runiverse Land Plots
// Website: https://runiverse.world
//
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "OpenZeppelin/openzeppelin-contracts@4.2.0/contracts/token/ERC721/ERC721.sol";
import "OpenZeppelin/openzeppelin-contracts@4.2.0/contracts/access/Ownable.sol";
import "OpenZeppelin/openzeppelin-contracts@4.2.0/contracts/token/ERC20/IERC20.sol";
import "OpenZeppelin/openzeppelin-contracts@4.2.0/contracts/security/ReentrancyGuard.sol";

abstract contract ERC721Vestable is ERC721 {
    /// @notice master switch for vesting
    bool public vestingEnabled = true;

    /// @notice the tokens from 0 to lastVestedTokenId will vest over time
    uint256 public lastVestingTokenId = 2199023256064;

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

        /*
        //Assing the tokenId to the new owner adress and add it to the new owner wallet array
        tokenIdtoAddress[uint256(tokenId)] = to;
        addressToTokenIdArray[to].push(tokenId);

        //Find the tokenId index in the previews owner wallet array
        uint index = 0;
        for(uint i=0; i<addressToTokenIdArray.length; i++) {
            if(addressToTokenIdArray[from][0] == tokenId){
                index = i;
                break;
            } 
        }        
        //Move the contet of the last position of the array on the index position then pop to remove it
        addressToTokenIdArray[from][index] = addressToTokenIdArray[from][addressToTokenIdArray.length - 1];
        addressToTokenIdArray[from].pop();
        */
        
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
