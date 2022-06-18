// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "./FreeMint.sol";

contract AuthAPE is Ownable {
    FreeMint public freeMint;
    mapping(uint256=>address) approver;
    function initialize(FreeMint _freeMint) external initializer {
        Ownable.__Ownable_init();
        freeMint = _freeMint;
    }
    event Auth(uint256 indexed apeId, address indexed apeOwner, bytes32 apeMessage);
    function auth(uint256 apeId, bytes32 apeMessage) external {
        require(freeMint.apeOwner(apeId) == msg.sender, "only APE owner");
        approver[apeId] = msg.sender;
        emit Auth(apeId, msg.sender, apeMessage);
    }

    function authed(uint256 apeId) external view returns(bool) {
        return freeMint.apeOwner(apeId) == approver[apeId];
    }
}