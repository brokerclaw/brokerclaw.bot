export const ESCROW_ABI = [
	{
		inputs: [],
		name: 'offerCount',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ name: 'offerId', type: 'uint256' }],
		name: 'getOffer',
		outputs: [
			{
				name: '',
				type: 'tuple',
				components: [
					{ name: 'maker', type: 'address' },
					{ name: 'taker', type: 'address' },
					{ name: 'tokenA', type: 'address' },
					{ name: 'tokenB', type: 'address' },
					{ name: 'amountA', type: 'uint256' },
					{ name: 'amountB', type: 'uint256' },
					{ name: 'expiry', type: 'uint256' },
					{ name: 'status', type: 'uint8' },
					{ name: 'originalOfferId', type: 'uint256' }
				]
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'tokenA', type: 'address' },
			{ name: 'amountA', type: 'uint256' },
			{ name: 'tokenB', type: 'address' },
			{ name: 'amountB', type: 'uint256' },
			{ name: 'expiry', type: 'uint256' }
		],
		name: 'createOffer',
		outputs: [{ name: 'offerId', type: 'uint256' }],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'feeBps',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'treasury',
		outputs: [{ name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export const RFQ_ABI = [
	{
		inputs: [],
		name: 'requestCount',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'quoteCount',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ name: 'requestId', type: 'uint256' }],
		name: 'getRequest',
		outputs: [
			{
				name: '',
				type: 'tuple',
				components: [
					{ name: 'requester', type: 'address' },
					{ name: 'tokenA', type: 'address' },
					{ name: 'amountA', type: 'uint256' },
					{ name: 'tokenB', type: 'address' },
					{ name: 'expiry', type: 'uint256' },
					{ name: 'status', type: 'uint8' },
					{ name: 'acceptedQuoteId', type: 'uint256' }
				]
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ name: 'quoteId', type: 'uint256' }],
		name: 'getQuote',
		outputs: [
			{
				name: '',
				type: 'tuple',
				components: [
					{ name: 'requestId', type: 'uint256' },
					{ name: 'quoter', type: 'address' },
					{ name: 'amountB', type: 'uint256' },
					{ name: 'quoteExpiry', type: 'uint256' },
					{ name: 'status', type: 'uint8' }
				]
			}
		],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export const REPUTATION_ABI = [
	{
		inputs: [{ name: 'agent', type: 'address' }],
		name: 'getScore',
		outputs: [{ name: 'score', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ name: 'agent', type: 'address' }],
		name: 'getAgentStats',
		outputs: [
			{
				name: '',
				type: 'tuple',
				components: [
					{ name: 'completedDeals', type: 'uint256' },
					{ name: 'cancelledDeals', type: 'uint256' },
					{ name: 'totalVolume', type: 'uint256' },
					{ name: 'firstDealTimestamp', type: 'uint256' },
					{ name: 'lastDealTimestamp', type: 'uint256' }
				]
			}
		],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export const ERC20_ABI = [
	{
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'decimals',
		outputs: [{ name: '', type: 'uint8' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'spender', type: 'address' },
			{ name: 'amount', type: 'uint256' }
		],
		name: 'approve',
		outputs: [{ name: '', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'spender', type: 'address' }
		],
		name: 'allowance',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;
