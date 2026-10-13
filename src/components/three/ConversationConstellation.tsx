import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ConstellationNode {
  id: string;
  label: string;
  role: string;
  position: [number, number, number];
  ip: string;
}

export const CONSTELLATION_NODES: ConstellationNode[] = [
  { id: 'design-lab', label: 'Design Lab', role: 'UX Workstation 01', position: [2.5, 0.2, 1.4], ip: '192.168.1.14' },
  { id: 'library', label: 'Library', role: 'Quiet Study Node', position: [1.8, -0.2, -2.2], ip: '192.168.1.28' },
  { id: 'room-204', label: 'Room 204', role: 'Systems Lab', position: [-2.4, 0.35, -1.5], ip: '192.168.1.05' },
  { id: 'engineering-studio', label: 'Engineering Studio', role: 'Hardware Testing', position: [-2.6, -0.15, 1.8], ip: '192.168.1.42' },
  { id: 'campus-commons', label: 'Campus Commons', role: 'Peer Access Point', position: [0.2, 0.4, 2.7], ip: '192.168.1.99' },
];

interface ConstellationSceneProps {
  activeNodeId: string | null;
  onNodeHover: (id: string | null) => void;
  mousePos: { x: number; y: number };
  isReducedMotion: boolean;
}

function ConstellationScene({
  activeNodeId,
  onNodeHover,
  mousePos,
  isReducedMotion,
}: ConstellationSceneProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const capsuleRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Create curves between hub (0, 0.35, 0) and each node
  const connections = useMemo(() => {
    const hubPos = new THREE.Vector3(0, 0.35, 0);
    return CONSTELLATION_NODES.map((node) => {
      const targetPos = new THREE.Vector3(...node.position);
      // Midpoint arched upward slightly for architectural curve
      const mid = new THREE.Vector3()
        .addVectors(hubPos, targetPos)
        .multiplyScalar(0.5);
      mid.y += 0.45;

      const curve = new THREE.QuadraticBezierCurve3(hubPos, mid, targetPos);
      const points = curve.getPoints(36);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return {
        nodeId: node.id,
        curve,
        geometry,
        targetPos,
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!rootGroupRef.current) return;

    if (!isReducedMotion) {
      // Subtle gentle oscillation at rest + pointer-controlled rotation clamped to ~6 degrees (0.105 rad)
      const restOscillation = Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
      const targetY = mousePos.x * 0.105 + restOscillation;
      const targetX = -mousePos.y * 0.06;

      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        targetY,
        0.06
      );
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        targetX,
        0.06
      );

      // Animate message capsules traveling along selected connections
      connections.forEach((conn, idx) => {
        const mesh = capsuleRefs.current[idx];
        if (!mesh) return;

        // Active connection moves faster, others have staggered speeds
        const speedMultiplier = activeNodeId === conn.nodeId ? 0.6 : 0.25;
        const progress =
          ((state.clock.elapsedTime * speedMultiplier + idx * 0.28) % 1);
        const point = conn.curve.getPointAt(progress);
        mesh.position.copy(point);

        // Pulse scale gently
        const scale = 1 + Math.sin(state.clock.elapsedTime * 4 + idx) * 0.15;
        mesh.scale.set(scale, scale, scale);
      });
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, -0.3, 0]}>
      {/* Muted stone platform beneath the composition */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[3.8, 3.9, 0.14, 48]} />
        <meshStandardMaterial
          color="#E5E0D7"
          roughness={0.88}
          metalness={0.06}
        />
      </mesh>
      {/* Stone platform perimeter hairline bevel */}
      <mesh position={[0, -0.27, 0]}>
        <ringGeometry args={[3.74, 3.82, 48]} />
        <meshStandardMaterial color="#D3CEBF" roughness={0.7} />
      </mesh>

      {/* Central Server Hub */}
      <group position={[0, 0, 0]}>
        {/* Hub base cylinder */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.05, 0.32, 36]} />
          <meshStandardMaterial
            color="#202522"
            roughness={0.42}
            metalness={0.18}
          />
        </mesh>
        {/* Hub upper stepped dome */}
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.72, 0.85, 0.16, 36]} />
          <meshStandardMaterial
            color="#294E43"
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>
        {/* Hub central glowing status lens */}
        <mesh position={[0, 0.44, 0]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial
            color="#D36C43"
            emissive="#D36C43"
            emissiveIntensity={0.65}
            roughness={0.2}
          />
        </mesh>

        {/* 3 subtle satellite connector pins on the hub */}
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.45,
              0.43,
              Math.sin(angle) * 0.45,
            ]}
          >
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#F4F1EB" roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Connection lines between Hub and Nodes */}
      {connections.map((conn, idx) => {
        const isActive = activeNodeId === conn.nodeId;
        return (
          <group key={conn.nodeId}>
            {/* The curved trajectory line */}
            {/* @ts-expect-error Three line primitive */}
            <line geometry={conn.geometry}>
              <lineBasicMaterial
                color={isActive ? '#D36C43' : '#777D76'}
                opacity={isActive ? 0.95 : 0.38}
                transparent
                linewidth={isActive ? 2 : 1}
              />
            </line>

            {/* Traveling message capsule */}
            <mesh
              ref={(el) => {
                capsuleRefs.current[idx] = el;
              }}
              position={[0, 0, 0]}
            >
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshStandardMaterial
                color={isActive ? '#D36C43' : '#294E43'}
                emissive={isActive ? '#D36C43' : '#294E43'}
                emissiveIntensity={isActive ? 0.8 : 0.3}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      })}

      {/* Peripheral Client Nodes */}
      {CONSTELLATION_NODES.map((node) => {
        const isHovered = activeNodeId === node.id;
        return (
          <group
            key={node.id}
            position={node.position}
            onPointerOver={(e) => {
              e.stopPropagation();
              onNodeHover(node.id);
            }}
            onPointerOut={() => onNodeHover(null)}
          >
            {/* Node pedestal collar */}
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.34, 0.38, 0.1, 24]} />
              <meshStandardMaterial
                color="#E5E0D7"
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>

            {/* Node body device */}
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.3, 0.22, 24]} />
              <meshStandardMaterial
                color={isHovered ? '#294E43' : '#F4F1EB'}
                roughness={0.4}
                metalness={0.15}
              />
            </mesh>

            {/* Node top indicator lens */}
            <mesh position={[0, 0.26, 0]}>
              <sphereGeometry args={[0.11, 20, 20]} />
              <meshStandardMaterial
                color={isHovered ? '#D36C43' : '#294E43'}
                emissive={isHovered ? '#D36C43' : '#294E43'}
                emissiveIntensity={isHovered ? 0.9 : 0.4}
                roughness={0.2}
              />
            </mesh>

            {/* Subtle beacon halo when hovered */}
            {isHovered && (
              <mesh position={[0, 0.26, 0]}>
                <ringGeometry args={[0.22, 0.32, 24]} />
                <meshBasicMaterial
                  color="#D36C43"
                  transparent
                  opacity={0.45}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Architectural SVG fallback when WebGL is unavailable or reduced motion is active
function ConstellationFallbackSvg({
  activeNodeId,
  onNodeHover,
}: {
  activeNodeId: string | null;
  onNodeHover: (id: string | null) => void;
}) {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <svg
        viewBox="0 0 500 500"
        className="w-full max-w-[440px] aspect-square"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base stone disc */}
        <circle cx="250" cy="250" r="210" fill="#E5E0D7" opacity="0.65" />
        <circle cx="250" cy="250" r="200" stroke="#777D76" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

        {/* Central Hub */}
        <circle cx="250" cy="250" r="52" fill="#202522" />
        <circle cx="250" cy="250" r="38" fill="#294E43" />
        <circle cx="250" cy="250" r="14" fill="#D36C43" />

        {/* Node connections and client nodes */}
        {CONSTELLATION_NODES.map((node, i) => {
          // Map 3D positions to 2D projection
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const nx = 250 + Math.cos(angle) * 150;
          const ny = 250 + Math.sin(angle) * 150;
          const isSelected = activeNodeId === node.id;

          return (
            <g
              key={node.id}
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => onNodeHover(node.id)}
              onMouseLeave={() => onNodeHover(null)}
            >
              {/* Curved hairline */}
              <line
                x1="250"
                y1="250"
                x2={nx}
                y2={ny}
                stroke={isSelected ? '#D36C43' : '#777D76'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                opacity={isSelected ? 1 : 0.45}
              />
              {/* Traveling packet dot */}
              <circle
                cx={250 + Math.cos(angle) * (isSelected ? 90 : 70)}
                cy={250 + Math.sin(angle) * (isSelected ? 90 : 70)}
                r={isSelected ? 6 : 4}
                fill={isSelected ? '#D36C43' : '#294E43'}
              />
              {/* Node device body */}
              <circle
                cx={nx}
                cy={ny}
                r={isSelected ? 26 : 22}
                fill={isSelected ? '#294E43' : '#F4F1EB'}
                stroke={isSelected ? '#D36C43' : '#202522'}
                strokeWidth="2"
              />
              <circle
                cx={nx}
                cy={ny}
                r={isSelected ? 9 : 7}
                fill={isSelected ? '#D36C43' : '#294E43'}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface ConversationConstellationProps {
  className?: string;
  onSelectNode?: (node: ConstellationNode) => void;
}

export const ConversationConstellation: React.FC<ConversationConstellationProps> = ({
  className = '',
  onSelectNode,
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>('design-lab');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);

      // Verify WebGL availability
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) setWebGlAvailable(false);
      } catch {
        setWebGlAvailable(false);
      }

      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const activeNode = CONSTELLATION_NODES.find((n) => n.id === activeNodeId);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-square max-w-[560px] mx-auto select-none ${className}`}
    >
      {/* 3D Canvas or WebGL fallback */}
      <div className="absolute inset-0 z-0">
        {webGlAvailable && !isReducedMotion ? (
          <Canvas
            camera={{ position: [0, 4.4, 4.6], fov: 42 }}
            dpr={[1, 1.75]} // Cap pixel ratio for performance
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <ambientLight intensity={0.75} />
            {/* Key light warm studio */}
            <directionalLight position={[4, 7, 5]} intensity={1.3} color="#FFFBF4" castShadow />
            {/* Fill light cool studio */}
            <directionalLight position={[-5, 3, -3]} intensity={0.5} color="#E8EEF2" />
            {/* Soft rim light */}
            <pointLight position={[0, 5, -2]} intensity={0.6} color="#F4F1EB" />

            <Suspense fallback={null}>
              <ConstellationScene
                activeNodeId={activeNodeId}
                onNodeHover={(id) => {
                  setActiveNodeId(id);
                  if (id && onSelectNode) {
                    const node = CONSTELLATION_NODES.find((n) => n.id === id);
                    if (node) onSelectNode(node);
                  }
                }}
                mousePos={mousePos}
                isReducedMotion={isReducedMotion}
              />
            </Suspense>
          </Canvas>
        ) : (
          <ConstellationFallbackSvg
            activeNodeId={activeNodeId}
            onNodeHover={(id) => {
              setActiveNodeId(id);
              if (id && onSelectNode) {
                const node = CONSTELLATION_NODES.find((n) => n.id === id);
                if (node) onSelectNode(node);
              }
            }}
          />
        )}
      </div>

      {/* Floating Node Info Box */}
      <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex justify-between items-end">
        <div className="bg-[#F4F1EB]/90 backdrop-blur-md border border-[#202522]/10 rounded-xl px-4 py-2.5 shadow-sm min-h-[58px] min-w-[210px] transition-all duration-200">
          {activeNode ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D36C43] animate-pulse" />
                <span className="font-serif text-sm font-semibold text-[#202522]">
                  {activeNode.label}
                </span>
                <span className="text-[11px] font-mono text-[#777D76]">
                  {activeNode.ip}
                </span>
              </div>
              <p className="text-xs text-[#777D76] mt-0.5">{activeNode.role}</p>
            </div>
          ) : (
            <div>
              <span className="font-serif text-xs font-medium text-[#777D76]">
                Central Hub · Socket Server Active
              </span>
              <p className="text-[11px] text-[#777D76]/80 mt-0.5">
                Hover or select a local network node
              </p>
            </div>
          )}
        </div>

        {/* Small live connection indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#777D76] bg-[#F4F1EB]/80 backdrop-blur-sm border border-[#202522]/10 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#294E43]" />
          <span>5 peers registered</span>
        </div>
      </div>

      {/* Keyboard-accessible controls outside canvas for WCAG AA compliance */}
      <div className="sr-only">
        <h4>Keyboard node selectors</h4>
        {CONSTELLATION_NODES.map((node) => (
          <button
            key={node.id}
            onClick={() => {
              setActiveNodeId(node.id);
              if (onSelectNode) onSelectNode(node);
            }}
          >
            Select node {node.label} at {node.ip}
          </button>
        ))}
      </div>
    </div>
  );
};
