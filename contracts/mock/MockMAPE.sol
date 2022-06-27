// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../MondayAPE.sol";

contract MockMondayAPE is MondayAPE {
    string private _xname;
    function mintTo(address to, uint256 tokenId) external {
        super._mint(to, tokenId);
    }

    function fix(string calldata _xxname) external {
        _xname = _xxname;
    }
    function name() public view override returns(string memory) {
        return _xname;
    }
    function symbol() public view override returns(string memory) {
        return _xname;
    }
    
}

