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