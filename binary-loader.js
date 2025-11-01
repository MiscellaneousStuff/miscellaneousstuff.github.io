// binary-loader.js

export class BinaryDataLoader {
    constructor() {
        this.data = null;
        this.metadata = null;
    }
    
    async load(url) {
        console.log('Loading binary data from:', url);
        
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const view = new DataView(buffer);
        
        let offset = 0;
        
        // Read header
        const numFrames = view.getInt32(offset, true); offset += 4;
        const numTrackingPoints = view.getInt32(offset, true); offset += 4;
        const numMuscles = view.getInt32(offset, true); offset += 4;
        
        console.log(`Binary header: ${numFrames} frames, ${numTrackingPoints} tracking points, ${numMuscles} muscles`);
        
        this.metadata = {
            total_frames: numFrames,
            num_tracking_points: numTrackingPoints,
            num_muscles: numMuscles,
            fps: 30,
            duration_seconds: numFrames / 30
        };
        
        // Prepare data structures
        const trajectory = [];
        const trackingX = [];
        const trackingY = [];
        const trackingZ = [];
        const muscles = [];
        
        // Read frame data
        for (let frame = 0; frame < numFrames; frame++) {
            // Head position (3 floats)
            const headPos = [
                view.getFloat32(offset, true), offset += 4,
                view.getFloat32(offset, true), offset += 4,
                view.getFloat32(offset, true), offset += 4
            ];
            trajectory.push(headPos);
            
            // Tracking points - X coordinates (17 floats)
            const xCoords = [];
            for (let i = 0; i < numTrackingPoints; i++) {
                xCoords.push(view.getFloat32(offset, true));
                offset += 4;
            }
            trackingX.push(xCoords);
            
            // Tracking points - Y coordinates (17 floats)
            const yCoords = [];
            for (let i = 0; i < numTrackingPoints; i++) {
                yCoords.push(view.getFloat32(offset, true));
                offset += 4;
            }
            trackingY.push(yCoords);
            
            // Tracking points - Z coordinates (17 floats)
            const zCoords = [];
            for (let i = 0; i < numTrackingPoints; i++) {
                zCoords.push(view.getFloat32(offset, true));
                offset += 4;
            }
            trackingZ.push(zCoords);
            
            // Muscle activations (96 floats)
            const muscleFrame = [];
            for (let i = 0; i < numMuscles; i++) {
                muscleFrame.push(view.getFloat32(offset, true));
                offset += 4;
            }
            muscles.push(muscleFrame);
            
            if (frame % 100 === 0) {
                console.log(`Loaded frame ${frame}/${numFrames}`);
            }
        }
        
        this.data = {
            metadata: this.metadata,
            world_head_location: trajectory,
            behavior_value: [trackingX, trackingY, trackingZ],
            muscle_activation: muscles
        };
        
        console.log('✅ Binary data loaded successfully');
        console.log(`   Total frames: ${numFrames}`);
        console.log(`   Duration: ${this.metadata.duration_seconds.toFixed(1)}s`);
        console.log(`   Bytes read: ${offset} / ${buffer.byteLength}`);
        
        return this.data;
    }
}