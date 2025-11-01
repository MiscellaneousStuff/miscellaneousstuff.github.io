// worm-renderer.js
import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';

class HeadingDebugger {
    constructor(scene) {
        this.scene = scene;
        this.arrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            0.2,  // length
            0xff00ff  // magenta color
        );
        this.scene.add(this.arrow);
    }

    update(position, direction) {
        this.arrow.position.set(position[0], position[1], position[2]);
        this.arrow.setDirection(direction);
    }

    setVisible(visible) {
        this.arrow.visible = visible;
    }
}

export class WormRenderer {
    constructor(scene) {
        this.scene = scene;

        // Components
        this.trajectory = new TrajectoryRenderer(scene);
        this.skeleton = new SkeletonRenderer(scene);
        this.tube = new TubeRenderer(scene);
        this.debugHeading = new HeadingDebugger(scene);  // ADD THIS

        this.muscleColorsEnabled = true;
    }

    // worm-renderer.js - updateFrame method

    updateFrame(data) {
        const { trajectory, tracking, muscles, frame } = data;

        if (!trajectory || !tracking || !muscles) {
            console.warn('Missing data in updateFrame');
            return;
        }

        if (frame >= trajectory.length) {
            console.warn(`Frame ${frame} out of bounds (max: ${trajectory.length})`);
            return;
        }

        const headPos = trajectory[frame];

        this.trajectory.update(trajectory, frame);

        // Just 90° rotation + translation, NO heading rotation
        const positions = {
            x: tracking.z.map(val => val + headPos[0]),
            y: tracking.y.map(val => val + headPos[1]),
            z: tracking.x.map(val => -val + headPos[2])
        };

        const muscleArray = Array.isArray(muscles) ? muscles : Object.values(muscles);

        this.skeleton.update(positions, muscleArray, this.muscleColorsEnabled);
        this.tube.update(positions, muscleArray, this.muscleColorsEnabled);
    }

    setTrajectoryVisible(visible) {
        this.trajectory.setVisible(visible);
    }

    setSkeletonVisible(visible) {
        this.skeleton.setVisible(visible);
    }

    setTubeVisible(visible) {
        this.tube.setVisible(visible);
    }

    setMuscleColorsEnabled(enabled) {
        this.muscleColorsEnabled = enabled;
    }
}

// 3. Replace TrajectoryRenderer completely with this better version:

class TrajectoryRenderer {
    constructor(scene) {
        this.scene = scene;
        this.maxPoints = 3000;
        this.tubeMesh = null;

        this.material = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            emissiveIntensity: 0.3,
            transparent: false
        });
    }

    update(trajectoryData, currentFrame) {
        // Remove old tube
        if (this.tubeMesh) {
            this.scene.remove(this.tubeMesh);
            this.tubeMesh.geometry.dispose();
        }

        // Build points
        const points = [];
        for (let i = 0; i <= currentFrame; i++) {
            const pos = trajectoryData[i];
            if (pos && pos.length === 3) {
                points.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
            }
        }

        if (points.length < 2) return;  // Need at least 2 points for a line

        // Create curve
        const curve = new THREE.CatmullRomCurve3(points);

        // Create tube geometry (this is visible at all zoom levels)
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            points.length * 2,  // segments
            0.01,               // radius (adjust this to make thicker/thinner)
            8,                  // radial segments
            false               // not closed
        );

        this.tubeMesh = new THREE.Mesh(tubeGeometry, this.material);
        this.scene.add(this.tubeMesh);
    }

    setVisible(visible) {
        if (this.tubeMesh) {
            this.tubeMesh.visible = visible;
        }
    }
}

class SkeletonRenderer {
    constructor(scene) {
        this.scene = scene;
        this.spheres = [];
        this.connections = [];

        // Create 17 spheres for tracking points
        for (let i = 0; i < 17; i++) {
            // Taper radius from head to tail
            const radius = 0.018 * (1 - i / 20);

            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0x88cc88,
                emissive: 0x224422,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.9
            });

