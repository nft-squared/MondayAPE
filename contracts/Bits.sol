// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

library Bits {
        ///@dev returns the number of bit 1 
    function countSetBits(uint256 bitmap) internal pure returns (uint256) {
        uint256 count = 0;
        while (bitmap > 0) {
            bitmap &= (bitmap - 1);
            count++;
        }
        return count;
    }
}