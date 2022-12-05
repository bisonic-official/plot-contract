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

    uint256[] public plotsAvailablePerSize = [
        8000, // 8x8
        1000, // 16x16
        100, // 32x32
        10, // 64x64
        0 // 128x128
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
        0.12 ether,
        0.33 ether,
        5 ether,
        8 ether,
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

     //msc: deprecated, now the query is made with the ERC721 events
    /// @notice stores the current ownder address of a tokenId
    //mapping(uint256 => address) public tokenIdtoAddress;

    //msc: deprecated, now the query is made with the ERC721 events
    /// @notice stores the list of tokenId's that an address currently owns
    //mapping(address => uint256[]) addressToTokenIdArray;

    /**
     * @dev Create the contract and set the initial baseURI
     * @param _runiverseLand address the initial base URI for the token metadata URL
     */
    constructor(IRuniverseLand _runiverseLand) {
        setRuniverseLand(_runiverseLand);
        setVaultAddress(payable(msg.sender));
    }

    function mintlistStarted() public view returns (bool) {
        return block.timestamp >= mintlistStartTime;
    }

    function claimsStarted() public view returns (bool) {
        return block.timestamp >= claimsStartTime;
    }

    function publicStarted() public view returns (bool) {
        return block.timestamp >= publicMintStartTime;
    }

    function getPlotsAvailablePerSize() public view returns (uint256[] memory) {
        return plotsAvailablePerSize;
    }

    function getPlotPrices() public view returns (uint256[] memory) {
        return plotPrices;
    }

    //msc: deprecated, now the query is made with the ERC721 events
    /*function getOwnerByPlot(uint256 tokenId) public view returns (address) {
        return tokenIdtoAddress[tokenId];
    }

    function getPlotsByOwner(address walletAddress) public view returns (uint256[] memory) {
        return addressToTokenIdArray[walletAddress];
    }*/




    function getTotalMintedLands() public view returns (uint256) {
        uint256 totalMintedLands;
        totalMintedLands =  plotsMinted[0] +
                            plotsMinted[1] +
                            plotsMinted[2] +                             
                            plotsMinted[3] +
                            plotsMinted[4];
        return totalMintedLands;                                                        
    }
    
    function getTotalMintedLandsBySize() public view returns (uint256[] memory) {
        uint256[] memory plotsMintedBySize = new uint256[](5);

        plotsMintedBySize[0] = plotsMinted[0];
        plotsMintedBySize[1] = plotsMinted[1];
        plotsMintedBySize[2] = plotsMinted[2];
        plotsMintedBySize[3] = plotsMinted[3];
        plotsMintedBySize[4] = plotsMinted[4];

        return plotsMintedBySize;
    }

    function getAvailableLands() public view returns (uint256[] memory) {
        uint256[] memory plotsAvailableBySize = new uint256[](5);

        plotsAvailableBySize[0] = plotsAvailablePerSize[0] - plotsMinted[0];
        plotsAvailableBySize[1] = plotsAvailablePerSize[1] - plotsMinted[1];
        plotsAvailableBySize[2] = plotsAvailablePerSize[2] - plotsMinted[2];
        plotsAvailableBySize[3] = plotsAvailablePerSize[3] - plotsMinted[3];
        plotsAvailableBySize[4] = plotsAvailablePerSize[4] - plotsMinted[4];

        return plotsAvailableBySize;
    }    

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
     * Minting
     */
    function mint(IRuniverseLand.PlotSize plotSize, uint256 numPlots)
        public
        payable
        nonReentrant
    {
        require(publicStarted(), "Mint not started");
        require(numPlots > 0 && numPlots <= 20, "Mint from 1 to 20 plots");        
        _mintTokensCheckingValue(plotSize, numPlots, msg.sender);
    }

    function mintlistMint(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        uint256 claimedMaxPlots,
        bytes32[] calldata _merkleProof
    ) public payable nonReentrant {
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
        
        //Plain only wallet white list 
        //bytes32 _leaf = keccak256(abi.encodePacked(msg.sender));

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

    function claimlistMint(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        uint256 claimedMaxPlots,
        bytes32[] calldata _merkleProof
    ) public payable nonReentrant {
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
        
        
        //Plain only wallet white list 
        //bytes32 _leaf = keccak256(abi.encodePacked(msg.sender));

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



    function _mintTokens(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        address recipient
    ) private {        
        require(
            plotsMinted[uint256(plotSize)] <
                plotsAvailablePerSize[uint256(plotSize)],
            "All plots of that size minted"
        );        
        require(
            plotsMinted[uint256(plotSize)] + numPlots <=
                plotsAvailablePerSize[uint256(plotSize)],
            "Trying to mint too many plots"
        );        
        for (uint256 i = 0; i < numPlots; i++) {

            uint256 tokenId = ownerGetNextTokenId(plotSize);            
            plotsMinted[uint256(plotSize)] += 1;

            //Do we want to pay this GAS? 
            //msc attention here:
            //investigate if there is something in the standard, with openzeppeling
            //msc: managed to obtain tokens with the ERC721 events
            //tokenIdtoAddress[uint256(tokenId)] = recipient;
            //addressToTokenIdArray[recipient].push(tokenId);            
               
            runiverseLand.mintTokenId(recipient, tokenId, plotSize);
        }        
    }

    function ownerMint(
        IRuniverseLand.PlotSize plotSize,
        uint256 numPlots,
        address recipient
    ) public onlyOwner {
        _mintTokens(plotSize, numPlots, recipient);
    }

//msc: Be careful with thie one, will break order.
    function _mintTokensUsingTokenId(
        IRuniverseLand.PlotSize plotSize,
        uint256 tokenId,
        address recipient
    ) private {
        uint256 numPlots = 1;
        require(
            plotsMinted[uint256(plotSize)] <
                plotsAvailablePerSize[uint256(plotSize)],
            "All plots of that size minted"
        );
        require(
            plotsMinted[uint256(plotSize)] + numPlots <=
                plotsAvailablePerSize[uint256(plotSize)],
            "Trying to mint too many plots"
        );

        plotsMinted[uint256(plotSize)] += 1;

        //msc: deprecated, now the query is made with the ERC721 events
        //tokenIdtoAddress[uint256(tokenId)] = recipient;
        //addressToTokenIdArray[recipient].push(tokenId);


        runiverseLand.mintTokenId(recipient, tokenId, plotSize);
    }


//msc: Be careful with this one, will break order.
    function ownerMintUsingTokenId(
        IRuniverseLand.PlotSize plotSize,
        uint256 tokenId,
        address recipient
    ) public onlyOwner {
        _mintTokensUsingTokenId(plotSize, tokenId, recipient);
    }

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
    function setPublicMintStartTime(uint256 _newPublicMintStartTime)
        public
        onlyOwner
    {
        publicMintStartTime = _newPublicMintStartTime;
    }

    function setMintlistStartTime(uint256 _newAllowlistMintStartTime)
        public
        onlyOwner
    {
        mintlistStartTime = _newAllowlistMintStartTime;
    }

    function setClaimsStartTime(uint256 _newClaimsStartTime) public onlyOwner {
        claimsStartTime = _newClaimsStartTime;
    }

    function setMintlistMerkleRoot1(bytes32 newMerkleRoot) public onlyOwner {
        mintlistMerkleRoot1 = newMerkleRoot;
    }

    function setMintlistMerkleRoot2(bytes32 newMerkleRoot) public onlyOwner {
        mintlistMerkleRoot2 = newMerkleRoot;
    }

    function setClaimlistMerkleRoot(bytes32 newMerkleRoot) public onlyOwner {
        claimlistMerkleRoot = newMerkleRoot;
    }

    function setRuniverseLand(IRuniverseLand _newRuniverseLandAddress)
        public
        onlyOwner
    {
        runiverseLand = _newRuniverseLandAddress;
    }

    function setVaultAddress(address payable _newVaultAddress)
        public
        onlyOwner
    {
        vault = _newVaultAddress;
    }

    function setGlobalIdOffset(uint256 _newGlobalIdOffset) public onlyOwner {
        require(!mintlistStarted(), "Can't change during mint");
        plotGlobalOffset = _newGlobalIdOffset;
    }

    function setLocalIdOffsets(uint256[] memory _newPlotSizeLocalOffset) public onlyOwner {
        require(
            _newPlotSizeLocalOffset.length == 5,
            "must set exactly 5 numbers"
        );
        require(!mintlistStarted(), "Can't change during mint");
        plotSizeLocalOffset = _newPlotSizeLocalOffset;
    }

    function setPlotsAvailablePerSize(
        uint256[] memory _newPlotsAvailablePerSize
    ) public onlyOwner {
        require(
            _newPlotsAvailablePerSize.length == 5,
            "must set exactly 5 numbers"
        );
        plotsAvailablePerSize = _newPlotsAvailablePerSize;
    }

    function setPrices(uint256[] calldata _newPrices) public onlyOwner {
        require(!mintlistStarted(), "Can't change during mint");
        require(_newPrices.length == 5, "must set exactly 5 prices");
        plotPrices = _newPrices;
    }

    /**
     * @notice Withdraw funds to the vault using sendValue
     * @param _amount uint256 the amount to withdraw
     */
    function withdraw(uint256 _amount) public onlyOwner {
        require(address(vault) != address(0), "no vault");
        vault.sendValue(_amount);
    }

    function withdrawAll() public onlyOwner {
        require(address(vault) != address(0), "no vault");
        vault.sendValue(address(this).balance);
    }

    function forwardERC20s(IERC20 _token, uint256 _amount) public onlyOwner {
        require(address(msg.sender) != address(0), "req sender");
        _token.transfer(msg.sender, _amount);
    }
}
