// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IERC721Upgradeable as IERC721} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import {IBNFTRegistry} from './BendDAO/IBNFTRegistry.sol';
import { MondayAPE } from './MondayAPE.sol';
import { Controller } from './Controller.sol';

contract FreeMint is Ownable, Controller {
    uint16 public constant MAX_SUPPLY = 5000;
    uint8 constant private MAX_PER_APE = 20;
    uint8 constant private MAX_PER_ONE = 5;
    struct MintConfig {
        uint32 startTime;
        uint32 endTime;
        uint16 maxSupply;
        uint8 maxPerOne;
        uint8 maxPerAPE;
    }
    MintConfig public mintConfig;
    IBNFTRegistry public BNFTRegistry; // bendDao BAYC
    IERC721 public BAYC; // BAYC

    function initialize(IBNFTRegistry _BNFTRegistry, IERC721 _BAYC) external initializer {
        Ownable.__Ownable_init();
        BNFTRegistry = _BNFTRegistry;
        BAYC = _BAYC;
        mintConfig = MintConfig({ 
            startTime: 0,
            endTime: 0,
            maxSupply: MAX_SUPPLY,
            maxPerOne: MAX_PER_APE,
            maxPerAPE: MAX_PER_ONE
        });
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
    ///@dev simple random number
    function RND() private view returns(uint256){
        return uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp)));
    }
    ///@dev gets the lowest amount bits of 1 
    function rndBits(uint256 rnd, uint8 amount) private pure returns(uint256 mask) {
        for(uint256 i = 0; i < amount; i++) {
            mask |= rnd&~(rnd-1); rnd &= ~mask;
        }
    }
    ///@dev mint new MondayAPE
    function mint(uint256 apeId) external {
        MintConfig memory cfg = mintConfig;
        require(block.timestamp > cfg.startTime && block.timestamp < cfg.endTime, "free mint closed");
        require(apeOwner(apeId) == msg.sender, "only APE owner");
        uint8 amount = cfg.maxPerOne;
        (,uint256 minted) = mondayAPE.apeMinted(apeId);
        require(minted == 0, "already minted");
        require(mondayAPE.totalSupply()+amount <= cfg.maxSupply, "free mint out");
        uint256 bits = rndBits(RND(), amount);
        Controller._mint(msg.sender, apeId, bits&((1<<mintConfig.maxPerAPE)-1));
    }

    /* ===================== admin functions ===================== */
    function setMintTime(uint32 start, uint32 end) external onlyOwner {
        MintConfig memory cfg = mintConfig;
        require(cfg.startTime == 0 && block.timestamp < start && end > start, "setMintTime");
        cfg.startTime = start;
        cfg.endTime = end;
        mintConfig = cfg;
    }

    function updateConfig(uint16 maxSupply, uint8 maxPerOne, uint8 maxPerAPE) external onlyOwner {
        MintConfig memory cfg = mintConfig;
        cfg.maxSupply = maxSupply;
        cfg.maxPerOne = maxPerOne;
        cfg.maxPerAPE = maxPerAPE;
        mintConfig = cfg;
    }

    function setMondayAPE(MondayAPE _mondayAPE) external onlyOwner {
        mondayAPE = _mondayAPE;
    }
}
