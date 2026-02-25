export function shortenAddress(address: string, chars = 4): string {
	if (!address) return '';
	return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string, decimals = 2): string {
	const num = parseFloat(amount);
	if (isNaN(num)) return '0';
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
	return num.toFixed(decimals);
}

export function formatUSD(amount: string | number): string {
	const num = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(num)) return '$0.00';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(num);
}

export function formatDate(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatTime(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDateTime(timestamp: number): string {
	return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
}

export function timeAgo(timestamp: number): string {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - timestamp;

	if (diff < 60) return 'just now';
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
	return formatDate(timestamp);
}

export function explorerLink(txHash: string): string {
	return `https://basescan.org/tx/${txHash}`;
}

export function explorerAddressLink(address: string): string {
	return `https://basescan.org/address/${address}`;
}
