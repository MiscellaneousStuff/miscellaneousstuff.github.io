// main.js
import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/controls/OrbitControls.js';
import { WormRenderer } from './worm-renderer.js';
import { MuscleHeatmap } from './muscle-heatmap.js';
import { PositionChart } from './position-chart.js';
import { BinaryDataLoader } from './binary-loader.js';

class WormSimulationViewer {
    constructor() {
        this.data = null;
        this.currentFrame = 0;
        this.playing = false;
        this.lastFrameTime = 0;
        this.frameRate = 15; // Match simulation rate
        this.frameDuration = 1000 / this.frameRate;

        this.setupScene();
        this.setupUI();
        this.load();
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.FogExp2(0x1a1a1a, 0.05);

        // Camera
        const viewer = document.getElementById('viewer');
        this.camera = new THREE.PerspectiveCamera(
            45,
            viewer.clientWidth / viewer.clientHeight,
            0.01,
            100
        );
        this.camera.position.set(2, 1.5, 2);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(viewer.clientWidth, viewer.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        viewer.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0, 0);

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambient);

        const directional1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directional1.position.set(1, 1, 1);
        this.scene.add(directional1);

        const directional2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directional2.position.set(-1, 0.5, -1);
        this.scene.add(directional2);

        // Ground
        // const groundGeometry = new THREE.PlaneGeometry(10, 10);
        // const groundMaterial = new THREE.MeshStandardMaterial({
        //     color: 0x2a2a2a,
        //     roughness: 0.8,
        //     metalness: 0.2
        // });
        // const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        // ground.rotation.x = -Math.PI / 2;
        // ground.position.y = -0.1;
        // ground.receiveShadow = true;
        // this.scene.add(ground);

        // Grid
        // const grid = new THREE.GridHelper(10, 50, 0x444444, 0x222222);
        // grid.position.y = -0.09;
        // this.scene.add(grid);

        // // Axes helper (small, in corner)
        // const axes = new THREE.AxesHelper(0.5);
        // axes.position.set(-2, 0, -2);
        // this.scene.add(axes);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupUI() {
        // Playback controls
        document.getElementById('play').addEventListener('click', () => {
            this.playing = true;
        });

        document.getElementById('pause').addEventListener('click', () => {
            this.playing = false;
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.currentFrame = 0;
            this.playing = false;
            this.updateFrame();
        });

        // document.getElementById('speed').addEventListener('input', (e) => {
        //     this.frameRate = parseInt(e.target.value);
        //     this.frameDuration = 1000 / this.frameRate;
        //     document.getElementById('speed-label').textContent = this.frameRate + ' FPS';
        // });

        // Timeline scrubbing
        document.getElementById('timeline').addEventListener('input', (e) => {
            this.currentFrame = parseInt(e.target.value);
            this.updateFrame();
        });

        // Visualization toggles
        // document.getElementById('show-trajectory').addEventListener('change', (e) => {
        //     if (this.wormRenderer) {
        //         this.wormRenderer.setTrajectoryVisible(e.target.checked);
        //     }
        // });

        // document.getElementById('show-skeleton').addEventListener('change', (e) => {
        //     if (this.wormRenderer) {
        //         this.wormRenderer.setSkeletonVisible(e.target.checked);
        //     }
        // });

        // document.getElementById('show-tube').addEventListener('change', (e) => {
        //     if (this.wormRenderer) {
        //         this.wormRenderer.setTubeVisible(e.target.checked);
        //     }
        // });

