
import React from 'react';
import { GameState } from '../types';

interface UILayerProps {
    gameState: GameState;
    score: number;
    boost: number;
    highScore: number;
    startGame: () => void;
}

const UILayer: React.FC<UILayerProps> = ({ gameState, score, boost, highScore, startGame }) => {

    const renderUI = () => {
        switch (gameState) {
            case GameState.StartMenu:
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-green-400 text-glow">
                        <h1 className="text-8xl mb-4">PROJECT VECNA</h1>
                        <h2 className="text-4xl mb-8">VECTOR RACER</h2>
                        <div className="retro-border p-4 mb-8 text-2xl text-center">
                            <p>HIGH SCORE: {highScore}</p>
                        </div>
                        <button onClick={startGame} className="text-3xl retro-border px-8 py-4 hover:bg-green-900 transition-colors">
                            START GAME
                        </button>
                        <p className="mt-12 text-xl">Use LEFT/RIGHT Arrow Keys to Move | SPACE to Boost</p>
                    </div>
                );
            case GameState.GameOver:
                 return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-red-500 text-glow">
                        <h1 className="text-8xl mb-4">GAME OVER</h1>
                        <div className="retro-border border-red-500 shadow-red-500/50 p-6 text-3xl text-center">
                            <p>FINAL SCORE: {score}</p>
                            <p className="text-2xl mt-2">HIGH SCORE: {highScore}</p>
                        </div>
                        <button onClick={startGame} className="text-3xl retro-border border-red-500 shadow-red-500/50 px-8 py-4 mt-8 hover:bg-red-900 transition-colors">
                            RESTART
                        </button>
                    </div>
                );
            case GameState.Playing:
                return (
                    <>
                        <div className="absolute top-5 left-5 retro-border text-green-400 text-2xl">
                            <p>PROJECT VECNA</p>
                            <p>SCORE: {score}</p>
                        </div>
                         <div className="absolute top-5 right-5 retro-border text-green-400 text-2xl text-right">
                            <p>LEADERBOARD</p>
                            <p>paradr0id: {highScore}</p>
                        </div>
                        <div className="absolute bottom-5 left-5 w-64 retro-border p-2">
                             <p className="text-green-400 text-xl mb-1">BOOST</p>
                             <div className="w-full h-6 bg-black border border-green-400">
                                <div className="h-full bg-green-400" style={{ width: `${boost}%`, transition: 'width 0.1s linear' }}></div>
                             </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return <div className="absolute inset-0 pointer-events-none">{renderUI()}</div>;
};

export default UILayer;
