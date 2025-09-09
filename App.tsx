
import React, { useState, useCallback, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import UILayer from './components/UILayer';
import { GameState } from './types';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.StartMenu);
    const [score, setScore] = useState(0);
    const [boost, setBoost] = useState(100);
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        const storedHighScore = localStorage.getItem('vecnaHighScore');
        if (storedHighScore) {
            setHighScore(parseInt(storedHighScore, 10));
        }
    }, []);

    const startGame = useCallback(() => {
        setScore(0);
        setBoost(100);
        setGameState(GameState.Playing);
    }, []);

    const endGame = useCallback((finalScore: number) => {
        setGameState(GameState.GameOver);
        if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('vecnaHighScore', finalScore.toString());
        }
    }, [highScore]);
    
    return (
        <main className="w-screen h-screen bg-black overflow-hidden relative">
            <GameCanvas 
                gameState={gameState} 
                setScore={setScore} 
                setBoost={setBoost}
                endGame={endGame}
            />
            <UILayer 
                gameState={gameState} 
                score={score}
                boost={boost}
                highScore={highScore}
                startGame={startGame}
            />
        </main>
    );
};

export default App;
