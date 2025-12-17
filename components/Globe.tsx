'use client';

import { useRef, useState, useMemo, useEffect, memo } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { detectWebGL } from '@/lib/webgl-detector';
import { performanceMonitor } from '@/lib/performance-monitor';
import WebGLFallback from './WebGLFallback';
import LoadingSpinner from './LoadingSpinner';

export interface Spark {
  id: string;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  locationDisplay: string;
  createdAt: Date;
}

interface GlobeProps {
  sparks?: Spark[];
  onSparkClick?: (spark: Spark) => void;
  onGlobeClick?: (coordinates: { lat: number; lng: number }) => void;
}

/**
 * Converts latitude/longitude coordinates to 3D sphere position
 * @param lat Latitude in degrees (-90 to 90)
 * @param lng Longitude in degrees (-180 to 180)
 * @param radius Sphere radius
 * @returns THREE.Vector3 position on sphere surface
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  // Spherical to Cartesian coordinates
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Simulates rotation state update from touch drag
 * @param currentRotation Current rotation angles [x, y, z]
 * @param touchDelta Touch movement [deltaX, deltaY]
 * @param rotateSpeed Rotation speed multiplier
 * @returns New rotation angles
 */
export function updateRotationFromTouch(
  currentRotation: [number, number, number],
  touchDelta: [number, number],
  rotateSpeed: number
): [number, number, number] {
  const [rotX, rotY, rotZ] = currentRotation;
  const [deltaX, deltaY] = touchDelta;

  // Touch rotation uses the same logic as mouse drag
  // Rotation is proportional to touch delta and rotate speed
  const newRotY = rotY + deltaX * rotateSpeed * 0.01;
  const newRotX = rotX + deltaY * rotateSpeed * 0.01;

  return [newRotX, newRotY, rotZ];
}

/**
 * Simulates camera distance update from pinch gesture
 * @param currentDistance Current camera distance
 * @param pinchDelta Pinch amount (positive = pinch out/zoom in, negative = pinch in/zoom out)
 * @param zoomSpeed Zoom speed multiplier
 * @param minDistance Minimum allowed distance
 * @param maxDistance Maximum allowed distance
 * @returns New camera distance
 */
export function updateCameraDistanceFromPinch(
  currentDistance: number,
  pinchDelta: number,
  zoomSpeed: number,
  minDistance: number,
  maxDistance: number
): number {
  // Pinch delta: positive = pinch out (zoom in, decrease distance)
  // negative = pinch in (zoom out, increase distance)
  // This matches the intuitive pinch gesture behavior
  const newDistance = currentDistance - pinchDelta * zoomSpeed;

  // Clamp to min/max bounds
  return Math.max(minDistance, Math.min(maxDistance, newDistance));
}

interface SparksProps {
  sparks: Spark[];
  onSparkClick?: (spark: Spark) => void;
  globeRadius: number;
}

