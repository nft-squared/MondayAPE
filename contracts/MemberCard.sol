// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {MerkleProofUpgradeable as MerkleProof} from '@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol';
import {ERC1155Upgradeable as ERC1155} from '@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol';
import {IERC721Upgradeable as IERC721} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import {IBNFTRegistry} from './BendDAO/IBNFTRegistry.sol';
import { MondayAPE } from './MondayAPE.sol';
import { Controller } from './Controller.sol';
import { Bits } from './Bits.sol';

import "hardhat/console.sol";

contract MemberCard is ERC1155, Ownable, Controller {
    using Bits for uint256;
    string public constant name = "MondayAPE MemberCard";
    string public constant symbol = "MapeMemberCard";
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant MAX_AIRDROP = 500;
    uint256 public constant CARD_PRICE = 0.03 ether;
    uint256 public constant MAPE_PRICE = 0.05 ether;
    uint256 public MintTime;
    IBNFTRegistry public BNFTRegistry; // bendDao BAYC
    IERC721 public BAYC; // BAYC
    uint256 public totalMint;
    uint256 public totalAirdrop;
    bytes32 public AirdropMerkleRoot;
    mapping(address=>bool) public claimed;

    function initialize(IBNFTRegistry _BNFTRegistry, IERC721 _BAYC) external initializer {
        Ownable.__Ownable_init();
        BNFTRegistry = _BNFTRegistry;
        BAYC = _BAYC;
    }

    function totalSupply() external view returns(uint256) {
        return totalMint + totalAirdrop;
    }

    /**
     * @notice apeOwner return owner of APE, even though it's staked in BendDAO
     * @param tokenId ID of ape
     * @return address owner of ape
     */
    function apeOwner(uint256 tokenId) public view returns(address) {
	    address owner = BAYC.ownerOf(tokenId);
	    (address bBAYC,) = BNFTRegistry.getBNFTAddresses(address(BAYC));
        return owner == address(bBAYC) ? IERC721(address(bBAYC)).ownerOf(tokenId) : owner;
    }
    /**
     * @notice mint mintpass by user
     * @param amount amount to mint
     */
    function mint(uint256 amount) external payable {
        require(MintTime > 0 && block.timestamp > MintTime, "not start");
        totalMint += amount;
        require(totalMint + MAX_AIRDROP <= MAX_SUPPLY, "sold out");
        require(msg.value == amount * CARD_PRICE, "invalid ethers amount");
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

    function PriceMAPE(address minter) private view returns(uint256) {
        return ERC1155.balanceOf(minter, 0) > 0 ? MAPE_PRICE - CARD_PRICE : MAPE_PRICE;
    }

    function mintMAPE(uint256 apeId, uint256 bits) external payable {
        console.log("PriceMAPE:", PriceMAPE(msg.sender), bits.countSetBits(), msg.value);
        require(msg.value == bits.countSetBits() * PriceMAPE(msg.sender), "invalid ethers");
        Controller._mint(msg.sender, apeId, bits);
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
        console.log("time:", timestamp, block.timestamp);
        require(MintTime == 0 && block.timestamp < timestamp, "setMintTime");
        MintTime = timestamp;
    }

    function withdraw() external onlyOwner {
        payable(Ownable.owner()).transfer(address(this).balance);
    }

    function setMondayAPE(MondayAPE _mondayAPE) external onlyOwner {
        mondayAPE = _mondayAPE;
    }
}
