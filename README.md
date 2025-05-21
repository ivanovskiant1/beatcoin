# Beatcoin - Bullish Beats and Bearish Blues

A minimalistic cryptocurrency price tracker that plays music based on Bitcoin's price trend.

## Features

- Real-time Bitcoin price display
- 24-hour price change indicator
- Automatic music switching based on price trend
- Clean, minimalistic UI
- Bullish Beats and Bearish Blues slogan

## Setup

1. Install dependencies:
```bash
npm install
```

2. Place your music files in the `public/music` directory:
   - `happy.mp3` for bullish days
   - `sad.mp3` for bearish days

3. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
  ├── components/    # React components
  ├── App.jsx        # Main application component
  ├── App.css        # Styles
  └── index.js       # Entry point
public/
  ├── music/         # Audio files
  └── index.html     # HTML template
```
