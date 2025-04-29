// src/VideoPlayer.jsx
import React, { useEffect } from 'react'; // Removed useRef from here

// Props:
// - videoUrl: The object URL of the video to display
// - onMetadataLoaded: Function called when video metadata is loaded
// - videoRef: The ref object passed down from the parent (App)
function VideoPlayer({ videoUrl, onMetadataLoaded, videoRef }) { // Added videoRef prop

    // Effect to handle loading metadata (uses the passed-in ref)
    useEffect(() => {
        const videoElement = videoRef.current; // Use the passed-in ref
        if (!videoElement) return;
        console.log('VideoPlayer effect running, adding listeners for', videoUrl);

        // videoElement.load(); // Explicitly tell the element to load the source

        const handleLoadedMetadata = () => {
            console.log("Metadata loaded inside VideoPlayer!");
            if (onMetadataLoaded) {
                onMetadataLoaded({
                    duration: videoElement.duration,
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                });
            }
        };

        // Clean up previous listener before adding
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);


        return () => {
            console.log('VideoPlayer effect cleanup, removing listeners for', videoUrl);
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
        // Depend on videoRef.current directly if possible, or just videoUrl/callback
    }, [videoUrl, onMetadataLoaded, videoRef]);

    // --- RETURN ONLY THE VIDEO TAG ---
    return (
        <video
            ref={videoRef}
            src={videoUrl}
            controls={false}
            // muted // Keep off for now
            playsInline
            className="video-element-for-crop" // Add class for styling
            preload="auto" // Hint to browser to load metadata quickly
            // Prevent context menu on long press if it interferes with drag
            onContextMenu={(e) => e.preventDefault()}
        >
            Your browser does not support the video tag.
        </video>
    );
    // --- NO WRAPPER DIV AROUND VIDEO ---
}

export default VideoPlayer;