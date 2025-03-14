// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2023-2024 StorSwift Inc.
// This file is part of the PowerVoting library.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at:
// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct ProposalEventInfo {
    // proposal creator
    address creator;
    // proposal start timestamp
    uint256 startTime;
    // proposal expiration timestamp, second
    uint256 endTime;
    //proposal create timestamp
    uint256 timestamp;
     //snapshot timestamp
    uint256 snapshotTimestamp;
    //proposal content
    string content;
    //proposal title
    string title;
    //all percentage
    uint16  tokenHolderPercentage;
    uint16  spPercentage;
    uint16  clientPercentage;
    uint16  developerPercentage;
}
struct Proposal {
    // proposal creator
    address creator;
    // proposal start timestamp
    uint256 startTime;
    // proposal expiration timestamp, second
    uint256 endTime;
}

struct VoteInfo {
    // vote info
    string voteInfo;
    // vote address
    address voter;
}

// voter info
struct VoterInfo {
    uint64[] actorIds;
    uint64[] minerIds;
    string githubAccount;
    address ethAddress;
    string ucanCid;
}

// Use EnumerableSet library to handle  addresses
using EnumerableSet for EnumerableSet.AddressSet;

struct FipEditorProposal {
     // Unique identifier for the proposal
    uint256 proposalId;        
    // Address of the FIP editor
    address fipEditorAddress;   
    // the voter's information
    string voterInfo;        
    // Array containing addresses of voters
    EnumerableSet.AddressSet voters;           
}

struct HasVoted {
    mapping(address => bool) hasVotedAddress;
}