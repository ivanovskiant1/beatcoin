import React, { useEffect, useState, useRef, useCallback } from 'react';
import './App.css';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const POPULAR_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
  { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
  { id: 'polygon-ecosystem-token', name: 'POL (ex-MATIC)', symbol: 'POL' },
  { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM' },
  { id: 'tron', name: 'TRON', symbol: 'TRX' },
  { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB' },
  { id: 'pepe', name: 'Pepe', symbol: 'PEPE' },
  { id: 'sui', name: 'Sui', symbol: 'SUI' },
  { id: 'aptos', name: 'Aptos', symbol: 'APT' },
  { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR' },
];

// Happy songs (bullish)
const HAPPY_SONGS = [
  'happy.mp3',
  'happy2.mp3',
  'happy3.mp3',
  'happy4.mp3'
];

// Sad songs (bearish)
const SAD_SONGS = [
  'sad.mp3',
  'sad2.mp3',
  'sad3.mp3',
  'sad4.mp3'
];

function App() {
  const [selectedCoin, setSelectedCoin] = useState(POPULAR_COINS[0]);
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [music, setMusic] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef();

  // Pick a random song based on price direction
  const pickSong = useCallback((priceChange) => {
    const songList = priceChange >= 0 ? HAPPY_SONGS : SAD_SONGS;
    const randomIndex = Math.floor(Math.random() * songList.length);
    return songList[randomIndex];
  }, []);

  // Fetch price — only changes song on coin switch (initial or user-triggered)
  const fetchPrice = useCallback(async (coinId, shouldChangeSong) => {
    try {
      const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      const data = await res.json();
      const coinData = data[coinId];
      if (!coinData) return;

      setPrice(coinData.usd);
      setChange(coinData.usd_24h_change);
      setLoading(false);

      if (shouldChangeSong) {
        setMusic(pickSong(coinData.usd_24h_change));
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setLoading(false);
    }
  }, [pickSong]);

  // On coin change: reset state, fetch price, and pick a new song
  useEffect(() => {
    setPrice(null);
    setChange(null);
    setLoading(true);

    fetchPrice(selectedCoin.id, true);
    const interval = setInterval(() => fetchPrice(selectedCoin.id, false), 60000);
    return () => clearInterval(interval);
  }, [selectedCoin, fetchPrice]);

  // Play/load audio when music track changes
  useEffect(() => {
    if (audioRef.current && music) {
      audioRef.current.load();
      audioRef.current.volume = volume;
      if (!isMuted) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  }, [music]);

  const handleCoinChange = (e) => {
    const coin = POPULAR_COINS.find(c => c.id === e.target.value);
    if (coin) setSelectedCoin(coin);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Play a new random song manually
  const playRandomSong = () => {
    if (change !== null) {
      setMusic(pickSong(change));
    }
  };

  return (
    <div className="app-container">
      <div className="coin-selector">
        <select
          className="coin-dropdown"
          value={selectedCoin.id}
          onChange={handleCoinChange}
        >
          {POPULAR_COINS.map(coin => (
            <option key={coin.id} value={coin.id}>
              {coin.name} ({coin.symbol})
            </option>
          ))}
        </select>
      </div>

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
          Play song
        </button>
      </div>

      <div className="price-container">
        <h2 className="bitcoin-text">{selectedCoin.symbol}</h2>
        {loading ? (
          <h1 className="price loading-text">Loading...</h1>
        ) : (
          <h1 className="price">{price !== null ? `$${price.toLocaleString()}` : '--'}</h1>
        )}
        <div className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change !== null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '--'}
        </div>
      </div>

      <audio
        ref={audioRef}
        loop
        onError={(e) => {
          console.error('Audio error:', e.target.error);
        }}
      >
        {music && <source src={`/music/${music}`} type="audio/mp3" />}
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
