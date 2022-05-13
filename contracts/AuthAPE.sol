// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./MondayAPE.sol";

contract AuthAPE {
    MondayAPE immutable public MONDAY_APE;
    constructor(MondayAPE _MONDAY_APE) {
        MONDAY_APE = _MONDAY_APE;
    }
    event Auth(uint256 indexed apeId, address indexed apeOwner, bytes32 apeMessage);
    function auth(uint256 apeId, bytes32 apeMessage) external {
        require(MONDAY_APE.apeOwner(apeId) == msg.sender, "only APE owner");
        emit Auth(apeId, msg.sender, apeMessage);
    }
}