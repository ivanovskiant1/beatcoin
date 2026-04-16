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

const HAPPY_SONGS = ['happy.mp3', 'happy2.mp3', 'happy3.mp3', 'happy4.mp3'];
const SAD_SONGS = ['sad.mp3', 'sad2.mp3', 'sad3.mp3', 'sad4.mp3'];

// Fetch with retry for rate limiting
async function fetchWithRetry(url, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
}

function pickSong(priceChange) {
  const songList = priceChange >= 0 ? HAPPY_SONGS : SAD_SONGS;
  return songList[Math.floor(Math.random() * songList.length)];
}

function App() {
  const [selectedCoin, setSelectedCoin] = useState(POPULAR_COINS[0]);
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Single Audio instance — lives outside React render cycle
  const audioRef = useRef(null);
  const currentMoodRef = useRef(null); // 'happy' or 'sad'
  const debounceRef = useRef();
  const searchDebounceRef = useRef();
  const dropdownRef = useRef();

  // Create the Audio object once on mount
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Imperatively play a song — no React state involved
  const playSong = useCallback((songFile) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.src = `/music/${songFile}`;
    audio.volume = volume;
    audio.muted = isMuted;
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  }, [volume, isMuted]);

  // Fetch price — only changes song when mood flips (bullish ↔ bearish)
  const fetchPrice = useCallback(async (coinId, isCoinSwitch) => {
    try {
      const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
      const data = await fetchWithRetry(url);
      const coinData = data[coinId];
      if (!coinData) return;

      setPrice(coinData.usd);
      setChange(coinData.usd_24h_change);
      setLoading(false);
      setError(null);

      if (isCoinSwitch) {
        const newMood = coinData.usd_24h_change >= 0 ? 'happy' : 'sad';
        // Only change song if no song playing yet or mood flipped
        if (currentMoodRef.current !== newMood) {
          currentMoodRef.current = newMood;
          playSong(pickSong(coinData.usd_24h_change));
        }
      }
    } catch (err) {
      console.error('Error fetching price:', err);
      setLoading(false);
      setError('Could not load price. Retrying...');
    }
  }, [playSong]);

  // On coin change: debounce then fetch
  useEffect(() => {
    setPrice(null);
    setChange(null);
    setLoading(true);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchPrice(selectedCoin.id, true);
    }, 500);

    const interval = setInterval(() => fetchPrice(selectedCoin.id, false), 90000);
    return () => {
      clearTimeout(debounceRef.current);
      clearInterval(interval);
    };
  }, [selectedCoin, fetchPrice]);

  // Search CoinGecko for any coin
  const searchCoins = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;
      const data = await fetchWithRetry(url);
      const coins = (data.coins || []).slice(0, 15).map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        thumb: c.thumb,
      }));
      setSearchResults(coins);
      setShowDropdown(coins.length > 0);
    } catch (err) {
      console.error('Error searching coins:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchCoins(query), 400);
  };

  const selectCoin = (coin) => {
    setSelectedCoin(coin);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const playRandomSong = () => {
    if (change !== null) {
      playSong(pickSong(change));
    }
  };

  return (
    <div className="app-container">
      <div className="coin-selector" ref={dropdownRef}>
        <input
          type="text"
          className="coin-search"
          placeholder={`${selectedCoin.name} (${selectedCoin.symbol}) — Search any coin...`}
          value={searchQuery}
          onChange={handleSearchInput}
          onFocus={() => {
            if (searchResults.length > 0) setShowDropdown(true);
            else if (!searchQuery) {
              setSearchResults(POPULAR_COINS.map(c => ({ ...c, thumb: null })));
              setShowDropdown(true);
            }
          }}
        />
        {showDropdown && (
          <div className="coin-dropdown-list">
            {searching && <div className="coin-dropdown-item searching">Searching...</div>}
            {searchResults.map(coin => (
              <div
                key={coin.id}
                className={`coin-dropdown-item ${coin.id === selectedCoin.id ? 'active' : ''}`}
                onClick={() => selectCoin(coin)}
              >
                {coin.thumb && <img src={coin.thumb} alt="" className="coin-thumb" />}
                <span className="coin-name">{coin.name}</span>
                <span className="coin-symbol">{coin.symbol}</span>
              </div>
            ))}
          </div>
        )}
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
        {error && <div className="error-text">{error}</div>}
      </div>

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
