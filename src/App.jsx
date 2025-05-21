import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';

// Happy songs (add more as needed)
const HAPPY_SONGS = [
  'happy.mp3',
  'happy2.mp3',
  'happy3.mp3',
  'happy4.mp3'
];

// Sad songs (add more as needed)
const SAD_SONGS = [
  'sad.mp3',
  'sad2.mp3',
  'sad3.mp3',
  'sad4.mp3'
];

function App() {
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [music, setMusic] = useState('happy.mp3');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5); // Start with 50% volume
  const audioRef = useRef();

  const playRandomSong = () => {
    if (change >= 0) {
      // Play random happy song
      const randomIndex = Math.floor(Math.random() * HAPPY_SONGS.length);
      setMusic(HAPPY_SONGS[randomIndex]);
    } else {
      // Play random sad song
      const randomIndex = Math.floor(Math.random() * SAD_SONGS.length);
      setMusic(SAD_SONGS[randomIndex]);
    }
  };

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const btc = data.bitcoin.usd;
        const diff = data.bitcoin.usd_24h_change;
        setPrice(btc);
        setChange(diff);

        // Determine which music to play based on price change
        if (diff >= 0) {
          setMusic('happy.mp3');
        } else {
          setMusic('sad.mp3');
        }
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Fetch every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (!isMuted) {
        audioRef.current.load();
        audioRef.current.volume = volume;
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  }, [music, isMuted, volume]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="app-container">
      <div className="mute-container">
        <button 
          className={`mute-button ${isMuted ? 'muted' : ''}`} 
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <div className="volume-container">
          <label className="volume-label">Volume</label>
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
        <button 
          className="random-button" 
          onClick={playRandomSong}
          title="Play random song based on price trend"
        >
          <i className="fas fa-music"></i>
          Random Song
        </button>
      </div>
      <div className="price-container">
        <h2 className="bitcoin-text">BITCOIN</h2>
        <h1 className="price">{price ? `$${price.toLocaleString()}` : '--'}</h1>
        <div className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change !== null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '--'}
        </div>
      </div>
      <audio 
        ref={audioRef} 
        autoPlay 
        loop 
        onCanPlay={() => {
          if (audioRef.current && !isMuted) {
            audioRef.current.volume = volume;
            audioRef.current.play().catch(error => {
              console.error('Error playing audio:', error);
            });
          }
        }}
        onPlay={() => {
          console.log('Audio started playing');
        }}
        onError={(e) => {
          console.error('Audio error:', e.target.error);
        }}
      >
        <source src={`/music/${music}`} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      <div className="slogan">Bullish Beats and Bearish Blues</div>
      <div className="disclaimer">
        The music played on BeatCoin is used for entertainment and educational purposes only.
        <br />
        All tracks are intended for non-commercial, personal enjoyment while browsing this site.
        <br />
        If you are the copyright owner of any music featured here and wish it to be removed, please contact us and we will take action promptly.
      </div>
    </div>
  );
}

export default App;
