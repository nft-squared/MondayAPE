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
    uint256 constant public TOTAL_SUPPLY = 5000;
    uint256 constant private LIMIT_PER_APE = 30;
    MintPass immutable public MINTPASS;
    AuthAPE immutable public AUTH_APE;
    IERC721 immutable public bAPE; // bendDao APE
    IERC721 immutable public APE; // APE
    uint256 public MintTime;
    string private _uri;
    mapping(uint256=>uint256) public apeMinted; // apeId => amount of mondayApe base the ape
    constructor(IERC721 _bAPE, IERC721 _APE) ERC721A("MondayAPE", "MAPE") {
        bAPE = _bAPE;
        APE = _APE;
        MINTPASS = new MintPass(IERC721(address(this)));
        AUTH_APE = new AuthAPE(this);
        MINTPASS.transferOwnership(msg.sender);
    }

    function apeOwner(uint256 tokenId) public view returns(address) {
	    address owner = IERC721(APE).ownerOf(tokenId);
	    return owner == address(bAPE) ? IERC721(address(bAPE)).ownerOf(tokenId) : owner;
    }

    function _mint(uint256 quantity) private {
        MINTPASS.burn(msg.sender, quantity);
        ERC721A._safeMint(msg.sender, quantity);
        require(ERC721A.totalSupply() <= TOTAL_SUPPLY, "exceed TOTAL_SUPPLY");
    }

    function mint(uint256 apeId, uint256 quantity) external {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        require(apeOwner(apeId) == msg.sender, "only APE owner");
        apeMinted[apeId] += quantity;
        require(apeMinted[apeId] < LIMIT_PER_APE, "exceed Mint Limit");
        emit Mint(apeId, ERC721A.totalSupply(), quantity);
        _mint(quantity);
    }

    function batchMint(uint256[] calldata apeIds, uint256[] calldata quantities) external {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        require(apeIds.length == quantities.length, "different length");
        uint256 totalQuantity;
        for(uint256 i = 0; i < apeIds.length; i++) {
            uint256 apeId = apeIds[i];
            uint256 quantity = quantities[i];
            require(apeOwner(apeId) == msg.sender, "only APE owner");
            apeMinted[apeId] += quantity;
            require(apeMinted[apeId] < LIMIT_PER_APE, "exceed Mint Limit");
            totalQuantity += quantity;
        }
        emit BatchMint(apeIds, ERC721A.totalSupply(), quantities);
        _mint(totalQuantity);
    }

    function _baseURI() internal view override(ERC721A) returns (string memory) {
        return _uri;
    }

    /* ===================== admin ===================== */
    function setURI(string calldata newuri) external onlyOwner {
        _uri = newuri;
    }

    function setMintTime(uint256 timestamp) external onlyOwner {
        require(MintTime == 0 && block.timestamp < timestamp, "setMintTime");
        MintTime = timestamp;
    }
}