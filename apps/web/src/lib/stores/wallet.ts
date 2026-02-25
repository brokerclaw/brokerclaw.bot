import { writable, derived } from 'svelte/store';
import { createWalletClient, custom, formatEther, type WalletClient } from 'viem';
import { base } from '$lib/contracts/config';
import { publicClient } from '$lib/contracts/config';

interface WalletState {
	address: string | null;
	chainId: number | null;
	balance: string;
	connected: boolean;
	connecting: boolean;
	error: string | null;
}

const initialState: WalletState = {
	address: null,
	chainId: null,
	balance: '0',
	connected: false,
	connecting: false,
	error: null
};

export const wallet = writable<WalletState>(initialState);
export const walletClient = writable<WalletClient | null>(null);

export const isConnected = derived(wallet, ($w) => $w.connected);
export const shortAddress = derived(wallet, ($w) => {
	if (!$w.address) return '';
	return `${$w.address.slice(0, 6)}...${$w.address.slice(-4)}`;
});

function getEthereum(): any {
	if (typeof window !== 'undefined') {
		return (window as any).ethereum;
	}
	return null;
}

export async function connectWallet() {
	const ethereum = getEthereum();
	if (!ethereum) {
		wallet.update((s) => ({ ...s, error: 'No wallet detected. Install MetaMask or a compatible wallet.' }));
		return;
	}

	wallet.update((s) => ({ ...s, connecting: true, error: null }));

	try {
		const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
		const address = accounts[0] as `0x${string}`;

		// Switch to Base if needed
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		if (parseInt(chainId, 16) !== base.id) {
			try {
				await ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: `0x${base.id.toString(16)}` }]
				});
			} catch (switchError: any) {
				if (switchError.code === 4902) {
					await ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [
							{
								chainId: `0x${base.id.toString(16)}`,
								chainName: 'Base',
								nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
								rpcUrls: ['https://mainnet.base.org'],
								blockExplorerUrls: ['https://basescan.org']
							}
						]
					});
				}
			}
		}

		const client = createWalletClient({
			account: address,
			chain: base,
			transport: custom(ethereum)
		});
		walletClient.set(client);

		let balance = '0';
		try {
			const bal = await publicClient.getBalance({ address });
			balance = formatEther(bal);
		} catch {
			// RPC might fail, that's ok
		}

		wallet.set({
			address,
			chainId: base.id,
			balance,
			connected: true,
			connecting: false,
			error: null
		});

		// Listen for account/chain changes
		ethereum.on('accountsChanged', handleAccountsChanged);
		ethereum.on('chainChanged', () => window.location.reload());
	} catch (err: any) {
		wallet.update((s) => ({
			...s,
			connecting: false,
			error: err.message || 'Failed to connect wallet'
		}));
	}
}

function handleAccountsChanged(accounts: string[]) {
	if (accounts.length === 0) {
		disconnectWallet();
	} else {
		wallet.update((s) => ({ ...s, address: accounts[0] }));
	}
}

export function disconnectWallet() {
	const ethereum = getEthereum();
	if (ethereum) {
		ethereum.removeListener('accountsChanged', handleAccountsChanged);
	}
	wallet.set(initialState);
	walletClient.set(null);
}
