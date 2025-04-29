
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import VideoPlayer from './VideoPlayer'; // Import the component
import Trimmer from './Trimmer'; // Import Trimmer
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'; // Import React Crop

// Define the loop limit
const MAX_LOOPS = 3;

// Helper function to create a centered square crop on load
function centerAspectCrop(mediaWidth, mediaHeight, aspect = 1) { // Default aspect 1:1
  return centerCrop(
    makeAspectCrop(
      {
        // Start with a decent size, e.g., 50% of the smaller dimension
        unit: '%', // Use percentage initially is easier for centering
        width: 50,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function App() {
  // --- Define State ---
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState({ duration: 0, width: 0, height: 0 });
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  // --- State for Visual Cropper ---
  // crop state needs unit, x, y, width, height (aspect is a prop)
  const [crop, setCrop] = useState(); // Initialize crop state - will be set on load
  const [completedCrop, setCompletedCrop] = useState(null); // Stores the final pixel crop info


  // --- Add state for trimmed playback ---
  const [isPlayingTrimmed, setIsPlayingTrimmed] = useState(false);

  // --- Add state for loop counting ---
  const [loopCount, setLoopCount] = useState(0);

  // Create the ref for the video element here
  const videoRef = useRef(null);
  // Ref to store the debounce timer ID
  const debounceTimeoutRef = useRef(null);

  const handleCropOnChange = (pixelCrop, percentCrop) => {
    // Log raw data for debugging (optional now)
    // console.log("Raw percentCrop from onChange:", JSON.stringify(percentCrop));
    // console.log("Raw pixelCrop from onChange:", JSON.stringify(pixelCrop));

    // VALIDATE before setting state: Check for positive width and height
    if (percentCrop && percentCrop.width > 0 && percentCrop.height > 0) {
      // If dimensions are valid, update the state
      setCrop(percentCrop);
    } else {
      // If dimensions are invalid (e.g., height is 0), log a warning
      // and *do not* update the state. This prevents the jump.
      console.warn("Received invalid crop state with zero height/width from onChange, preventing update:", percentCrop);
    }
  };


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
      setCrop(undefined); // Reset crop state on new upload
      setCompletedCrop(null);
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
    console.log("HANDLE METADATA LOADED - Start"); // Did it start?
    const { width, height } = metadata;
    console.log("HANDLE METADATA LOADED - Received WxH:", width, height, "Duration:", metadata.duration); // What data did we get?

    setVideoMetadata(metadata);
    //setEndTime(metadata.duration);

    // Check and set endTime state
    if (metadata.duration && metadata.duration > 0) {
      console.log("HANDLE METADATA LOADED - Calling setEndTime with:", metadata.duration);
      setEndTime(metadata.duration);
      console.log("HANDLE METADATA LOADED - Called setEndTime");
    } else {
      console.error("HANDLE METADATA LOADED - Invalid duration received:", metadata.duration);
      setEndTime(0); // Reset endTime if duration is bad
    }

    const videoElement = videoRef.current;
    // Log readyState *before* trying any interaction
    if (videoElement) {
      console.log("State on metadata loaded:", videoElement.readyState);
      console.log("HANDLE METADATA LOADED - State on load:", videoElement.readyState);

      // Maybe set initial time here only if ready enough?
      // if (videoRef.current.readyState >= 1) { videoRef.current.currentTime = 0; }

      // Ensure we're at the start
      videoElement.currentTime = 0;

      if (width && height && width > 0 && height > 0) {
        console.log(`Calculating crop for natural dims: <span class="math-inline">\{width\}x</span>{height}`); // Keep logs
        const initialCropPercent = centerAspectCrop(width, height, 1);
        console.log("Calculated initial PERCENT crop:", JSON.stringify(initialCropPercent)); // Keep logs

        if (initialCropPercent && typeof initialCropPercent.width === 'number' /*...validation...*/) {
          setCrop(initialCropPercent); // **** UNCOMMENT THIS ****

          const initialCompletedCropPx = { /* ... calculate pixel version ... */ };
          setCompletedCrop(initialCompletedCropPx); // **** UNCOMMENT THIS ****
          console.log("Successfully set initial crop state."); // Keep logs
        } else {
          console.error("Initial percentage crop calculation FAILED...");
        }
      } else {
        console.error("Invalid width/height in metadata:", metadata);
      }

      // --- Play/Pause Hack to force first frame render on iOS ---
      console.log("HANDLE METADATA LOADED - Attempting play/pause hack...");

      // Temporarily ensure it's muted for this hack to bypass interaction errors
      const originalMutedState = videoElement.muted;
      videoElement.muted = true;

      // Try to play
      const playPromise = videoElement.play();

      if (playPromise !== undefined) {
        playPromise.then(() => { /* ... pause, restore muted ... */ })
          .catch(err => { /* ... restore muted ... */ });
      } else { videoElement.muted = originalMutedState; }
      // ----------------------
    } else {
      console.error("HANDLE METADATA LOADED - Video ref not available!");
    }
    console.log("HANDLE METADATA LOADED - End"); // Did it finish?


    // Reset crop states initially
    //setCrop(undefined);
    //setCompletedCrop(null);

    // Calculate initial centered crop in PIXELS if dimensions are valid
    /* if (width && height) {
      // 1. Get the centered crop dimensions in percentages first (using the helper)
      const initialCropPercent = centerAspectCrop(width, height, 1); // aspect = 1 for square
      const calculatedWidth = Math.round(width * (initialCropPercent.width / 100));

      // 2. Convert the percentage values to pixels for our state object
      const initialCropPx = {
        unit: 'px',
        x: Math.round(width * (initialCropPercent.x / 100)),
        y: Math.round(height * (initialCropPercent.y / 100)),
        width: calculatedWidth,
        height: calculatedWidth
      };

      // Basic check to prevent width/height being 0 or negative if calculations go wrong
      if (initialCropPx.width < 1 || initialCropPx.height < 1) {
        console.warn("Initial crop dimensions are too small or invalid. Using default minimum.");
        // Fallback to a small default square, e.g., 50x50 centered
        const minSize = Math.min(50, width, height); // Ensure minSize isn't larger than video
        initialCropPx.width = minSize;
        initialCropPx.height = minSize; // Keep it square
        initialCropPx.x = Math.max(0, Math.round((width - minSize) / 2));
        initialCropPx.y = Math.max(0, Math.round((height - minSize) / 2));
      }

      console.log("Setting initial pixel crop:", initialCropPx);
      setCrop(initialCropPx); // Initialize the controlled crop state with PIXELS
      setCrop(initialCropPx); // Initialize the controlled crop state
      setCompletedCrop(initialCropPx); // Also set the initial completed crop state
    } */
  }, [videoRef]); // Empty dependency array means this function identity is stable

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

  // Add this effect to watch endTime changes
  useEffect(() => {
    console.log(`EFFECT: endTime state updated to: ${endTime}`);
  }, [endTime]);

  //console.log('Rendering App - Current crop state:', JSON.stringify(crop));

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

          {/* --- Visual Cropper Integration --- */}
          {/* We need to wrap the VideoPlayer or its contents */}
          {/* The element being cropped should ideally be directly inside ReactCrop */}
          {/* Let's try rendering VideoPlayer and then ReactCrop over it */}
          {/* Note: This layering might need CSS adjustments (positioning) */}

          <div className="video-crop-container">
            {/* Render VideoPlayer */}
            {/* <VideoPlayer
              videoUrl={videoUrl}
              onMetadataLoaded={handleMetadataLoaded}
              videoRef={videoRef}
            /> */}

            {/* --- Render video tag directly --- */}
            <video
              ref={videoRef} // Assign the ref directly
              src={videoUrl} // Assign the src directly
              className="video-element-for-crop" // Keep existing class for styling
              playsInline // Keep playsInline for iOS
              preload="auto" // Keep preload="auto"
              controls={false} // Keep controls off for now
              // Add the metadata listener directly here
              onLoadedMetadata={(event) => {
                // Call the existing handler, passing the metadata object
                handleMetadataLoaded({
                  duration: event.target.duration,
                  width: event.target.videoWidth,
                  height: event.target.videoHeight,
                });
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              Your browser does not support the video tag.
            </video>

            {/* Render ReactCrop only when crop state is initialized */}
            {!!crop && videoMetadata.width > 0 && (
              <ReactCrop
                crop={crop}
                onChange={handleCropOnChange}
                onComplete={(pixelCrop, percentCrop) => setCompletedCrop(pixelCrop)}
                aspect={1} // Square aspect ratio
                minWidth={30} // Example min size
                minHeight={30}
              >

              </ReactCrop>
            )}
          </div>

          {/* -- End Visual Cropper -- */}

          <p>Duration: {videoMetadata.duration.toFixed(2)}s | Dimensions: {videoMetadata.width}x{videoMetadata.height}</p>

          {/* Play Button Container */}
          <div className="playback-controls">
            {videoMetadata.duration > 0 && endTime > 0 && (
              <button onClick={handlePlayPauseTrimmed}>
                {isPlayingTrimmed ? `Pause (Loop <span class="math-inline">\{loopCount \+ 1\}/</span>{MAX_LOOPS})` : 'Play Trimmed Section (3 Loops)'}
              </button>
            )}
          </div>


          <div className="controls-container">
            {videoMetadata.duration > 0 && endTime > 0 ? ( // Check endTime > 0
              <Trimmer
                duration={videoMetadata.duration}
                startTime={startTime}
                endTime={endTime}
                onTimesChange={handleTrimmerChange}
              />
            ) : (
              // Optional: Show a loading indicator while waiting for endTime
              videoUrl && <p>Loading trimmer controls...</p>
            )}
          </div>

        </div>
      )
      }

      <div className="output-section">
        <h2>Captured Values</h2>
        {/* ... (display state values) ... */}
        <p>Video Duration: {videoMetadata.duration.toFixed(2)}s</p>
        <p>Start Time: {startTime.toFixed(2)}</p>
        <p>End Time: {endTime.toFixed(2)}</p>
        {/* Display completedCrop pixel values */}
        {completedCrop && (
          <>
            <p>Crop X (px): {Math.round(completedCrop.x)}</p>
            <p>Crop Y (px): {Math.round(completedCrop.y)}</p>
            <p>Crop Width (px): {Math.round(completedCrop.width)}</p>
            <p>Crop Height (px): {Math.round(completedCrop.height)}</p>
            <p>(Unit: {completedCrop.unit}, Aspect: {completedCrop.aspect?.toFixed(2) ?? 'N/A'})</p>
          </>
        )}
        <p>Is Playing Trimmed: {isPlayingTrimmed ? 'Yes' : 'No'}</p>
        <p>Current Loop Count: {loopCount}</p>
      </div>
    </div >
  );
}

export default App;