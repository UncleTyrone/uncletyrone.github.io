# Deployment Guide

## Quick Deploy to GitHub Pages

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `uncletyrone-portfolio`
3. Make it public
4. Don't initialize with README (we already have one)

### Step 2: Connect Local Repository
```bash
# In your project directory
git remote add origin https://github.com/UncleTyrone/uncletyrone-portfolio.git
git branch -M main
git add .
git commit -m "Initial portfolio setup"
git push -u origin main
```

### Step 3: Deploy
```bash
npm run deploy
```

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Select "gh-pages" branch and "/ (root)" folder
6. Click "Save"

Your website will be live at: `https://uncletyrone.github.io/uncletyrone-portfolio`

## Adding Media Files Before Deploy

### Before your first deployment:

1. **Add Background Video**
   - Place your `background.mp4` in the `public/` folder
   - Remove `background-placeholder.txt`

2. **Add Music Files**
   - Place your 5 MP3 files in `public/music/`:
     - `track1.mp3`
     - `track2.mp3`
     - `track3.mp3`
     - `track4.mp3`
     - `track5.mp3`
   - Remove `public/music/README.md`

3. **Test Locally**
   ```bash
   npm start
   ```
   - Verify video background works
   - Test music player functionality
   - Check all social links

4. **Deploy**
   ```bash
   npm run deploy
   ```

## Updating Your Website

After making changes:

```bash
git add .
git commit -m "Update portfolio"
git push origin main
npm run deploy
```

## Custom Domain (Optional)

To use a custom domain like `uncletyrone.com`:

1. Add a `CNAME` file in the `public/` folder with your domain
2. Configure DNS to point to GitHub Pages
3. Update the `homepage` field in `package.json`

## Troubleshooting Deployment

### Build Errors
```bash
npm run build
```
Check for any build errors before deploying.

### GitHub Pages Not Updating
- Wait 5-10 minutes for changes to propagate
- Check the Actions tab in your GitHub repository
- Ensure the `gh-pages` branch exists and has content

### 404 Errors
- Verify the repository name matches the homepage URL in `package.json`
- Check that GitHub Pages is enabled in repository settings
