// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//
// Runiverse Land Plots
// Website: https://runiverse.world
//
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ERC721Vestable.sol";
import "./IRuniverseLand.sol";

/**
 * @dev This implements the total set of plots in the Runiverse. The plots are
 * {ERC721} tokens.
 *
 * This contract itself is not upgradable and the tokens have a fixed supply, but the
 * minting mechanism is flexible.
 *
 * Because the totally supply of land will be minted in phases over a long
 * period of time, this contract is designed to mint through companion
 * contracts, as specified by primaryMinter and secondaryMinter.
 *
 * We specify both a primary and a secondary minter because it allows for atomic
 * upgrades without downtime.
 */
contract RuniverseLand is
    Ownable,
    ReentrancyGuard,
    ERC721Vestable,
    IRuniverseLand
{
    using Strings for uint256;

    /// @notice Maximum supply of land plots
    uint256 public constant MAX_SUPPLY = 70000;

    /// @notice Counter to track the number minted so far
    uint256 public numMinted = 0;

    /// @notice Address of the primary minter
    address public primaryMinter;

    /// @notice Address of the secondary minter
    address public secondaryMinter;

    /// @notice The base URI for the metadata of the tokens
    string public baseTokenURI;

    error NoPlotsAvailable();
    error Address0Error();



    string public constant R = "I should like to save the Shire, if I could";

    /**
     * @dev Create the contract and set the initial baseURI
     * @param baseURI string the initial base URI for the token metadata URL
     */
    constructor(string memory baseURI) ERC721("RuniverseLand", "RUNIVERSE") {
        setBaseURI(baseURI);
    }

    /**
     * @notice Mint a new token
     * @dev this relies on mintTokenId for minter and reentrancy protection
     * @param recipient address representing the owner of the new tokenId
     */
    function mint(address recipient, PlotSize size)
        public
        override
        returns (uint256)
    {
        uint256 tokenId = numMinted;
        mintTokenId(recipient, tokenId, size);
        return tokenId;
    }

    /**
     * @notice Mint a new token with a specific id
     * @param recipient address representing the owner of the new tokenId
     * @param tokenId uint256 ID of the token to be minted
     * @param size PlotSize size to be minted.
     */
    function mintTokenId(
        address recipient,
        uint256 tokenId,
        PlotSize size
    ) public override nonReentrant {
        if(numMinted >= MAX_SUPPLY){
            revert NoPlotsAvailable();
        }
        require(
            _msgSender() == primaryMinter || _msgSender() == secondaryMinter,
            "Not a minter"
        );
        numMinted += 1;
        emit LandMinted(recipient, tokenId, size);    
        
        _mint(recipient, tokenId);
    }


    /**
     * @dev Returns the URL of a given tokenId
     * @param tokenId uint256 ID of the token to be minted
     * @return string the URL of a given tokenId
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return string(abi.encodePacked(baseTokenURI, tokenId.toString()));
    }

    /**
     * @dev Returns if the token exists
     * @param tokenId uint256 the id of the token
     * @return exists bool if it exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Returns the base uri of the token.
     * @return _baseURI string prefix uri. 
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @dev Returns the total number of minted lands.
     * @return totalSupply uint256 the number of minted lands.
     */
    function totalSupply() public view returns (uint256) {
        return numMinted;
    }

    /**
     * Only the owner can do these things
     */

    /**
     * @dev Sets a new base URI
     * @param newBaseURI string the new token base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseTokenURI = newBaseURI;
    }

    /**
     * @dev Sets a new primary minter address
     * @param newPrimaryMinter address of the new minter
     */
    function setPrimaryMinter(address newPrimaryMinter) public onlyOwner {
        primaryMinter = newPrimaryMinter;
    }

    /**
     * @dev Sets a new secondary minter address
     * @param newSecondaryMinter address of the new secondary minter
     */
    function setSecondaryMinter(address newSecondaryMinter) public onlyOwner {
        secondaryMinter = newSecondaryMinter;
    }

    /**
     * @notice set the vesting toggle
     */
    function setVestingEnabled(bool _newVestingEnabled) public onlyOwner {
        _setVestingEnabled(_newVestingEnabled);
    }

    /**
     * @notice set the last vesting token Id
     */
    function setLastVestingGlobalId(uint256 _newTokenId) public onlyOwner {
        _setLastVestingGlobalId(_newTokenId);
    }

    /**
     * @notice set the new vesting start time
     */
    function setVestingStart(uint256 _newVestingStart) public onlyOwner {
        _setVestingStart(_newVestingStart);
    }

    /**
     * @notice set the new vesting end time
     */
    function setVestingEnd(uint256 _newVestingEnd) public onlyOwner {
        _setVestingEnd(_newVestingEnd);
    }

    /**
     * @dev ETH should not be sent to this contract, but in the case that it is
     * sent by accident, this function allows the owner to withdraw it.
     */
    function withdrawAll() public payable onlyOwner {
        require(payable(msg.sender).send(address(this).balance));
    }

    /**
     * @dev Again, ERC20s should not be sent to this contract, but if someone
     * does, it's nice to be able to recover them
     * @param token IERC20 the token address
     * @param amount uint256 the amount to send
     */
    function forwardERC20s(IERC20 token, uint256 amount) public onlyOwner {
        if(address(msg.sender) == address(0)){
            revert Address0Error();
        }
        token.transfer(msg.sender, amount);
    }
}
