// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IRuniverseLand.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract RuniverseLandMinter is Ownable, ReentrancyGuard {
    using Address for address payable;

    /// @notice Address to the ERC721 RuniverseLand contract
    IRuniverseLand public runiverseLand;

    /// @notice Address to the vault where we can withdraw
    address payable public vault;

    uint256[] plotsAvailablePerSize = [
        52500, // 8x8
        16828, // 16x16
        560, // 32x32
        105, // 64x64
        7 // 128x128
    ];

    uint256[] public plotSizeLocalOffset = [
        1, // 8x8
        1, // 16x16
        1, // 32x32
        1, // 64x64
        1 // 128x128
    ];    

    uint256 public plotGlobalOffset = 1;

    uint256[] public plotPrices = [
        0.3659 ether,
        1.0063 ether,
        15.2469 ether,
        24.3951 ether,
        type(uint256).max
    ];

    uint256 public publicMintStartTime = type(uint256).max;
    uint256 public mintlistStartTime = type(uint256).max;
    uint256 public claimsStartTime = type(uint256).max;

    /// @notice The primary merkle root
    bytes32 public mintlistMerkleRoot1;

    /// @notice The secondary Merkle root
    bytes32 public mintlistMerkleRoot2;

    /// @notice The claimslist Merkle root
    bytes32 public claimlistMerkleRoot;

    /// @notice stores the number actually minted per plot size
    mapping(uint256 => uint256) public plotsMinted;

    /// @notice stores the number minted by this address in the mintlist by size
    mapping(address => mapping(uint256 => uint256))
        public mintlistMintedPerSize;

    /// @notice stores the number minted by this address in the claimslist by size
    mapping(address => mapping(uint256 => uint256))
        public claimlistMintedPerSize;

    /**
     * @dev Create the contract and set the initial baseURI
     * @param _runiverseLand address the initial base URI for the token metadata URL
     */
    constructor(IRuniverseLand _runiverseLand) {
        setRuniverseLand(_runiverseLand);
        setVaultAddress(payable(msg.sender));
    }

    /**
     * @dev returns true if the whitelisted mintlist started.
     * @return mintlistStarted true if mintlist started.
     */
    function mintlistStarted() public view returns (bool) {
        return block.timestamp >= mintlistStartTime;
    }

    /**
     * @dev returns true if the whitelisted claimlist started.
     * @return mintlistStarted true if claimlist started.
     */
    function claimsStarted() public view returns (bool) {
        return block.timestamp >= claimsStartTime;
    }

    /**
     * @dev returns true if the public minting started.
     * @return mintlistStarted true if public minting started.
     */
    function publicStarted() public view returns (bool) {
        return block.timestamp >= publicMintStartTime;
    }

    /**
     * @dev returns how many plots were avialable since the begining.
     * @return getPlotsAvailablePerSize array uint256 of 5 elements.
     */
    function getPlotsAvailablePerSize() external view returns (uint256[] memory) {
        return plotsAvailablePerSize;
    }

    /**
     * @dev returns the eth cost of each plot.
     * @return getPlotPrices array uint256 of 5 elements.
     */
    function getPlotPrices() external view returns (uint256[] memory) {
        return plotPrices;
    }

    /**
     * @dev returns the plot type of a token id.
     * @param tokenId uint256 token id.
     * @return getPlotPrices uint256 plot type.
     */
    function getTokenIdPlotType(uint256 tokenId) external pure returns (uint256) {
        return tokenId&255;
    }

    /**
     * @dev return the total number of minted plots
     * @return getTotalMintedLands uint256 number of minted plots.
     */
    function getTotalMintedLands() external view returns (uint256) {
        uint256 totalMintedLands;
        totalMintedLands =  plotsMinted[0] +
                            plotsMinted[1] +
                            plotsMinted[2] +                             
                            plotsMinted[3] +
                            plotsMinted[4];
        return totalMintedLands;                                                        
    }
    
    /**
     * @dev return the total number of minted plots of each size.
     * @return getTotalMintedLandsBySize array uint256 number of minted plots of each size.
     */

    function getTotalMintedLandsBySize() external view returns (uint256[] memory) {
        uint256[] memory plotsMintedBySize = new uint256[](5);

        plotsMintedBySize[0] = plotsMinted[0];
        plotsMintedBySize[1] = plotsMinted[1];
        plotsMintedBySize[2] = plotsMinted[2];
        plotsMintedBySize[3] = plotsMinted[3];
        plotsMintedBySize[4] = plotsMinted[4];

        return plotsMintedBySize;
    }

    /**
     * @dev returns the number of plots left of each size.
     * @return getAvailableLands array uint256 of 5 elements.
     */
    function getAvailableLands() external view returns (uint256[] memory) {
        uint256[] memory plotsAvailableBySize = new uint256[](5);

        plotsAvailableBySize[0] = plotsAvailablePerSize[0] - plotsMinted[0];
        plotsAvailableBySize[1] = plotsAvailablePerSize[1] - plotsMinted[1];
        plotsAvailableBySize[2] = plotsAvailablePerSize[2] - plotsMinted[2];
        plotsAvailableBySize[3] = plotsAvailablePerSize[3] - plotsMinted[3];
        plotsAvailableBySize[4] = plotsAvailablePerSize[4] - plotsMinted[4];

        return plotsAvailableBySize;
    }    

    /**
     * @dev mint public method to mint when the whitelist (mintlist) is active.
     * @param _who address address that is minting. 
     * @param _leaf bytes32 merkle leaf.
     * @param _merkleProof bytes32[] merkle proof.
     * @return mintlisted bool success mint.
     */
    function mintlisted(
        address _who,
        bytes32 _leaf,
        bytes32[] calldata _merkleProof
    ) external view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(_who));
        
        if (node != _leaf) return false;
        if (
            MerkleProof.verify(_merkleProof, mintlistMerkleRoot1, _leaf) ||
            MerkleProof.verify(_merkleProof, mintlistMerkleRoot2, _leaf)
        ) {
            return true;
        }
        return false;
    }

    /**
     * @dev public method  for public minting.
     * @param plotSize PlotSize enum with plot size.
     * @param numPlots uint256 number of plots to be minted.     
     */
    function mint(IRuniverseLand.PlotSize plotSize, uint256 numPlots)
        external
        payable
        nonReentrant
    {
        require(publicStarted(), "Mint not started");
        require(numPlots > 0 && numPlots <= 20, "Mint from 1 to 20 plots");        
        _mintTokensCheckingValue(plotSize, numPlots, msg.sender);
    }

    /**
     * @dev public method to mint when the whitelist (mintlist) is active.
     * @param plotSize PlotSize enum with plot size.
     * @param numPlots uint256 number of plots to be minted. 
     * @param claimedMaxPlots uint256 maximum number of plots of plotSize size  that the address mint.
     * @param _merkleProof bytes32[] merkle proof.
     */
    function mintlistMint(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        uint256 claimedMaxPlots,
        bytes32[] calldata _merkleProof
    ) external payable nonReentrant {
        require(mintlistStarted(), "Mint not started");
        require(numPlots > 0 && numPlots <= 20, "Mint from 1 to 20 plots");
        // verify allowlist        
        bytes32 _leaf = keccak256(
            abi.encodePacked(
                msg.sender,
                ":",
                uint256(plotSize),
                ":",
                claimedMaxPlots
            )
        );

        require(
            MerkleProof.verify(_merkleProof, mintlistMerkleRoot1, _leaf) ||
                MerkleProof.verify(_merkleProof, mintlistMerkleRoot2, _leaf),
            "Invalid proof."
        );

        require(
            mintlistMintedPerSize[msg.sender][uint256(plotSize)] + numPlots <=
                claimedMaxPlots, // this is verified by the merkle proof
            "Minting more than allowed"
        );
        mintlistMintedPerSize[msg.sender][uint256(plotSize)] += numPlots;
        _mintTokensCheckingValue(plotSize, numPlots, msg.sender);
    }

    /**
     * @dev public method to claim a plot, only when (claimlist) is active.
     * @param plotSize PlotSize enum with plot size.
     * @param numPlots uint256 number of plots to be minted. 
     * @param claimedMaxPlots uint256 maximum number of plots of plotSize size  that the address mint.
     * @param _merkleProof bytes32[] merkle proof.
     */
    function claimlistMint(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        uint256 claimedMaxPlots,
        bytes32[] calldata _merkleProof
    ) external  nonReentrant {
        require(claimsStarted(), "Claims not started");

        // verify allowlist                
        bytes32 _leaf = keccak256(
            abi.encodePacked(
                msg.sender,
                ":",
                uint256(plotSize),
                ":",
                claimedMaxPlots
            )
        );

        require(
            MerkleProof.verify(_merkleProof, claimlistMerkleRoot, _leaf),
            "Invalid proof."
        );

        require(
            claimlistMintedPerSize[msg.sender][uint256(plotSize)] + numPlots <=
                claimedMaxPlots, // this is verified by the merkle proof
            "Claiming more than allowed"
        );
        claimlistMintedPerSize[msg.sender][uint256(plotSize)] += numPlots;
        _mintTokens(plotSize, numPlots, msg.sender);
    }

    /**
     * @dev checks if the amount sent is correct. Continue minting if it is correct.
     * @param plotSize PlotSize enum with plot size.
     * @param numPlots uint256 number of plots to be minted. 
     * @param recipient address  address that sent the mint.          
     */
    function _mintTokensCheckingValue(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        address recipient
    ) private {
        require(plotPrices[uint256(plotSize)] > 0, "Misconfigured prices");
        require(
            msg.value == plotPrices[uint256(plotSize)] * numPlots,
            "Ether value sent is not accurate"
        );        
        _mintTokens(plotSize, numPlots, recipient);
    }


    /**
     * @dev checks if there are plots available. Final step before sending it to RuniverseLand contract.
     * @param plotSize PlotSize enum with plot size.
     * @param numPlots uint256 number of plots to be minted. 
     * @param recipient address  address that sent the mint.          
     */
    function _mintTokens(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        address recipient
    ) private {       
        require(
            plotsMinted[uint256(plotSize)] + numPlots <=
                plotsAvailablePerSize[uint256(plotSize)],
            "Trying to mint too many plots"
        );
        for (uint256 i = 0; i < numPlots; i++) {

            uint256 tokenId = ownerGetNextTokenId(plotSize);            
            plotsMinted[uint256(plotSize)] += 1;          
               
            runiverseLand.mintTokenId(recipient, tokenId, plotSize);
        }        
    }

    /**
     * @dev Method to mint a plot and assign it to an address without any requirement. Used for private minting.
     * @param plotSize PlotSize enum with plot size.
     * @param numPlots uint256 number of plots to be minted. 
     * @param recipient address  address that sent the mint.          
     */
    function ownerMint(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        address recipient
    ) external onlyOwner {
        require(
            plotsMinted[uint256(plotSize)] + numPlots <=
                plotsAvailablePerSize[uint256(plotSize)],
            "Trying to mint too many plots"
        );
        _mintTokens(plotSize, numPlots, recipient);
    }

    /**
     * @dev Encodes the next token id.
     * @param plotSize PlotSize enum with plot size.
     * @return ownerGetNextTokenId uint256 encoded next toknId.
     */
    function ownerGetNextTokenId(IRuniverseLand.PlotSize plotSize) private view returns (uint256) {
        uint256 globalCounter = plotsMinted[0] + plotsMinted[1] + plotsMinted[2] + plotsMinted[3] + plotsMinted[4] + plotGlobalOffset;
        uint256 localCounter  = plotsMinted[uint256(plotSize)] + plotSizeLocalOffset[uint256(plotSize)];
        require( localCounter <= 4294967295, "Local index overflow" );
        require( uint256(plotSize) <= 255, "Plot index overflow" );
        
        return (globalCounter<<40) + (localCounter<<8) + uint256(plotSize);
    }

    /**
     * Owner Controls
     */
    /**
     * @dev Assigns a new public start minting time.
     * @param _newPublicMintStartTime uint256 echo time in seconds.     
     */
    function setPublicMintStartTime(uint256 _newPublicMintStartTime)
        external
        onlyOwner
    {
        publicMintStartTime = _newPublicMintStartTime;
    }

    /**
     * @dev Assigns a new mintlist start minting time.
     * @param _newAllowlistMintStartTime uint256 echo time in seconds.     
     */
    function setMintlistStartTime(uint256 _newAllowlistMintStartTime)
        external
        onlyOwner
    {
        mintlistStartTime = _newAllowlistMintStartTime;
    }

    /**
     * @dev Assigns a new claimlist start minting time.
     * @param _newClaimsStartTime uint256 echo time in seconds.     
     */
    function setClaimsStartTime(uint256 _newClaimsStartTime) external onlyOwner {
        claimsStartTime = _newClaimsStartTime;
    }

    /**
     * @dev Assigns a merkle root to the main tree for mintlist.
     * @param newMerkleRoot bytes32 merkle root
     */
    function setMintlistMerkleRoot1(bytes32 newMerkleRoot) external onlyOwner {
        mintlistMerkleRoot1 = newMerkleRoot;
    }

    /**
     * @dev Assigns a merkle root to the second tree for mintlist. Used for double buffer.
     * @param newMerkleRoot bytes32 merkle root
     */
    function setMintlistMerkleRoot2(bytes32 newMerkleRoot) external onlyOwner {
        mintlistMerkleRoot2 = newMerkleRoot;
    }

    /**
     * @dev Assigns a merkle root to the main tree for claimlist.
     * @param newMerkleRoot bytes32 merkle root
     */
    function setClaimlistMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        claimlistMerkleRoot = newMerkleRoot;
    }

    /**
     * @dev Assigns the main contract.
     * @param _newRuniverseLandAddress IRuniverseLand Main contract.
     */
    function setRuniverseLand(IRuniverseLand _newRuniverseLandAddress)
        public
        onlyOwner
    {
        runiverseLand = _newRuniverseLandAddress;
    }

    /**
     * @dev Assigns the vault address.
     * @param _newVaultAddress address vault address.
     */
    function setVaultAddress(address payable _newVaultAddress)
        public
        onlyOwner
    {
        vault = _newVaultAddress;
    }

    /**
     * @dev Assigns the offset to the global ids. This value will be added to the global id when a token is generated.
     * @param _newGlobalIdOffset uint256 offset
     */
    function setGlobalIdOffset(uint256 _newGlobalIdOffset) external onlyOwner {
        require(!mintlistStarted(), "Can't change during mint");
        plotGlobalOffset = _newGlobalIdOffset;
    }

    /**
     * @dev Assigns the offset to the local ids. This value will be added to the local id of each plot size  when a token of some size is generated.
     * @param _newPlotSizeLocalOffset uint256[] offsets
     */
    function setLocalIdOffsets(uint256[] memory _newPlotSizeLocalOffset) external onlyOwner {
        require(
            _newPlotSizeLocalOffset.length == 5,
            "must set exactly 5 numbers"
        );
        require(!mintlistStarted(), "Can't change during mint");
        plotSizeLocalOffset = _newPlotSizeLocalOffset;
    }

    /**
     * @dev Assigns the new plot prices for each plot size.
     * @param _newPrices uint256[] plots prices.
     */
    function setPrices(uint256[] calldata _newPrices) external onlyOwner {
        require(!mintlistStarted(), "Can't change during mint");
        require(_newPrices.length == 5, "must set exactly 5 prices");
        plotPrices = _newPrices;
    }

    /**
     * @notice Withdraw funds to the vault using sendValue
     * @param _amount uint256 the amount to withdraw
     */
    function withdraw(uint256 _amount) external onlyOwner {
        (bool success, ) = vault.call{value: _amount}("");
         require(success, "withdraw was not succesfull");
    }

    /**
     * @notice Withdraw all the funds to the vault using sendValue     
     */
    function withdrawAll() external onlyOwner {
        (bool success, ) = vault.call{value: address(this).balance}("");
         require(success, "withdraw all was not succesfull");
    }

    /**
     * @notice Transfer amount to a token.
     * @param _token IERC20 token to transfer
     * @param _amount uint256 amount to transfer
     */
    function forwardERC20s(IERC20 _token, uint256 _amount) external onlyOwner {
        require(address(msg.sender) != address(0), "req sender");
        _token.transfer(msg.sender, _amount);
    }
}
