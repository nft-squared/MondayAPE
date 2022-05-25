// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "./MondayAPE.sol";

contract AuthAPE is Ownable {
    MondayAPE public MONDAY_APE;
    mapping(uint256=>address) approver;
    function initialize(MondayAPE _MONDAY_APE) external initializer {
        Ownable.__Ownable_init();
        MONDAY_APE = _MONDAY_APE;
    }
    event Auth(uint256 indexed apeId, address indexed apeOwner, bytes32 apeMessage);
    function auth(uint256 apeId, bytes32 apeMessage) external {
        require(MONDAY_APE.apeOwner(apeId) == msg.sender, "only APE owner");
        approver[apeId] = msg.sender;
        emit Auth(apeId, msg.sender, apeMessage);
    }

    function authed(uint256 apeId) external view returns(bool) {
        return MONDAY_APE.apeOwner(apeId) == approver[apeId];
    }
}