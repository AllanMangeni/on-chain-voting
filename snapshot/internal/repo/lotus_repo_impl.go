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

package repo

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	filecoinAddress "github.com/filecoin-project/go-address"
	"github.com/redis/go-redis/v9"
	"github.com/ybbus/jsonrpc/v3"

	"power-snapshot/config"
	"power-snapshot/constant"
	models "power-snapshot/internal/model"
	"power-snapshot/utils/types"
)

type LotusRPCRepo struct {
	rpcClient   jsonrpc.RPCClient
	redisClient *redis.Client
}

func NewLotusRPCRepo(redisClient *redis.Client) *LotusRPCRepo {
	return &LotusRPCRepo{
		rpcClient:   jsonrpc.NewClientWithOpts(config.Client.Network.QueryRpc[0], &jsonrpc.RPCClientOpts{}),
		redisClient: redisClient,
	}
}

func (l *LotusRPCRepo) GetTipSetByHeight(ctx context.Context, netId, height int64) ([]any, error) {
	key := fmt.Sprintf(constant.RedisTipset, netId)
	res, err := l.redisClient.HGet(ctx, key, strconv.FormatInt(height, 10)).Result()
	if err != nil {
		if err != redis.Nil {
			return nil, err
		}
	}

	if res != "" {
		var resTipSet []any
		if err := json.Unmarshal([]byte(res), &resTipSet); err != nil {
			return nil, err
		}
		return resTipSet, nil
	}

	resp, err := l.rpcClient.Call(ctx, "Filecoin.ChainGetTipSetByHeight", height, types.TipSetKey{})
	if err != nil {
		return nil, err
	}

	if resp.Error != nil {
		return nil, resp.Error
	}

	rMap, ok := resp.Result.(map[string]interface{})
	if !ok {
		return nil, resp.Error
	}

	resTipSet := rMap["Cids"].([]interface{})

	jsonData, err := json.Marshal(resTipSet)
	if err != nil {
		return nil, err
	}

	if err = l.redisClient.HSet(ctx, key, strconv.FormatInt(height, 10), string(jsonData)).Err(); err != nil {
		return nil, err
	}

	return resTipSet, nil
}

func (l *LotusRPCRepo) GetAddrBalanceBySpecialHeight(ctx context.Context, addr string, netId, height int64) (string, error) {
	tipSetKey, err := l.GetTipSetByHeight(ctx, netId, height)
	if err != nil {
		return "", err
	}

	addressStr, err := filecoinAddress.NewFromString(addr)
	if err != nil {
		return "", err
	}

	tipSetList := append([]any{}, addressStr, tipSetKey)
	resp, err := l.rpcClient.Call(ctx, "Filecoin.StateGetActor", &tipSetList)
	if err != nil {
		return "", err
	}

	tmp, err := json.Marshal(resp.Result)
	if err != nil {
		return "", err
	}

	var t types.BalanceInfo
	if err := json.Unmarshal(tmp, &t); err != nil {
		return "", err
	}

	return t.Balance, nil
}

func (l *LotusRPCRepo) GetMinerPowerByHeight(ctx context.Context, netId int64, addr string, tipsetKey []interface{}) (models.LotusMinerPower, error) {
	addressStr, err := filecoinAddress.NewFromString(addr)
	if err != nil {
		return models.LotusMinerPower{}, err
	}

	rpcParams := append([]any{}, addressStr, tipsetKey)
	resp, err := l.rpcClient.Call(ctx, "Filecoin.StateMinerPower", rpcParams)
	if err != nil {
		return models.LotusMinerPower{}, err
	}

	tmp, err := json.Marshal(resp.Result)
	if err != nil {
		return models.LotusMinerPower{}, err
	}

	var minerPower models.LotusMinerPower
	if err := json.Unmarshal(tmp, &minerPower); err != nil {
		return models.LotusMinerPower{}, err
	}

	return minerPower, nil
}

