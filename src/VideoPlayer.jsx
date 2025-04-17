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

        videoElement.load(); // Explicitly tell the element to load the source

        const handleLoadedMetadata = () => {
            console.log("Metadata loaded!");
            if (onMetadataLoaded) {
                onMetadataLoaded({
                    duration: videoElement.duration,
                    width: videoElement.videoWidth,
                    height: videoElement.videoHeight,
                });
            }
        };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        // Reset currentTime if URL changes - helps if loading same file again
        videoElement.currentTime = 0;


        return () => {
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
        // Depend on videoRef.current directly if possible, or just videoUrl/callback
    }, [videoUrl, onMetadataLoaded, videoRef]);

    return (
        <div className="video-player-container">
            {/* Assign the passed-in ref to the video element */}
            <video ref={videoRef} src={videoUrl} controls={false} /*muted*/ playsInline>
                Your browser does not support the video tag.
            </video>
        </div>
    );
}

export default VideoPlayer;