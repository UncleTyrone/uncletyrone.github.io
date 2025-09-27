# UncleTyrone Portfolio Website

A modern, clean portfolio website built with React featuring a dark theme, video background, music player, and GitHub integration.

## Features

- 🎬 **Video Background**: Looping MP4 video background with overlay
- 🎵 **Music Player**: Clean, minimal music player with 5 track support
- 🔗 **Social Links**: Hoverable icons for GitHub, NexusMods, BuiltByBit, and Ko-fi
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🌙 **Dark Theme**: Aesthetic dark theme with glassmorphism effects
- 📊 **GitHub Integration**: Displays repositories and contributions
- ⚡ **Smooth Animations**: Hover effects and smooth scrolling

## Setup Instructions

### 1. Add Media Files

#### Background Video
- Add your background video as `public/background.mp4`
- Recommended format: MP4, optimized for web (under 10MB)

#### Music Files
- Add your 5 MP3 tracks to `public/music/`:
  - `track1.mp3`
  - `track2.mp3`
  - `track3.mp3`
  - `track4.mp3`
  - `track5.mp3`
- Add corresponding PNG images for each track:
  - `track1.png`
  - `track2.png`
  - `track3.png`
  - `track4.png`
  - `track5.png`

### 2. Customize Content

#### Update Social Links
Edit `src/components/SocialLinks.js` to update your social media links if needed.

#### Update Music Track Info
Edit `src/components/MusicPlayer.js` to customize track titles and artist names.

### 3. Development

```bash
# Install dependencies (already done)
npm install

# Start development server
npm start
```

The website will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

### 5. Deploy to GitHub Pages

#### First Time Setup
1. Create a new repository on GitHub named `uncletyrone-portfolio`
2. Push your code to the repository:

```bash
git remote add origin https://github.com/UncleTyrone/uncletyrone-portfolio.git
git add .
git commit -m "Initial portfolio setup"
git push -u origin main
```

#### Deploy
```bash
npm run deploy
```

Your website will be live at: `https://uncletyrone.github.io/uncletyrone-portfolio`

## Project Structure

```
uncletyrone-portfolio/
├── public/
│   ├── music/           # Add your MP3 files here
│   ├── background.mp4   # Add your background video here
│   └── index.html
├── src/
│   ├── components/
│   │   ├── HeroSection.js
│   │   ├── SocialLinks.js
│   │   ├── ScrollIndicator.js
│   │   ├── MusicPlayer.js
│   │   ├── RepositoriesSection.js
│   │   └── RepositoryCard.js
│   ├── App.js
│   ├── App.css
│   └── index.css
└── package.json
```

## Customization

### Colors and Styling
- Edit `src/App.css` to customize colors, fonts, and styling
- The main color scheme uses blue accents (`#60a5fa`, `#3b82f6`)

### GitHub API
- The website automatically fetches your public repositories
- Contributions are shown as forked repositories (simplified approach)
- For more advanced contribution tracking, you'd need to use GitHub's GraphQL API

### Music Player
- Supports 5 tracks maximum
- Clean, minimal design with play/pause, next/previous controls
- Shows track progress and time
- Displays track images next to track names
- Responsive design that adapts to mobile screens

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance Notes

- Video background is optimized for web
- Music files should be compressed for faster loading
- Images are optimized and use modern formats

## Troubleshooting

### Video Not Playing
- Ensure the video is in MP4 format
- Check that the file is named `background.mp4` in the `public` folder
- Some browsers may require user interaction before autoplay

### Music Not Playing
- Ensure MP3 files are in the `public/music/` folder
- Check file names match exactly: `track1.mp3`, `track2.mp3`, etc.
- Some browsers may block autoplay - user interaction required

### GitHub API Issues
- Check your GitHub username is correct in the API calls
- Ensure your repositories are public
- API rate limits may apply (60 requests per hour for unauthenticated requests)

## License

This project is open source and available under the MIT License.