export const BROKER_OTC_ABI = [
	{
		inputs: [
			{ name: 'tokenSell', type: 'address' },
			{ name: 'tokenBuy', type: 'address' },
			{ name: 'amountSell', type: 'uint256' },
			{ name: 'amountBuy', type: 'uint256' },
			{ name: 'expiry', type: 'uint256' }
		],
		name: 'createOffer',
		outputs: [{ name: 'offerId', type: 'uint256' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ name: 'offerId', type: 'uint256' }],
		name: 'fillOffer',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ name: 'offerId', type: 'uint256' }],
		name: 'cancelOffer',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'tokenWant', type: 'address' },
			{ name: 'tokenOffer', type: 'address' },
			{ name: 'amountWant', type: 'uint256' },
			{ name: 'expiry', type: 'uint256' }
		],
		name: 'createRFQ',
		outputs: [{ name: 'rfqId', type: 'uint256' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'rfqId', type: 'uint256' },
			{ name: 'amountOffer', type: 'uint256' }
		],
		name: 'submitQuote',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ name: 'rfqId', type: 'uint256' },
			{ name: 'quoteId', type: 'uint256' }
		],
		name: 'acceptQuote',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ name: 'offerId', type: 'uint256' }],
		name: 'getOffer',
		outputs: [
			{ name: 'maker', type: 'address' },
			{ name: 'tokenSell', type: 'address' },
			{ name: 'tokenBuy', type: 'address' },
			{ name: 'amountSell', type: 'uint256' },
			{ name: 'amountBuy', type: 'uint256' },
			{ name: 'expiry', type: 'uint256' },
			{ name: 'status', type: 'uint8' }
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ name: 'agent', type: 'address' }],
		name: 'getReputation',
		outputs: [
			{ name: 'deals', type: 'uint256' },
			{ name: 'volume', type: 'uint256' },
			{ name: 'score', type: 'uint256' }
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, name: 'offerId', type: 'uint256' },
			{ indexed: true, name: 'maker', type: 'address' },
			{ indexed: false, name: 'tokenSell', type: 'address' },
			{ indexed: false, name: 'tokenBuy', type: 'address' },
			{ indexed: false, name: 'amountSell', type: 'uint256' },
			{ indexed: false, name: 'amountBuy', type: 'uint256' }
		],
		name: 'OfferCreated',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, name: 'offerId', type: 'uint256' },
			{ indexed: true, name: 'taker', type: 'address' }
		],
		name: 'OfferFilled',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, name: 'offerId', type: 'uint256' },
			{ indexed: true, name: 'maker', type: 'address' },
			{ indexed: true, name: 'taker', type: 'address' },
			{ indexed: false, name: 'amountSell', type: 'uint256' },
			{ indexed: false, name: 'amountBuy', type: 'uint256' }
		],
		name: 'DealCompleted',
		type: 'event'
	}
] as const;

export const ERC20_ABI = [
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
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
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
	}
] as const;
