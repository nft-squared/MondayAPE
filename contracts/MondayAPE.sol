// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {IERC721Upgradeable as IERC721} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {MathUpgradeable as Math} from '@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol';
import {ERC721AUpgradeable as ERC721A} from "./ERC721A/ERC721AUpgradeable.sol";

import { Bits } from './Bits.sol';

contract MondayAPE is Ownable,ERC721A {
    using Bits for uint256;
    event Mint(uint256 apeId, uint256 startId, uint256 bits);
    mapping(uint256=>uint256) public apeBitmap;
    address public mintController;
    string private _uri;
    struct MintLog {
        uint32 apeId; // bayc tokenId
        uint32 mapeId; // mondayApe start tokenId
        uint32 amount; // mint amount
    }
    MintLog[] public mintLogs;

    function initialize() external initializer {
        Ownable.__Ownable_init();
        ERC721A.__ERC721A_init("MondayAPE", "MAPE");
    }

    ///@dev record mintLog, used to binary search
    function recordMintLog(uint256 apeId, uint256 quantity, uint256 curSupply) internal {
        if (mintLogs.length == 0 || mintLogs[mintLogs.length-1].apeId != apeId) {
            mintLogs.push(MintLog({
                apeId: uint32(apeId),
                mapeId: uint32(curSupply),
                amount: uint32(quantity)
            }));
        } else {
            mintLogs[mintLogs.length-1].amount += uint32(quantity);
        }
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
     * @param to mape mint to
     * @param apeId ID of ape
     * @param bits bits to mint
     */
    function mint(address to, uint256 apeId, uint256 bits) external {
        require(msg.sender == mintController, "only controller");
        uint256 bitmap = apeBitmap[apeId];
        require(bits > 0 && bitmap & bits == 0, "invalid mint bits");
        apeBitmap[apeId] = bitmap | bits;
        uint256 currentSupply = ERC721A.totalSupply();
        uint256 quantity = bits.countSetBits();
        recordMintLog(apeId, quantity, currentSupply);
        emit Mint(apeId, currentSupply, bits);
        ERC721A._safeMint(to, quantity);
    }

    function _baseURI() internal view override(ERC721A) returns (string memory) {
        return _uri;
    }

    /* ===================== admin functions ===================== */

    function setURI(string calldata newuri) external onlyOwner {
        _uri = newuri;
    }
    function setController(address controller) external onlyOwner {
        mintController = controller;
    }
}