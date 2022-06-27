// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MockBendDAO is ERC721("MockBAPE","MockBAPE") {
    IERC721 immutable public MOCK_APE;
    constructor(IERC721 _MOCK_APE) {
        MOCK_APE = _MOCK_APE;
    }
    function mint(uint256 tokenId) external {
        MOCK_APE.transferFrom(msg.sender, address(this), tokenId);
        ERC721._mint(msg.sender, tokenId);
    }
    function getBNFTAddresses(address nftAsset) external view returns (address bNftProxy, address bNftImpl) {
        require(nftAsset == address(MOCK_APE), "getBNFTAddresses");
        return (address(this), address(this));
    }
    function getBNFTRegistry() external view returns (address) {
        return address(this);
    }
}

