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

package model

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

// sync event table
type SyncEventTbl struct {
	Id              int64  `json:"id"`
	ChainId         int64  `json:"chain_id" gorm:"not null"`
	ChainName       string `json:"chain_name" gorm:"not null"`
	ContractAddress string `json:"contract_address" gorm:"not null;unique"`
	SyncedHeight    int64  `json:"synced_height" gorm:"not null,default:0"`
}

// Contract Event - Vote
type VoteEvent struct {
	Id       *big.Int       // proposal id
	Voter    common.Address // voter address
	VoteInfo string         // The encrypted string after the time lock, the parsed content is ["reject" or "approve"]
}

// Contract Event - ProposalCreate
type ProposalCreateEvent struct {
	Id       *big.Int      // proposal id
	Proposal ProposalEvent // proposal info
}

// ProposalCreate info. Structure according to the field order of the Event, do not change the field position of this structure at will.
type ProposalEvent struct {
	Creator               common.Address // The address to create the proposal
	StartTime             *big.Int       // The start time of the proposal
	EndTime               *big.Int       // The end time of the proposal
	Timestamp             *big.Int       // The time when the proposal is created
	SnapshotTimestamp     *big.Int       // The timestamp of the snapshot sync voter address date
	Content               string         // The content of the proposal
	Title                 string         // The title of the proposal
	TokenHolderPercentage uint16         // The percentage of votes that token holders have
	SpPercentage          uint16         // The percentage of votes that sps have
	ClientPercentage      uint16         // The percentage of votes that clients have
	DeveloperPercentage   uint16         // The percentage of votes that developers have
}
