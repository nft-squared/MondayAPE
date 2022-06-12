// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {OwnableUpgradeable as Ownable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "./MemberCard.sol";

contract AuthAPE is Ownable {
    MemberCard public memberCard;
    mapping(uint256=>address) approver;
    function initialize(MemberCard _memberCard) external initializer {
        Ownable.__Ownable_init();
        memberCard = _memberCard;
    }
    event Auth(uint256 indexed apeId, address indexed apeOwner, bytes32 apeMessage);
    function auth(uint256 apeId, bytes32 apeMessage) external {
        require(memberCard.apeOwner(apeId) == msg.sender, "only APE owner");
        approver[apeId] = msg.sender;
        emit Auth(apeId, msg.sender, apeMessage);
    }

    function authed(uint256 apeId) external view returns(bool) {
        return memberCard.apeOwner(apeId) == approver[apeId];
    }
}