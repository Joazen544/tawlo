/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
    backgroundImage: {
      'search-image': 'url(/src/assets/search.png)',
      'bell-image': 'url(/src/assets/bell.png)',
      'user-image': 'url(/src/assets/user.png)',
      'up-arrow': 'url(/src/assets/up-arrow.png)',
      'down-arrow': 'url(/src/assets/down-arrow.png)',
      'message-image': 'url(/src/assets/message.png)',
      'more-image': 'url(/src/assets/more.png)',
      'like-image': 'url(/src/assets/like.png)',
      'liked-image': 'url(/src/assets/liked.png)',
    },
  },
  plugins: [],
};
