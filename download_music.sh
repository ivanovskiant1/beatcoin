#!/bin/bash

# Create music directory if it doesn't exist
mkdir -p public/music

# Download happy music (upbeat track)
curl -L "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" -o public/music/happy.mp3

# Download sad music (melancholic track)
curl -L "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" -o public/music/sad.mp3

echo "Music files downloaded successfully!"
