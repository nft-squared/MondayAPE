// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {MerkleProofUpgradeable as MerkleProof} from '@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol';
import {ERC1155Upgradeable as ERC1155} from '@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol';
import {IERC721Upgradeable as IERC721} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract MintPass is ERC1155, Ownable {
    string public constant name = "MondayAPE MintPass";
    string public constant symbol = "MapeMintPass";
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant MAX_AIRDROP = 500;
    uint256 public constant MINT_PRICE = 0.3 ether;
    uint256 public MintTime;
    IERC721 public MondayAPE;
    uint256 public totalMint;
    uint256 public totalAirdrop;
    bytes32 public AirdropMerkleRoot;
    mapping(address=>bool) public claimed;

    function initialize() external initializer {
        Ownable.__Ownable_init();
    }

    function totalSupply() external view returns(uint256) {
        return totalMint + totalAirdrop;
    }
    /**
     * @notice mint mintpass by user
     * @param amount amount to mint
     */
    function mint(uint256 amount) external payable {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        totalMint += amount;
        require(totalMint + MAX_AIRDROP <= MAX_SUPPLY, "sold out");
        require(msg.value == amount * MINT_PRICE, "invalid ethers amount");
        ERC1155._mint(msg.sender, 0, amount, "");
    }
    /**
     * @notice claim airdrop by user
     * @param proof merkle proof of the airdrop infomation
     * @param amount amount to claim
     */
    function claim(
        bytes32[] memory proof,
        uint256 amount
    ) external {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        require(!claimed[msg.sender], "already claimed");
        claimed[msg.sender] = true;
        totalAirdrop += amount;
        require(totalAirdrop < MAX_AIRDROP, "exceed airdrop");
        require(MerkleProof.verify(proof, AirdropMerkleRoot, keccak256(abi.encodePacked(msg.sender, amount))), "invalid proof");
        ERC1155._mint(msg.sender, 0, amount, "");
    }
    /**
     * @notice burn mintpass, used by MondayAPE
     * @param account which account to burn
     * @param value amount to burn
     */
    function burn(address account, uint256 value) public {
        require(msg.sender == address(MondayAPE), "only MondayAPE");
        require(tx.origin == account, "not owner");
        _burn(account, 0, value);
    }

    /* ===================== admin functions ===================== */

    function setMerkleRoot(bytes32 root) external onlyOwner {
        require(AirdropMerkleRoot == bytes32(0), "already set merkle root");
        AirdropMerkleRoot = root;
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

    function setMondayAPE(IERC721 _MondayAPE) external onlyOwner {
        MondayAPE = _MondayAPE;
    }
}
