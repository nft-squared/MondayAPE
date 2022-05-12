// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./MintPass.sol";

contract AuthAPE {
    event Auth(uint256 indexed apeId, address indexed apeOwner, bytes32 apeMessage);
    MintPass immutable MINTPASS;
    constructor(MintPass _MINTPASS) {
        MINTPASS = _MINTPASS;
    }
    function auth(uint256 apeId, bytes32 apeMessage) external {
        require(MINTPASS.apeOwner(apeId) == msg.sender, "only APE owner");
        emit Auth(apeId, msg.sender, apeMessage);
    }
}