/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                base: {
                    DEFAULT: '#060c1a',
                    surface: '#0d1526',
                    card: '#121f35',
                    hover: '#1a2e4a',
                },
                accent: {
                    DEFAULT: '#3b82f6',
                    hover: '#2563eb',
                    glow: 'rgba(59, 130, 246, 0.2)',
                },
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                purple: '#8b5cf6',
                cyan: '#06b6d4',
                text: {
                    primary: '#f0f6ff',
                    secondary: '#8da4bf',
                    muted: '#4d6480',
                },
                border: {
                    DEFAULT: 'rgba(99, 140, 187, 0.15)',
                    strong: 'rgba(99, 140, 187, 0.25)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                sm: '6px',
                md: '10px',
                lg: '14px',
                xl: '20px',
            },
            boxShadow: {
                sm: '0 1px 3px rgba(0,0,0,0.4)',
                md: '0 4px 16px rgba(0,0,0,0.4)',
                lg: '0 12px 40px rgba(0,0,0,0.5)',
                glow: '0 0 20px rgba(59,130,246,0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease',
                'slide-up': 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'pulse-dot': 'pulseDot 2s ease-in-out infinite',
                'spin-slow': 'spin 1s linear infinite',
            },
            keyframes: {
                fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
                slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                pulseDot: {
                    '0%, 100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(16,185,129,0.4)' },
                    '50%': { opacity: 0.7, boxShadow: '0 0 0 5px rgba(16,185,129,0)' }
                },
            }
        },
    },
    plugins: [],
}
