// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IERC721Upgradeable as IERC721} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {MathUpgradeable as Math} from '@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol';
import {ERC721AUpgradeable as ERC721A} from "./ERC721A/ERC721AUpgradeable.sol";
import "./MintPass.sol";
contract MondayAPE is Ownable,ERC721A {
    event Mint(uint256 apeId, uint256 startId, uint256 quantity);
    event BatchMint(uint256[] apeId, uint256 startId, uint256[] quantity);
    uint256 constant public MAX_SUPPLY = 5000;
    uint256 constant private MAX_PER_APE = 30;
    MintPass public MINTPASS;
    IERC721 public bBAYC; // bendDao BAYC
    IERC721 public BAYC; // BAYC
    uint256 public MintTime;
    string private _uri;
    mapping(uint256=>uint256) public apeMinted; // apeId => amount of mondayApe base the ape
    struct MintLog {
        uint32 apeId;
        uint32 mapeId;
        uint32 amount;
    }
    MintLog[] public mintLogs;

    function initialize(IERC721 _bBAYC, IERC721 _BAYC, MintPass _MINTPASS) external initializer {
        Ownable.__Ownable_init();
        ERC721A.__ERC721A_init("MondayAPE", "MAPE");
        bBAYC = _bBAYC;
        BAYC = _BAYC;
        MINTPASS = _MINTPASS;
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

    function recordMintLog(uint256 apeId, uint256 quantity, uint256 curSupply) internal {
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

     function findAPE(uint256 mapeId) external view returns (uint256) {
        uint256 low = 0;
        uint256 high = mintLogs.length;
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (mintLogs[mid].mapeId > mapeId) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        MintLog memory log = mintLogs[low - 1];
        require(log.mapeId <= mapeId && log.mapeId + log.amount > mapeId, "invalid mapeId");
        return log.apeId;
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