        // document.getElementById('show-muscles').addEventListener('change', (e) => {
        //     if (this.wormRenderer) {
        //         this.wormRenderer.setMuscleColorsEnabled(e.target.checked);
        //     }
        // });
    }

    async load() {
        try {
            // CHANGE THIS SECTION
            document.getElementById('loading-text').textContent = 'Loading binary data...';

            const loader = new BinaryDataLoader();

            // Try .gz first, fall back to uncompressed
            let dataUrl = 'worm_data.bin.gz';
            let response = await fetch(dataUrl);

            if (!response.ok) {
                console.log('Compressed file not found, trying uncompressed...');
                dataUrl = 'worm_data.bin';
                response = await fetch(dataUrl);
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // If loading .gz, decompress first
            let buffer;
            if (dataUrl.endsWith('.gz')) {
                document.getElementById('loading-text').textContent = 'Decompressing data...';
                const compressedBuffer = await response.arrayBuffer();

                // Use browser's built-in decompression
                const decompressedStream = new Response(
                    new Blob([compressedBuffer])
                ).body.pipeThrough(new DecompressionStream('gzip'));

                buffer = await new Response(decompressedStream).arrayBuffer();
            } else {
                buffer = await response.arrayBuffer();
            }

            document.getElementById('loading-text').textContent = 'Parsing binary data...';

            // Parse binary data manually instead of using loader.load()
            const view = new DataView(buffer);
            let offset = 0;

            // Read header
            const numFrames = view.getInt32(offset, true); offset += 4;
            const numTrackingPoints = view.getInt32(offset, true); offset += 4;
            const numMuscles = view.getInt32(offset, true); offset += 4;

            console.log(`Binary header: ${numFrames} frames, ${numTrackingPoints} tracking points, ${numMuscles} muscles`);

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
                    view.getFloat32(offset, true),
                    view.getFloat32(offset + 4, true),
                    view.getFloat32(offset + 8, true)
                ];
                offset += 12;
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
                    document.getElementById('loading-text').textContent =
                        `Loading frame ${frame}/${numFrames}...`;
                }
            }

            this.data = {
                metadata: {
                    total_frames: numFrames,
                    num_tracking_points: numTrackingPoints,
                    num_muscles: numMuscles,
                    fps: 30,
                    duration_seconds: numFrames / 30
                },
                world_head_location: trajectory,
                behavior_value: [trackingX, trackingY, trackingZ],
                muscle_activation: muscles
            };

            console.log('✅ Binary data loaded successfully');
            console.log(`   Total frames: ${numFrames}`);
            console.log(`   Duration: ${this.data.metadata.duration_seconds.toFixed(1)}s`);
            // END CHANGES

            // Update UI
            const totalFrames = this.data.metadata.total_frames;
            document.getElementById('total-frames').textContent = totalFrames;
            document.getElementById('timeline').max = totalFrames - 1;

            // Create renderers
            document.getElementById('loading-text').textContent = 'Initializing renderers...';

            this.wormRenderer = new WormRenderer(this.scene);
            this.muscleHeatmap = new MuscleHeatmap('muscle-heatmap');
            this.positionChart = new PositionChart('position-chart');

            // Hide loading screen
            document.getElementById('loading').classList.add('hidden');

            // Start animation loop
            this.animate();

            console.log('✅ Initialization complete');

        } catch (error) {
            console.error('Failed to load data:', error);
            document.getElementById('loading-text').innerHTML =
                `<span style="color: #ff4444;">Error: ${error.message}</span><br><br>` +
                `Make sure worm_data.bin or worm_data.bin.gz exists<br>` +
                `Run: python convert_pkl_to_binary.py<br>` +
                `Then: python -m http.server 8000`;
        }
    }

    updateFrame() {
        if (!this.data || this.currentFrame >= this.data.metadata.total_frames) {
            this.playing = false;
            return;
        }

        const frame = this.currentFrame;

        // Extract per-frame data
        const trackingFrame = {
            x: this.data.behavior_value[0][frame],
            y: this.data.behavior_value[1][frame],
            z: this.data.behavior_value[2][frame]
        };

        const muscleFrame = this.data.muscle_activation[frame];

        // Update worm renderer
        this.wormRenderer.updateFrame({
            trajectory: this.data.world_head_location,
            tracking: trackingFrame,
            muscles: muscleFrame,
            frame: frame
        });

        // Update charts
        this.muscleHeatmap.updateFrame(this.data.muscle_activation, frame);
        this.positionChart.updateFrame(this.data.world_head_location, frame);

        // Update camera to follow - but smoothly
        const headPos = this.data.world_head_location[frame];

        // Smooth camera following (lerp towards target)
        const currentTarget = this.controls.target;
        currentTarget.x += (headPos[0] - currentTarget.x) * 0.1;
        currentTarget.y += (headPos[1] - currentTarget.y) * 0.1;
        currentTarget.z += (headPos[2] - currentTarget.z) * 0.1;

        // Update UI
        document.getElementById('current-frame').textContent = frame;
        document.getElementById('current-time').textContent =
            (frame / this.frameRate).toFixed(1) + 's';
        document.getElementById('timeline').value = frame;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;

        if (this.playing && deltaTime >= this.frameDuration) {
            // ADD THIS CHECK
            if (!this.data || this.currentFrame >= this.data.metadata.total_frames) {
                this.playing = false;
                this.currentFrame = 0;  // Reset to beginning
                return;
            }

            this.currentFrame++;
            if (this.currentFrame >= this.data.metadata.total_frames) {
                this.currentFrame = 0;
            }
            this.updateFrame();
            this.lastFrameTime = now;

            // Update FPS counter
            const fps = Math.round(1000 / deltaTime);
            document.getElementById('render-fps').textContent = fps;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const viewer = document.getElementById('viewer');
        this.camera.aspect = viewer.clientWidth / viewer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(viewer.clientWidth, viewer.clientHeight);
    }
}

// Start the application
new WormSimulationViewer();