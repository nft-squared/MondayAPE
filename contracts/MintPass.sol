// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintPass is ERC1155(""),Ownable {
    string constant public name = "MondayAPE MintPass";
    string constant public symbol = "MapeMintPass";
    uint256 constant public TOTAL_SUPPLY = 5000;
    uint256 constant public MINT_PRICE = 0.3 ether;
    uint256 public MintTime;
    IERC721 immutable public MondayAPE;
    uint256 public totalSupply;

    constructor(IERC721 _MondayAPE) {
        MondayAPE = _MondayAPE;
    }

    function mint(uint256 amount) external payable {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        totalSupply += amount;
        require(totalSupply < TOTAL_SUPPLY, "sold out");
        require(msg.value == amount * MINT_PRICE, "invalid ethers amount");
        ERC1155._mint(msg.sender, 0, amount, "");
    }

    function burn(
        address account,
        uint256 value
    ) public {
        require(msg.sender == address(MondayAPE), "only MondayAPE");
        require(tx.origin == account, "not owner");
        _burn(account, 0, value);
    }
    /* ===================== admin ===================== */
    function setURI(string calldata newuri) external onlyOwner {
        ERC1155._setURI(newuri);
    }

    function setMintTime(uint256 timestamp) external onlyOwner {
        require(MintTime == 0 && block.timestamp < timestamp, "setMintTime");
        MintTime = timestamp;
    }

    function withdraw() external onlyOwner {
        payable(Ownable.owner()).transfer(address(this).balance);
    }
}