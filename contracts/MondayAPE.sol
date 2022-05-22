// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "./MintPass.sol";
import "./AuthAPE.sol";
contract MondayAPE is ERC721A,Ownable {
    event Mint(uint256 apeId, uint256 startId, uint256 quantity);
    event BatchMint(uint256[] apeId, uint256 startId, uint256[] quantity);
    uint256 constant public MAX_SUPPLY = 5000;
    uint256 constant private MAX_PER_APE = 30;
    MintPass immutable public MINTPASS;
    AuthAPE immutable public AUTH_APE;
    IERC721 immutable public bBAYC; // bendDao BAYC
    IERC721 immutable public BAYC; // BAYC
    uint256 public MintTime;
    string private _uri;
    mapping(uint256=>uint256) public apeMinted; // apeId => amount of mondayApe base the ape
    struct MintLog {
        uint32 apeId;
        uint32 mapeId;
        uint32 amount;
    }
    MintLog[] public mintLogs;
    constructor(IERC721 _bBAYC, IERC721 _BAYC) ERC721A("MondayAPE", "MAPE") {
        bBAYC = _bBAYC;
        BAYC = _BAYC;
        MINTPASS = new MintPass(IERC721(address(this)));
        AUTH_APE = new AuthAPE(this);
        MINTPASS.transferOwnership(msg.sender);
    }

    /**
     * @notice apeOwner return owner of APE, even though it's staked in BendDAO
     * @param tokenId ID of ape
     * @return address owner of ape
     */
    function apeOwner(uint256 tokenId) public view returns(address) {
	    address owner = IERC721(BAYC).ownerOf(tokenId);
	    return owner == address(bBAYC) ? IERC721(address(bBAYC)).ownerOf(tokenId) : owner;
    }

    function recordMintLog(uint256 apeId, uint256 quantity, uint256 curSupply) private {
        if (mintLogs.length == 0 || mintLogs[mintLogs.length-1].apeId != apeId) {
            mintLogs.push(MintLog({
                apeId: uint32(apeId),
                mapeId: uint32(curSupply),
                amount: uint32(quantity)
            }));
        }else{
            mintLogs[mintLogs.length-1].amount += uint32(quantity);
        }
    }

    function _mint(uint256 quantity) private {
        MINTPASS.burn(msg.sender, quantity);
        ERC721A._safeMint(msg.sender, quantity);
        require(ERC721A.totalSupply() <= MAX_SUPPLY, "exceed MAX_SUPPLY");
    }

    /**
     * @notice mint mint new MondayApe based on ape ID 
     * @param apeId ID of ape
     * @param quantity amount to mint
     */
    function mint(uint256 apeId, uint256 quantity) external {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        require(apeOwner(apeId) == msg.sender, "only BAYC owner");
        apeMinted[apeId] += quantity;
        require(apeMinted[apeId] < MAX_PER_APE, "exceed Mint Limit");
        uint256 currentSupply = ERC721A.totalSupply();
        recordMintLog(apeId, quantity, currentSupply);
        emit Mint(apeId, currentSupply, quantity);
        _mint(quantity);
    }

    function _baseURI() internal view override(ERC721A) returns (string memory) {
        return _uri;
    }

    /* ===================== admin functions ===================== */

    function setURI(string calldata newuri) external onlyOwner {
        _uri = newuri;
    }

    function setMintTime(uint256 timestamp) external onlyOwner {
        require(MintTime == 0 && block.timestamp < timestamp, "setMintTime");
        MintTime = timestamp;
    }
}