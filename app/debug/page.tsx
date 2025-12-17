'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Simple conversion function
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

export default function DebugPage() {
  const [sparks, setSparks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sparks')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched sparks:', data.length);
        setSparks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 text-white bg-black bg-opacity-50 p-4 rounded">
        <h1 className="text-xl mb-2">Debug Globe View</h1>
        <p className="text-sm">Total sparks: {sparks.length}</p>
        <p className="text-xs text-gray-400 mt-2">
          You should see a dark sphere with {sparks.length} yellow dots
        </p>
      </div>
      
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
        style={{ background: '#000000' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, 5]} intensity={0.8} />
        <pointLight position={[0, 0, 5]} intensity={0.6} />
        
        {/* Globe with better visibility */}
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial
            color="#1a2332"
            roughness={0.7}
            metalness={0.3}
            emissive="#0a1520"
            emissiveIntensity={0.5}
          />
        </mesh>
        
        {/* Render each spark individually */}
        {sparks.map((spark, index) => {
          const position = latLngToVector3(spark.latitude, spark.longitude, 2);
          return (
            <mesh key={spark.id} position={[position.x, position.y, position.z]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color="#ffee66" toneMapped={false} />
            </mesh>
          );
        })}
        
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}
