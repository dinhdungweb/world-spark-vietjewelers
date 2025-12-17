'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function SimpleTest() {
  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 text-white">
        <h1 className="text-xl mb-2">Simple 3D Test</h1>
        <p className="text-sm text-gray-400">You should see a blue sphere with yellow dots</p>
      </div>
      
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
        style={{ background: '#000000' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        {/* Blue sphere (globe) */}
        <mesh>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial color="#1a3a5a" />
        </mesh>
        
        {/* Yellow dots (sparks) */}
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        
        <mesh position={[-2, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        
        <mesh position={[0, -2, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        
        <mesh position={[0, 0, 2]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}
