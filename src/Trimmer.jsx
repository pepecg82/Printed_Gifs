// src/Trimmer.jsx
import React from 'react';
import ReactSlider from 'react-slider'; // Import the slider component
import './Trimmer.css';

// Props:
// - duration: Total duration of the video
// - startTime: Current start time value from parent state
// - endTime: Current end time value from parent state
// - onTimesChange: NEW - Callback receives ([newStart, newEnd], thumbIndex)
const Trimmer = React.memo(({ duration, startTime, endTime, onTimesChange }) => {


    console.log(`Trimmer rendering with props: duration=${duration}, startTime=${startTime}, endTime=${endTime}`);

    // This function handles changes from the ReactSlider
    // 'value' will be an array like [newStartTime, newEndTime]
    const handleSliderChange = (value, thumbIndex) => {
        if (onTimesChange) {
            onTimesChange(value, thumbIndex); // Pass both value array and index
        }
    };

    // Ensure duration is valid before rendering slider
    if (duration <= 0 || isNaN(duration)) {
        return <div>Loading duration...</div>;
    }

    // Ensure values are within bounds, needed especially during initial load
    const validatedStartTime = Math.max(0, Math.min(startTime, duration));
    const validatedEndTime = Math.max(validatedStartTime, Math.min(endTime, duration));


    return (
        <div className="trimmer-container">
            <h3>Trimmer Controls</h3>
            <div className="slider-wrapper">
                {/* Display current times */}
                <div className="time-display">
                    <span>Start: {validatedStartTime.toFixed(2)}s</span>
                    <span>End: {validatedEndTime.toFixed(2)}s</span>
                </div>

                <ReactSlider
                    // ... (other props: className, thumbClassName, trackClassName, min, max, step etc.)
                    className="horizontal-slider" // Class for overall slider container
                    thumbClassName="slider-thumb" // Class for the draggable handles
                    trackClassName="slider-track" // Class for the track segments
                    min={0}                         // Minimum value (start of video)
                    max={duration}                  // Maximum value (end of video)
                    value={[validatedStartTime, validatedEndTime]} // Current start and end times as an array
                    onChange={handleSliderChange}   // Function to call when slider values change
                    ariaLabel={['Start Time Thumb', 'End Time Thumb']} // Accessibility labels
                    renderThumb={({ key, ...restProps }, state) => ( // Destructure key and the rest
                        <div
                            key={key} // Pass the key directly
                            {...restProps} // Spread the *rest* of the props
                        >
                            {state.valueNow.toFixed(1)} {/* Display time on thumb */}
                        </div>
                    )}
                    renderTrack={({ key, ...restProps }, state) => ( // Destructure key and the rest
                        <div
                            key={key} // Pass the key directly
                            {...restProps} // Spread the *rest* of the props
                            style={{
                                ...restProps.style, // Use restProps.style here now
                                backgroundColor: state.index === 1 ? '#82E0AA' : '#ddd', // Green for selected range, grey otherwise
                                height: '6px',
                                borderRadius: '3px',
                                top: '7px' // Adjust vertical position if needed
                            }}
                        />
                    )}
                    pearling                        // Thumbs can push each other
                    minDistance={0.1}               // Minimum distance between thumbs (e.g., 0.1 seconds)
                    step={0.01}                     // Granularity of the slider
                    withTracks                      // Important for styling the track between thumbs
                />

                {/* Display selected duration */}
                <div className="duration-display">
                    Selected Duration: {(validatedEndTime - validatedStartTime).toFixed(2)}s
                </div>
            </div>
        </div>
    );
});

export default Trimmer;