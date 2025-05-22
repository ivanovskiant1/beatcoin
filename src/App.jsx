import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'virtual-protocol', symbol: 'VIRTUAL', name: 'Virtual Protocol' },
  { id: 'chex-token', symbol: 'CHEX', name: 'CHEX Token' }
];

const getApiUrl = (coinId) => 
  `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;

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
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [music, setMusic] = useState('happy.mp3');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef();

  // Play a random happy song immediately on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * HAPPY_SONGS.length);
    setMusic(HAPPY_SONGS[randomIndex]);
    
    // Ensure audio plays after a short delay to handle browser autoplay policies
    const timer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(error => {
          console.log('Autoplay was prevented:', error);
        });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
        setIsLoading(true);
        const res = await fetch(getApiUrl(selectedCoin.id));
        const data = await res.json();
        const coinData = data[selectedCoin.id];
        setPrice(coinData.usd);
        setChange(coinData.usd_24h_change);
        setIsLoading(false);

        // Determine which music to play based on price change
        if (diff >= 0) {
          setMusic('happy.mp3');
        } else {
          setMusic('sad.mp3');
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Fetch every minute
    return () => clearInterval(interval);
  }, [selectedCoin]);

  useEffect(() => {
    if (audioRef.current) {
      // Set volume based on mute state
      audioRef.current.volume = isMuted ? 0 : volume;
      
      // Try to play the audio
      const playAudio = async () => {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log('Playback failed:', error);
          // If autoplay was prevented, try again after a user interaction
          const handleUserInteraction = () => {
            audioRef.current.play().catch(e => console.log('Retry playback failed:', e));
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
          };
          
          document.addEventListener('click', handleUserInteraction, { once: true });
          document.addEventListener('touchstart', handleUserInteraction, { once: true });
          document.addEventListener('keydown', handleUserInteraction, { once: true });
        }
      };
      
      playAudio();
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
      <div className="coin-selector">
        <select 
          value={selectedCoin.id}
          onChange={(e) => {
            const coin = COINS.find(c => c.id === e.target.value);
            if (coin) setSelectedCoin(coin);
          }}
          className="coin-dropdown"
        >
          {COINS.map(coin => (
            <option key={coin.id} value={coin.id}>
              {coin.name} ({coin.symbol})
            </option>
          ))}
        </select>
      </div>
      <div className="price-container">
        <h1 className="bitcoin-text">{selectedCoin.symbol}</h1>
        {isLoading ? (
          <p className="price">Loading...</p>
        ) : (
          <>
            <p className="price">${price ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : '--'}</p>
            <p className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
              {change ? (change >= 0 ? '▲' : '▼') : ''} {change ? Math.abs(change).toFixed(2) : '--'}%
            </p>
          </>
        )}
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