            const sphere = new THREE.Mesh(geometry, material);
            sphere.castShadow = true;
            this.spheres.push(sphere);
            this.scene.add(sphere);
        }

        // Create connecting lines
        for (let i = 0; i < 16; i++) {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({
                color: 0x88cc88,
                linewidth: 2,
                transparent: true,
                opacity: 0.6
            });
            const line = new THREE.Line(geometry, material);
            this.connections.push(line);
            this.scene.add(line);
        }
    }

    update(positions, muscleData, showMuscleColors) {
        const { x, y, z } = positions;

        // ADD THIS CHECK
        if (!x || !y || !z || x.length !== 17) {
            console.error('Invalid positions data:', positions);
            return;
        }

        // Update sphere positions
        for (let i = 0; i < 17; i++) {
            this.spheres[i].position.set(x[i], y[i], z[i]);

            if (showMuscleColors) {
                // Map 96 muscles to 17 segments
                const muscleStart = Math.floor(i * 96 / 17);
                const muscleEnd = Math.floor((i + 1) * 96 / 17);
                let avgActivation = 0;

                for (let m = muscleStart; m < muscleEnd; m++) {
                    avgActivation += muscleData[m];
                }
                avgActivation /= (muscleEnd - muscleStart);

                // Color: blue (rest) -> yellow -> red (active)
                const hue = (1 - avgActivation) * 0.6; // 0.6 = blue, 0 = red
                this.spheres[i].material.color.setHSL(hue, 0.8, 0.5);
                this.spheres[i].material.emissive.setHSL(hue, 0.8, 0.3);

                // Scale with activation
                const scale = 1.0 + avgActivation * 0.4;
                this.spheres[i].scale.set(scale, scale, scale);
            } else {
                this.spheres[i].material.color.setHex(0x88cc88);
                this.spheres[i].material.emissive.setHex(0x224422);
                this.spheres[i].scale.set(1, 1, 1);
            }
        }

        // Update connecting lines
        for (let i = 0; i < 16; i++) {
            const positions = new Float32Array([
                x[i], y[i], z[i],
                x[i + 1], y[i + 1], z[i + 1]
            ]);
            this.connections[i].geometry.setAttribute('position',
                new THREE.BufferAttribute(positions, 3));
        }
    }

    setVisible(visible) {
        this.spheres.forEach(s => s.visible = visible);
        this.connections.forEach(c => c.visible = visible);
    }
}

class TubeRenderer {
    constructor(scene) {
        this.scene = scene;
        this.tubeMesh = null;

        // Create initial material
        this.material = new THREE.MeshPhongMaterial({
            color: 0xccaa88,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            shininess: 30
        });

        // Vertex colors for muscle visualization
        this.vertexColorMaterial = new THREE.MeshPhongMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            shininess: 30
        });
    }

    update(positions, muscleData, showMuscleColors) {
        const { x, y, z } = positions;

        // Remove old mesh
        if (this.tubeMesh) {
            this.scene.remove(this.tubeMesh);
            if (this.tubeMesh.geometry) {
                this.tubeMesh.geometry.dispose();
            }
        }

        // Create curve from points
        const points = [];
        for (let i = 0; i < 17; i++) {
            points.push(new THREE.Vector3(x[i], y[i], z[i]));
        }

        const curve = new THREE.CatmullRomCurve3(points);

        // Create tube geometry with varying radius
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            64,  // tubular segments
            0.025, // radius
            12,  // radial segments
            false // not closed
        );

        // Apply muscle colors if enabled
        if (showMuscleColors) {
            this.applyMuscleColors(tubeGeometry, muscleData);
            this.tubeMesh = new THREE.Mesh(tubeGeometry, this.vertexColorMaterial);
        } else {
            this.tubeMesh = new THREE.Mesh(tubeGeometry, this.material);
        }

        this.tubeMesh.castShadow = true;
        this.tubeMesh.receiveShadow = true;
        this.scene.add(this.tubeMesh);
    }

    applyMuscleColors(geometry, muscleData) {
        const positions = geometry.attributes.position;
        const colors = new Float32Array(positions.count * 3);

        const color = new THREE.Color();

        // Color vertices based on their position along the tube
        for (let i = 0; i < positions.count; i++) {
            // Determine which segment this vertex belongs to (0-16)
            const segmentRatio = (i / positions.count) * 17;
            const segment = Math.floor(segmentRatio);
            const clampedSegment = Math.min(segment, 16);

            // Get muscle activation for this segment
            const muscleStart = Math.floor(clampedSegment * 96 / 17);
            const muscleEnd = Math.floor((clampedSegment + 1) * 96 / 17);
            let avgActivation = 0;

            for (let m = muscleStart; m < muscleEnd; m++) {
                avgActivation += muscleData[m];
            }
            avgActivation /= (muscleEnd - muscleStart);

            // Set color based on activation
            const hue = (1 - avgActivation) * 0.6; // Blue to red
            color.setHSL(hue, 0.8, 0.5);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    setVisible(visible) {
        if (this.tubeMesh) {
            this.tubeMesh.visible = visible;
        }
    }
}