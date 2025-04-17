
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import VideoPlayer from './VideoPlayer'; // Import the component
import Trimmer from './Trimmer'; // Import Trimmer

// Define the loop limit
const MAX_LOOPS = 3;

function App() {
  // --- Define State ---
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState({ duration: 0, width: 0, height: 0 });
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [cropState, setCropState] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // --- Add state for trimmed playback ---
  const [isPlayingTrimmed, setIsPlayingTrimmed] = useState(false);

  // --- Add state for loop counting ---
  const [loopCount, setLoopCount] = useState(0);

  // Create the ref for the video element here
  const videoRef = useRef(null);
  // Ref to store the debounce timer ID
  const debounceTimeoutRef = useRef(null);


  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      // Reset metadata when new video is uploaded
      setVideoMetadata({ duration: 0, width: 0, height: 0 });
      // Reset trim times on new upload
      setStartTime(0);
      setEndTime(0);
      setIsPlayingTrimmed(false); // Ensure not playing on new upload
      setLoopCount(0); // Reset loop count on new upload
      // Clear any potential old object URLs to prevent memory leaks
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      console.log("Video selected:", file.name);
    }
  };

  const handleMetadataLoaded = useCallback((metadata) => { // Wrap in useCallback if needed
    console.log("Received metadata:", metadata);
    setVideoMetadata(metadata);
    setEndTime(metadata.duration);
    // setCropState({
    //x: 0,
    //y: 0,
    //width: metadata.width,
    //height: metadata.height,
    //});
  }, []); // Empty dependency array means this function identity is stable

  // --- State for Cropper (Initialize later) ---
  // [Add Cropper state here]

  // Debounced seek function
  const debouncedSeek = useCallback((time) => {
    if (videoRef.current) {
      // Clear any existing timer
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      // Set a new timer
      debounceTimeoutRef.current = setTimeout(() => {
        // Only seek if not currently playing the trimmed section
        // Or handle this differently if seeking during play is desired
        if (!isPlayingTrimmed) {
          videoRef.current.currentTime = time;
        }
      }, 200); // Wait 200ms after the user stops dragging
    }
  }, [isPlayingTrimmed]); // Add isPlayingTrimmed dependency

  // Handler for the Trimmer's onChange
  const handleTrimmerChange = useCallback((value, thumbIndex) => {
    const newStartTime = value[0];
    const newEndTime = value[1];

    // If user changes trim times while playing, pause playback
    if (isPlayingTrimmed) {
      if (videoRef.current) videoRef.current.pause();
      setIsPlayingTrimmed(false);
      setLoopCount(0); // Reset loop count when trim changes during play
    }

    // Update state immediately for responsive slider UI
    setStartTime(newStartTime);
    setEndTime(newEndTime);

    // Seek the video based on which thumb moved (debounced)
    if (thumbIndex === 0) {
      debouncedSeek(newStartTime);
    } else if (thumbIndex === 1) {
      debouncedSeek(newEndTime);
    }
  }, [debouncedSeek, isPlayingTrimmed]); // Add isPlayingTrimmed dependency

  // --- Handler for Play/Pause Trimmed Button ---
  const handlePlayPauseTrimmed = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlayingTrimmed) {
      // Pause action
      videoElement.pause();
      // setIsPlayingTrimmed(false);
    } else {
      // Play action
      setLoopCount(0); // Reset loops when starting play
      // Ensure video is ready and metadata loaded
      if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA or more
        videoElement.currentTime = startTime; // Start from the beginning of the trim
        videoElement.play().then(() => {
          setIsPlayingTrimmed(true);
        }).catch(error => {
          console.error("Error attempting to play:", error);
          setIsPlayingTrimmed(false); // Reset state if play fails
          setLoopCount(0);
        });
      } else {
        console.warn("Video not ready to play yet.");
      }
    }
  };

  // --- Effect to monitor playback time and stop at endTime ---
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      // Using a small buffer to prevent floating point issues
      if (videoElement.currentTime >= endTime - 0.1) {
        const nextLoopCount = loopCount + 1; // Calculate potential next loop

        if (nextLoopCount >= MAX_LOOPS) {
          videoElement.pause();
        } else {
          // Loop back to start time
          setLoopCount(nextLoopCount); // Increment loop count
          videoElement.currentTime = startTime; // Seek to start
          // Ensure it continues playing if seeking pauses it briefly (can happen)
          if (videoElement.paused) {
            videoElement.play().catch(e => console.error("Loop play error", e));
          }
        }
      }
    };

    const handlePause = () => {
      // If video pauses for any reason, reset the playing state and loop count
      setIsPlayingTrimmed(false);
      setLoopCount(0);
      console.log("Playback paused.");
    }

    // Only add listener if we are playing the trimmed section
    if (isPlayingTrimmed) {
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      // Add listener to catch pauses from other sources (e.g. end of video)
      videoElement.addEventListener('pause', handlePause);
      console.log("Added playback listeners. Current loop:", loopCount);
    }

    // Cleanup function
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('pause', handlePause);
      console.log("Removed playback listeners.");
    };
    // Dependencies for the effect
  }, [isPlayingTrimmed, startTime, endTime, loopCount, videoRef]); // Added loopCount

  // --- Cleanup Effect (debounce timer, object URL) ---
  useEffect(() => {
    // Cleanup for the debounce timer
    const debouncer = debounceTimeoutRef.current;
    // Cleanup for the object URL
    const urlToRevoke = videoUrl;

    return () => {
      if (debouncer) {
        clearTimeout(debouncer);
      }
      if (urlToRevoke) {
        console.log("Revoking Object URL:", urlToRevoke.substring(0, 50) + "...")
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [videoUrl]); // videoUrl dependency is correct here for URL cleanup

  // --- JSX Rendering ---
  return (
    <div className="app-container">
      <h1>Video Trimmer/Cropper UI</h1>

      <div className="upload-section">
        <label htmlFor="video-upload">Upload Video:</label>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
        />
      </div>

      {videoUrl && (
        <div className="editor-area">
          <h2>Video Preview & Controls</h2>
          <VideoPlayer
            videoUrl={videoUrl}
            onMetadataLoaded={handleMetadataLoaded}
            videoRef={videoRef}
          />
          <p>Duration: {videoMetadata.duration.toFixed(2)}s | Dimensions: {videoMetadata.width}x{videoMetadata.height}</p>

          {/* Play Button Container */}
          <div className="playback-controls">
            <button onClick={handlePlayPauseTrimmed} disabled={videoMetadata.duration <= 0}>
              {isPlayingTrimmed ? 'Pause' : 'Play Trimmed Section'}
            </button>
          </div>


          <div className="controls-container">
            {videoMetadata.duration > 0 && (
              <Trimmer
                duration={videoMetadata.duration}
                startTime={startTime}
                endTime={endTime}
                onTimesChange={handleTrimmerChange}
              />
            )}
          </div>
        </div>
      )}

      <div className="output-section">
        <h2>Captured Values</h2>
        {/* ... (display state values) ... */}
        <p>Video Duration: {videoMetadata.duration.toFixed(2)}s</p>
        <p>Start Time: {startTime.toFixed(2)}</p>
        <p>End Time: {endTime.toFixed(2)}</p>
        <p>Crop X: {cropState.x}</p>
        <p>Crop Y: {cropState.y}</p>
        <p>Crop Width: {cropState.width}</p>
        <p>Crop Height: {cropState.height}</p>
        <p>Is Playing Trimmed: {isPlayingTrimmed ? 'Yes' : 'No'}</p> {/* Display playback state */}
      </div>
    </div>
  );
}

export default App;