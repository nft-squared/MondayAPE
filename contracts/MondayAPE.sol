// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "./MintPass.sol";
import "./AuthAPE.sol";

contract MondayAPE is ERC721A,Ownable {
    MintPass immutable public MINTPASS;
    AuthAPE immutable public AUTH_APE;
    uint256 public MintTime;
    string private _uri;
    constructor(IERC721 _bAPE, IERC721 _APE) ERC721A("MondayAPE", "MAPE") {
        MINTPASS = new MintPass(_bAPE, _APE, IERC721(address(this)));
        AUTH_APE = new AuthAPE(MINTPASS);
        MINTPASS.transferOwnership(msg.sender);
    }

    function mint(uint256 apeId, uint256 quantity) external {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        require(MINTPASS.apeOwner(apeId) == msg.sender, "only APE owner");
        MINTPASS.burn(msg.sender, quantity);
        _safeMint(msg.sender, quantity);
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