function Sparks({ sparks, onSparkClick, globeRadius }: SparksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { camera } = useThree();

  // Store spark data for click handling
  const sparkDataRef = useRef<Spark[]>(sparks);
  sparkDataRef.current = sparks;

  // Debug: Log spark count
  useEffect(() => {
    console.log(`Rendering ${sparks.length} sparks on globe`);
  }, [sparks.length]);

  // Calculate positions for all sparks
  const positions = useMemo(() => {
    return sparks.map(spark =>
      latLngToVector3(spark.latitude, spark.longitude, globeRadius)
    );
  }, [sparks, globeRadius]);

  // Set up instanced mesh matrices
  useMemo(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    positions.forEach((position, i) => {
      dummy.position.copy(position);
      dummy.lookAt(0, 0, 0); // Orient towards globe center
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  // Frustum for culling
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

  // Pulsing animation with frustum culling
  useFrame((state) => {
    if (!meshRef.current) return;

    // Update performance monitor
    performanceMonitor.update();

    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    // Update frustum for culling
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    positions.forEach((position, i) => {
      // Frustum culling - skip sparks not in view
      if (!frustum.containsPoint(position)) {
        return;
      }

      dummy.position.copy(position);
      dummy.lookAt(0, 0, 0);

      // Pulsing scale animation
      const pulseScale = 1 + Math.sin(time * 2 + i * 0.1) * 0.3;
      const baseScale = i === hoveredIndex ? 1.5 : 1.0;
      dummy.scale.setScalar(baseScale * pulseScale);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Handle pointer events for hover and click
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.instanceId !== undefined) {
      setHoveredIndex(event.instanceId);
    }
  };

  const handlePointerOut = () => {
    setHoveredIndex(null);
  };

  // Ref for tracking drag on sparks
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    isDraggingRef.current = false;
    startPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    // Calculate distance moved
    const dx = event.clientX - startPosRef.current.x;
    const dy = event.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 5 pixels, consider it a drag
    if (distance > 5) {
      isDraggingRef.current = true;
    } else {
      isDraggingRef.current = false;
    }

    if (!isDraggingRef.current && event.instanceId !== undefined && onSparkClick) {
      const spark = sparkDataRef.current[event.instanceId];
      if (spark) {
        onSparkClick(spark);
      }
    }
  };

  if (sparks.length === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, sparks.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    // onClick removed as it conflicts with drag detection
    >
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial
        color="#ffee66"
        toneMapped={false}
      />
    </instancedMesh>
  );
}

const GlobeSphere = memo(function GlobeSphere({ onClick }: { onClick?: (coordinates: { lat: number; lng: number }) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    isDragging.current = false;
    startPos.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    // Calculate distance moved
    const dx = event.clientX - startPos.current.x;
    const dy = event.clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 5 pixels, consider it a drag
    if (distance > 5) {
      isDragging.current = true;
    } else {
      isDragging.current = false;
    }

    // Only trigger click if not dragging
    if (!isDragging.current && onClick) {
      // Get the intersection point on the sphere
      const point = event.point;

      // Convert 3D point back to lat/lng
      const radius = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
      const lat = 90 - Math.acos(point.y / radius) * (180 / Math.PI);
      let lng = Math.atan2(point.z, -point.x) * (180 / Math.PI) - 180;

      // Normalize longitude to -180 to 180
      while (lng <= -180) lng += 360;
      while (lng > 180) lng -= 360;

      onClick({ lat, lng });
    }
  };

  return (
    <mesh
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    // Remove onClick to avoid conflict
    >
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#1a2332"
        roughness={0.7}
        metalness={0.3}
        emissive="#0a1520"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
});


function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    // Check window width directly to be reliable across devices
    const isMobile = window.innerWidth < 768; // Standard mobile breakpoint

    if (isMobile) {
      camera.position.z = 18; // Much further away -> Smaller globe appearance
    } else {
      camera.position.z = 8;
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return null;
}

export default function Globe({ sparks = [], onSparkClick, onGlobeClick }: GlobeProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  // Check WebGL support on mount
  useEffect(() => {
    const supported = detectWebGL();
    setWebGLSupported(supported);

    if (!supported) {
      console.warn('WebGL is not supported in this browser');
    }

    console.log('Globe component received sparks:', sparks.length);
  }, []);

  // Debug: Log when sparks change
  useEffect(() => {
    console.log('Sparks updated:', sparks.length);
  }, [sparks.length]);

  // Handle Canvas errors
  const handleCanvasError = (error: any) => {
    console.error('Canvas error:', error);
    setCanvasError('Failed to initialize 3D rendering');
  };

  // Show loading while checking WebGL support
  if (webGLSupported === null) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingSpinner message="Initializing globe..." />
      </div>
    );
  }

  // Show fallback if WebGL is not supported
  if (!webGLSupported) {
    return <WebGLFallback />;
  }

  // Show error if Canvas failed to initialize
  if (canvasError) {
    return (
      <div className="w-full h-screen flex items-center justify-center px-4 bg-background">
        <div className="bg-card border border-card-border rounded-xl p-6 max-w-md w-full shadow-card animate-fade-in">
          <h2 className="text-xl text-red-400/90 mb-4 font-light">Rendering Error</h2>
          <p className="text-muted-foreground mb-5 font-light">{canvasError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-foreground/90 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen" style={{ background: '#000000' }}>
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 40,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop if needed
        style={{ background: '#000000' }}
        onError={handleCanvasError}
      >
        <ResponsiveCamera />

        {/* Lighting for better visibility */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-5, -5, 5]}
          intensity={0.8}
          color="#8a9aaa"
        />
        <pointLight position={[0, 0, 5]} intensity={0.6} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />

        {/* Globe sphere */}
        <GlobeSphere onClick={onGlobeClick} />

        {/* Spark points - Slightly larger radius to prevent Z-fighting and ensuring occlusion doesn't block clicks */}
        <Sparks sparks={sparks} onSparkClick={onSparkClick} globeRadius={2.02} />

        {/* Orbit controls for rotation and zoom */}
        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={20}
          rotateSpeed={0.5}
          zoomSpeed={1.0}
          enableDamping={true}
          dampingFactor={0.05}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
