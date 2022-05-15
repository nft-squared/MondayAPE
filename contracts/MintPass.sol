// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintPass is ERC1155(""), Ownable {
    string public constant name = "MondayAPE MintPass";
    string public constant symbol = "MapeMintPass";
    uint256 public constant TOTAL_SUPPLY = 5000;
    uint256 public constant TOTAL_AIRDROP = 500;
    uint256 public constant MINT_PRICE = 0.3 ether;
    uint256 public MintTime;
    IERC721 public immutable MondayAPE;
    uint256 public totalMint;
    bytes32 public AirdropMerkelRoot;
    mapping(address=>bool) public claimed;

    constructor(IERC721 _MondayAPE) {
        MondayAPE = _MondayAPE;
    }

    function mint(uint256 amount) external payable {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        totalMint += amount;
        require(totalMint + TOTAL_AIRDROP <= TOTAL_SUPPLY, "sold out");
        require(msg.value == amount * MINT_PRICE, "invalid ethers amount");
        ERC1155._mint(msg.sender, 0, amount, "");
    }

    function claim(
        bytes32 root,
        bytes32[] memory proof
    ) external {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        require(!claimed[msg.sender], "already claimed");
        claimed[msg.sender] = true;
        require(MerkleProof.verify(proof, root, keccak256(abi.encodePacked(msg.sender))), "invalid proof");
        ERC1155._mint(msg.sender, 0, 1, "");
    }

    function burn(address account, uint256 value) public {
        require(msg.sender == address(MondayAPE), "only MondayAPE");
        require(tx.origin == account, "not owner");
        _burn(account, 0, value);
    }

    /* ===================== admin ===================== */
    function setMerkelRoot(bytes32 root) external onlyOwner {
        require(AirdropMerkelRoot == bytes32(0), "already set merkel root");
        AirdropMerkelRoot = root;
    }

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
