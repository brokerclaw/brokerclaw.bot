/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				base: {
					900: '#0d0221',
					800: '#150535',
					700: '#1a0a3e',
					600: '#2a1254',
					500: '#3d1d6e'
				},
				accent: {
					DEFAULT: '#ff2a6d',
					dim: '#d41e5c',
					glow: 'rgba(255, 42, 109, 0.2)'
				},
				neon: {
					cyan: '#05d9e8',
					pink: '#ff2a6d',
					orange: '#ff6e27',
					yellow: '#f9c846',
					green: '#01ff89',
					purple: '#d300c5'
				},
				secondary: {
					DEFAULT: '#05d9e8',
					dim: '#04b0bd',
					glow: 'rgba(5, 217, 232, 0.2)'
				},
				danger: {
					DEFAULT: '#ff4466',
					dim: '#cc3355'
				},
				warning: {
					DEFAULT: '#f9c846',
					dim: '#d4a83a'
				},
				muted: '#7b6b99',
				surface: '#1a0a3e'
			},
			fontFamily: {
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
				sans: ['Rajdhani', 'system-ui', 'sans-serif'],
				display: ['Orbitron', 'sans-serif']
			},
			animation: {
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'neon-flicker': 'neon-flicker 3s ease-in-out infinite',
				'scanline': 'scanline 8s linear infinite',
				'float': 'float 6s ease-in-out infinite'
			},
			keyframes: {
				'pulse-glow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'neon-flicker': {
					'0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
					'20%, 24%, 55%': { opacity: '0.7' }
				},
				'scanline': {
					'0%': { transform: 'translateY(-100%)' },
					'100%': { transform: 'translateY(100%)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			},
			backgroundImage: {
				'grid-pattern': 'linear-gradient(rgba(5, 217, 232, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(5, 217, 232, 0.05) 1px, transparent 1px)',
				'sunset-gradient': 'linear-gradient(180deg, #0d0221 0%, #150535 20%, #2a1254 50%, #ff2a6d33 80%, #ff6e2722 100%)'
			}
		}
	},
	plugins: []
};
