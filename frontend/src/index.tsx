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

import ReactDOM from "react-dom/client";
import {
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { metaMaskWallet, ledgerWallet } from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from "wagmi";
import { filecoin } from 'wagmi/chains';
import { walletConnectProjectId } from './common/consts';
import { BrowserRouter } from "react-router-dom";
import { FilecoinProvider } from 'iso-filecoin-react';
import {
  WalletAdapterHd,
  WalletAdapterLedger,
} from 'iso-filecoin-wallets';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import App from "./App";

// Instantiate the wallet adapters you want to support
const adapters = [
  new WalletAdapterLedger({
    transport: TransportWebUSB,
  }),
  new WalletAdapterHd(),
]

const queryClient = new QueryClient();

const filecoinCalibrationChain = {
  id: 314159,
  name: 'Filecoin Calibration',
  nativeCurrency: {
    decimals: 18,
    name: 'testnet filecoin',
    symbol: 'tFIL',
  },
  rpcUrls: {
    // default: { http: ['/rpc/v1'] },
    default: { http: ['https://api.calibration.node.glif.io/rpc/v1'] },
  },
  blockExplorers: {
    default: {
      name: 'filfox',
      url: 'https://calibration.filfox.info/en',
    },
  },
  testnet: true,
}

const config = getDefaultConfig({
  appName: 'power-voting',
  projectId: walletConnectProjectId,
  chains: [filecoinCalibrationChain, filecoin],
  transports: {
    [filecoinCalibrationChain.id]: http(),
    [filecoin.id]: http(),
  },
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        ledgerWallet
      ]
    },
  ],
})

//dynamic add font
const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = `
  @font-face {
    font-family: 'SuisseIntl';
    src: url('/fonts/SuisseIntl-Regular.ttf') format('truetype');
  }
`;

document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FilecoinProvider adapters={adapters} reconnectOnMount={true}>
          <App />
        </FilecoinProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </BrowserRouter>
)

