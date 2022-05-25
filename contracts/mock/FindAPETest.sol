// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../MondayAPE.sol";
import {IERC721Upgradeable as IERC721} from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

contract FindAPETest is MondayAPE {
    function mintMock(uint256 apeId, uint256 quantity) external {
        uint256 currentSupply = ERC721A.totalSupply();
        recordMintLog(apeId, quantity, currentSupply);
        ERC721A._safeMint(msg.sender, quantity);
    }
}