func (l *LotusRPCRepo) GetClientBalanceBySpecialHeight(ctx context.Context, netId, height int64) (models.StateMarketDeals, error) {
	tipSetKey, err := l.GetTipSetByHeight(ctx, netId, height)
	if err != nil {
		return models.StateMarketDeals{}, err
	}

	tipSetList := append([]any{}, tipSetKey)

	var t models.StateMarketDeals
	resp, err := l.rpcClient.Call(ctx, "Filecoin.StateMarketDeals", tipSetList)
	if err != nil {
		return models.StateMarketDeals{}, err
	}

	tmp, err := json.Marshal(resp.Result)
	if err != nil {
		return models.StateMarketDeals{}, err
	}

	if err := json.Unmarshal(tmp, &t); err != nil {
		return models.StateMarketDeals{}, err
	}

	return t, nil
}

func (l *LotusRPCRepo) GetNewestHeight(ctx context.Context, netId int64) (height int64, err error) {
	resp, err := l.rpcClient.Call(ctx, "Filecoin.ChainHead")
	if err != nil {
		return 0, nil
	}

	height, err = resp.Result.(map[string]interface{})["Height"].(json.Number).Int64()
	if err != nil {
		return 0, nil
	}

	return height, nil
}

func (l *LotusRPCRepo) GetBlockHeader(ctx context.Context, netId, height int64) (models.BlockHeader, error) {
	tipSetKey, err := l.GetTipSetByHeight(ctx, netId, height)
	if err != nil {
		return models.BlockHeader{}, err
	}

	marshal, err := json.Marshal(tipSetKey)
	if err != nil {
		return models.BlockHeader{}, err
	}

	var blockParam []models.GetBlockParam
	err = json.Unmarshal(marshal, &blockParam)
	if err != nil {
		return models.BlockHeader{}, err
	}

	resp, err := l.rpcClient.Call(ctx, "Filecoin.ChainGetBlock", []models.GetBlockParam{{Empty: blockParam[0].Empty}})

	if err != nil {
		return models.BlockHeader{}, err
	}

	if resp.Error != nil {
		return models.BlockHeader{}, resp.Error
	}

	tmp, err := json.Marshal(resp.Result.(map[string]interface{}))
	if err != nil {
		return models.BlockHeader{}, err
	}

	var block models.BlockHeader
	if err := json.Unmarshal(tmp, &block); err != nil {
		return block, err
	}

	return block, nil
}

func (l *LotusRPCRepo) GetWalletBalanceByHeight(ctx context.Context, id string, netId, height int64) (string, error) {
	tipSetKey, err := l.GetTipSetByHeight(ctx, netId, height)
	if err != nil {
		return "0", err
	}

	addressStr, err := filecoinAddress.NewFromString(id)
	if err != nil {
		return "0", err
	}

	tipSetList := append([]any{}, addressStr, tipSetKey)

	resp, err := l.rpcClient.Call(ctx, "Filecoin.StateGetActor", &tipSetList)
	if err != nil {
		return "0", err
	}

	tmp, err := json.Marshal(resp.Result)
	if err != nil {
		return "0", err
	}

	var t types.BalanceInfo
	if err := json.Unmarshal(tmp, &t); err != nil {
		return "0", err
	}

	return t.Balance, nil
}

func (l *LotusRPCRepo) GetClientBalanceByHeight(ctx context.Context, netId, height int64) (types.StateMarketDeals, error) {
	tipSetKey, err := l.GetTipSetByHeight(ctx, netId, height)
	if err != nil {
		return types.StateMarketDeals{}, err
	}

	tipSetList := append([]any{}, tipSetKey)

	var t types.StateMarketDeals
	resp, err := l.rpcClient.Call(ctx, "Filecoin.StateMarketDeals", tipSetList)
	if err != nil {
		return types.StateMarketDeals{}, err
	}

	tmp, err := json.Marshal(resp.Result)
	if err != nil {
		return types.StateMarketDeals{}, err
	}

	if err := json.Unmarshal(tmp, &t); err != nil {
		return types.StateMarketDeals{}, err
	}

	return t, nil
}
