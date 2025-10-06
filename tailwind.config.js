module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{js,ts,jsx,tsx}',
    'node_modules/daisyui/dist/**/*.js',
    'node_modules/react-daisyui/dist/**/*.js',
  ],
  daisyui: {
    themes: ['corporate', 'black'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  theme: {
    extend: {
      colors: {
        'primary-blue': 'var(--primary-blue, #1a73e8)',
        'primary-purple': 'var(--primary-purple, #8e24aa)',
        'accent-orange': 'var(--accent-orange, #ff9800)',
        'text-dark': 'var(--text-dark, #1e1e1e)',
        'text-medium': 'var(--text-medium, #4a4a4a)',
        'text-light': 'var(--text-light, #666)',
        'background-light': 'var(--background-light, #f9f9f9)',
        'background-white': 'var(--background-white, #ffffff)',
        'background-blue-light': 'var(--background-blue-light, #e8f0fe)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle, 0 4px 12px rgba(0,0,0,0.08))',
        medium: 'var(--shadow-medium, 0 8px 20px rgba(0,0,0,0.1))',
      },
      borderRadius: {
        small: 'var(--border-radius-small, 8px)',
        medium: 'var(--border-radius-medium, 12px)',
        large: 'var(--border-radius-large, 30px)',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-blue-purple':
          'var(--gradient-blue-purple, linear-gradient(135deg, #1a73e8, #8e24aa))',
      },
    },
  },
};
