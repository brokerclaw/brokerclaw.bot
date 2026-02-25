/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				base: {
					900: '#0a0a0f',
					800: '#12121a',
					700: '#1a1a25',
					600: '#222230',
					500: '#2a2a3a'
				},
				accent: {
					DEFAULT: '#00ff88',
					dim: '#00cc6a',
					glow: 'rgba(0, 255, 136, 0.15)'
				},
				secondary: {
					DEFAULT: '#4488ff',
					dim: '#3366cc',
					glow: 'rgba(68, 136, 255, 0.15)'
				},
				danger: {
					DEFAULT: '#ff4466',
					dim: '#cc3355'
				},
				warning: {
					DEFAULT: '#ffaa00',
					dim: '#cc8800'
				},
				muted: '#6b7280',
				surface: '#16161f'
			},
			fontFamily: {
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			animation: {
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out'
			},
			keyframes: {
				'pulse-glow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			}
		}
	},
	plugins: []
};
