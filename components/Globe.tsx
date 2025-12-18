'use client';

import { useRef, useState, useMemo, useEffect, memo } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
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
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
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

  const sparkDataRef = useRef<Spark[]>(sparks);
  sparkDataRef.current = sparks;

  // Debug: Log spark count
  useEffect(() => {
    console.log(`Rendering ${sparks.length} sparks on globe`);
  }, [sparks.length]);

  const positions = useMemo(() => {
    return sparks.map(spark =>
      latLngToVector3(spark.latitude, spark.longitude, globeRadius)
    );
  }, [sparks, globeRadius]);

  useMemo(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();
    positions.forEach((position, i) => {
      dummy.position.copy(position);
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    performanceMonitor.update();

    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    positions.forEach((position, i) => {
      if (!frustum.containsPoint(position)) {
        return;
      }

      dummy.position.copy(position);
      dummy.lookAt(0, 0, 0);

      const pulseScale = 1 + Math.sin(time * 2 + i * 0.1) * 0.3;
      const baseScale = i === hoveredIndex ? 1.5 : 1.0;
      dummy.scale.setScalar(baseScale * pulseScale);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.instanceId !== undefined) {
      setHoveredIndex(event.instanceId);
    }
  };

  const handlePointerOut = () => {
    setHoveredIndex(null);
  };

  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    isDraggingRef.current = false;
    startPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    const dx = event.clientX - startPosRef.current.x;
    const dy = event.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

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
    const dx = event.clientX - startPos.current.x;
    const dy = event.clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      isDragging.current = true;
    } else {
      isDragging.current = false;
    }

    if (!isDragging.current && onClick) {
      const point = event.point;

      const radius = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
      const lat = 90 - Math.acos(point.y / radius) * (180 / Math.PI);
      let lng = Math.atan2(point.z, -point.x) * (180 / Math.PI) - 180;

      while (lng <= -180) lng += 360;
      while (lng > 180) lng -= 360;

      onClick({ lat, lng });
    }
  };

  return (
    <group>
      {/* Main Globe Sphere */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#1e3a8a" // Brighter deep blue (blue-900)
          roughness={0.7}
          metalness={0.1}
          emissive="#1e40af" // Glowing blue-800
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
});


function ResponsiveCamera() {
  const { camera, size } = useThree();
  const isMobileRef = useRef<boolean | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    if (isMobileRef.current !== isMobile) {
      if (isMobile) {
        camera.position.z = 18;
      } else {
        camera.position.z = 8;
      }
      camera.updateProjectionMatrix();
      isMobileRef.current = isMobile;
    }
  }, [size.width, camera]);

  return null;
}

export default function Globe({ sparks = [], onSparkClick, onGlobeClick }: GlobeProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  useEffect(() => {
    const supported = detectWebGL();
    setWebGLSupported(supported);

    if (!supported) {
      console.warn('WebGL is not supported in this browser');
    }
  }, []);

  const handleCanvasError = (error: any) => {
    console.error('Canvas error:', error);
    setCanvasError('Failed to initialize 3D rendering');
  };

  if (webGLSupported === null) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingSpinner message="Initializing globe..." />
      </div>
    );
  }

  if (!webGLSupported) {
    return <WebGLFallback />;
  }

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
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        style={{ background: '#000000' }}
        onError={handleCanvasError}
      >
        <ResponsiveCamera />

        {/* Starry Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

        {/* Lighting for better visibility - Adjusted for cinematic look */}
        <ambientLight intensity={0.5} color="#abcdef" />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-5, -5, 5]}
          intensity={0.5}
          color="#4338ca" // Purple/Blue rim light
        />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />

        {/* Globe sphere */}
        <GlobeSphere onClick={onGlobeClick} />

        {/* Spark points */}
        <Sparks sparks={sparks} onSparkClick={onSparkClick} globeRadius={2.02} />

        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={20}
          rotateSpeed={0.5}
          zoomSpeed={1.0}
          enableDamping={true}
          dampingFactor={0.05}
          autoRotate={true}
          autoRotateSpeed={0.3}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </Canvas>
    </div>
  );
}
