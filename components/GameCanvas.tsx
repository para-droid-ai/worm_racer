import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, TrackSegment, Player, Opponent, OpponentShape } from '../types';
import { useKeyboardControls } from '../hooks/useKeyboardControls';

interface GameCanvasProps {
    gameState: GameState;
    setScore: React.Dispatch<React.SetStateAction<number>>;
    setBoost: React.Dispatch<React.SetStateAction<number>>;
    endGame: (finalScore: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setScore, setBoost, endGame }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Initialize useRef with a value to avoid potential TypeScript errors.
    const animationFrameId = useRef<number>(0);
    const controls = useKeyboardControls();

    const gameData = useRef({
        player: { angle: 0, xOffset: 0, z: 0, speed: 300 } as Player,
        track: [] as TrackSegment[],
        opponents: [] as Opponent[],
        camera: { fov: 300, z: 0 },
        trackLength: 1000,
        segmentsCount: 200,
        segmentLength: 50,
        rumble: 0,
        score: 0,
        boost: 100,
        // FIX: Add lastTime to the gameData ref to track frame delta time.
        lastTime: 0,
    });

    const resetGame = useCallback(() => {
        const { current: data } = gameData;
        data.player = { angle: 0, xOffset: 0, z: 0, speed: 300 };
        data.camera.z = 0;
        data.track = [];
        data.opponents = [];
        data.score = 0;
        data.boost = 100;

        let currentCurve = 0;
        for (let i = 0; i < data.segmentsCount; i++) {
            const z = i * data.segmentLength;
            if (Math.random() < 0.02) {
                currentCurve = (Math.random() - 0.5) * 5;
            }
            data.track.push({
                z: z,
                x: 0,
                y: 0,
                curve: currentCurve,
                color: (Math.floor(i / 10) % 2 === 0) ? '#00FFFF' : '#FF00FF',
            });
        }
        
        for (let i = 0; i < 15; i++) {
            data.opponents.push({
                id: i,
                z: Math.random() * data.trackLength * data.segmentLength,
                angle: Math.random() * Math.PI * 2,
                color: ['#FF0000', '#00FF00', '#0000FF'][Math.floor(Math.random() * 3)],
                shape: [OpponentShape.Square, OpponentShape.Pentagon, OpponentShape.Triangle][Math.floor(Math.random()*3)],
                speed: 250 + Math.random() * 100,
                laneChangeSpeed: (Math.random() - 0.5) * 0.1,
                targetAngle: Math.random() * Math.PI * 2,
            });
        }
    }, []);

    const project = useCallback((x: number, y: number, z: number, canvasWidth: number, canvasHeight: number) => {
        const { fov } = gameData.current.camera;
        const scale = fov / (fov + z);
        return {
            x: canvasWidth / 2 + x * scale,
            y: canvasHeight / 2 + y * scale,
            scale: scale,
        };
    }, []);

    const drawPolygon = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, sides: number, color: string) => {
        ctx.beginPath();
        const angleStep = (Math.PI * 2) / sides;
        for (let i = 0; i < sides + 1; i++) {
            const angle = i * angleStep;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }, []);

    const drawOpponent = useCallback((ctx: CanvasRenderingContext2D, opponent: Opponent, canvasWidth: number, canvasHeight: number) => {
        const { player, camera } = gameData.current;
        const segmentIndex = Math.floor(opponent.z / gameData.current.segmentLength) % gameData.current.segmentsCount;
        const trackSegment = gameData.current.track[segmentIndex];
        if (!trackSegment) return;

        const opponentWorldX = trackSegment.x + Math.cos(opponent.angle) * 200;
        const opponentWorldY = trackSegment.y + Math.sin(opponent.angle) * 200;
        const zDist = opponent.z - camera.z;

        if (zDist < 0) return;

        const p = project(opponentWorldX - player.xOffset, opponentWorldY, zDist, canvasWidth, canvasHeight);
        
        const size = 20 * p.scale;
        
        ctx.fillStyle = opponent.color;
        ctx.strokeStyle = opponent.color;
        
        switch (opponent.shape) {
            case OpponentShape.Square:
                ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
                break;
            case OpponentShape.Pentagon:
                 drawPolygon(ctx, p.x, p.y, size/1.5, 5, opponent.color);
                 break;
            case OpponentShape.Triangle:
            default:
                 drawPolygon(ctx, p.x, p.y, size/1.5, 3, opponent.color);
                 break;
        }

    }, [project, drawPolygon]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const { current: data } = gameData;
        const { player, camera, track, opponents } = data;
        const canvas = ctx.canvas;
        const { width, height } = canvas;
        
        ctx.clearRect(0, 0, width, height);

        // Update player & camera
        const isBoosting = controls.boost && data.boost > 0;
        const currentSpeed = player.speed * (isBoosting ? 2.5 : 1);
        if (isBoosting) {
            data.boost -= 20 * dt;
            if (data.boost < 0) data.boost = 0;
        } else if (data.boost < 100) {
            data.boost += 5 * dt;
            if (data.boost > 100) data.boost = 100;
        }

        camera.z += currentSpeed * dt;
        player.z = camera.z;
        data.score += currentSpeed * dt / 10;

        const playerSegmentIndex = Math.floor(player.z / data.segmentLength);
        const playerSegment = track[playerSegmentIndex % data.segmentsCount];
        player.xOffset += (playerSegment.curve * (currentSpeed/player.speed) * -5) * dt;

        if (controls.left) player.angle -= 2 * dt;
        if (controls.right) player.angle += 2 * dt;
        
        const targetXOffset = Math.cos(player.angle) * 200;
        player.xOffset += (targetXOffset - player.xOffset) * 5 * dt;

        // Rumble
        if (Math.abs(player.xOffset) > 180) {
            data.rumble = Math.random() * 10;
        } else {
            data.rumble *= 0.9;
        }

        const rumbleX = (Math.random() - 0.5) * data.rumble;
        const rumbleY = (Math.random() - 0.5) * data.rumble;
        ctx.translate(rumbleX, rumbleY);

        // Draw track
        let lastP = null;
        let lastX = 0;
        let cumulativeCurve = 0;

        for (let i = playerSegmentIndex; i < playerSegmentIndex + 100; i++) {
            const segment = track[i % data.segmentsCount];
            if (!segment) continue;

            const zDist = (i * data.segmentLength) - camera.z;
            if (zDist < 0) continue;

            cumulativeCurve += segment.curve;
            segment.x = lastX + cumulativeCurve;
            lastX = segment.x;

            const p = project(segment.x - player.xOffset, segment.y, zDist, width, height);
            
            if (lastP) {
                const radius = 250 * p.scale;
                drawPolygon(ctx, p.x, p.y, radius, 16, segment.color);
            }
            lastP = p;
        }

        // Update and draw opponents
        opponents.forEach(opp => {
            opp.z += (opp.speed - currentSpeed) * dt;
            
            // Basic AI: move towards target angle, then pick a new one
            opp.angle += (opp.targetAngle - opp.angle) * 0.5 * dt;
            if (Math.abs(opp.targetAngle - opp.angle) < 0.1) {
                opp.targetAngle = (Math.random() - 0.5) * 2.5;
            }

            if (opp.z < camera.z) opp.z += data.trackLength * data.segmentLength;
            drawOpponent(ctx, opp, width, height);
            
            // Collision
            const zDist = opp.z - player.z;
            if (zDist > 0 && zDist < 20) {
                 const angleDist = Math.abs(opp.angle - player.angle);
                 if (angleDist < 0.2) {
                     data.boost = Math.max(0, data.boost - 1);
                     data.rumble = 20;
                 }
            }
        });

        // Draw Player Ship (as simple lines)
        ctx.strokeStyle = '#0F0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 20, height - 50);
        ctx.lineTo(width / 2, height - 70);
        ctx.lineTo(width / 2 + 20, height - 50);
        ctx.closePath();
        ctx.stroke();

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        // Update UI
        setScore(Math.floor(data.score));
        setBoost(Math.floor(data.boost));

    }, [project, controls, setScore, setBoost, drawOpponent, drawPolygon]);

    const gameLoop = useCallback((timestamp: number) => {
        const lastTime = gameData.current.lastTime || timestamp;
        const dt = (timestamp - lastTime) / 1000;
        gameData.current.lastTime = timestamp;

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            draw(ctx, dt);
        }
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [draw]);

    useEffect(() => {
        if (gameState === GameState.Playing) {
            resetGame();
            gameData.current.lastTime = performance.now();
            animationFrameId.current = requestAnimationFrame(gameLoop);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameState, gameLoop, resetGame]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        const handleResize = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};

export default GameCanvas;
