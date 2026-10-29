import { useState } from 'react';
import './App.css';

interface SquareProps {
  value: string | null;
  onSquareClick: () => void;
  isWinning?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

function Square({
  value,
  onSquareClick,
  isWinning = false,
  disabled = false,
  ariaLabel,
}: SquareProps) {
  const valueClass = value === 'X' ? 'square--x' : value === 'O' ? 'square--o' : '';
  const winningClass = isWinning ? 'square--winning' : '';

  return (
    <button
      type="button"
      className={`square ${valueClass} ${winningClass}`}
      onClick={onSquareClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <span className="square-content">{value}</span>
    </button>
  );
}

interface BoardProps {
  xIsNext: boolean;
  squares: Array<string | null>;
  onPlay: (nextSquares: Array<string | null>) => void;
  winningLine: [number, number, number] | null;
  winner: string | null;
  isDraw: boolean;
}

function Board({
  xIsNext,
  squares,
  onPlay,
  winningLine,
  winner,
  isDraw,
}: BoardProps) {
  function handleClick(i: number) {
    if (winner || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    onPlay(nextSquares);
  }

  const isGameOver = Boolean(winner) || isDraw;

  return (
    <div className="board-wrapper">
      <div className="board-grid" role="grid" aria-label="Tablero de Tres en Raya">
        {squares.map((square, i) => (
          <Square
            key={i}
            value={square}
            onSquareClick={() => handleClick(i)}
            isWinning={winningLine?.includes(i)}
            disabled={isGameOver || Boolean(square)}
            ariaLabel={
              square
                ? `Casilla ${i + 1}, marcada con ${square}`
                : `Casilla ${i + 1}, vacía. Turno de ${xIsNext ? 'X' : 'O'}`
            }
          />
        ))}
      </div>
    </div>
  );
}

interface WinnerInfo {
  winner: string;
  line: [number, number, number];
}

function calculateWinner(squares: Array<string | null>): WinnerInfo | null {
  const lines: [number, number, number][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

export default function Game() {
  const [history, setHistory] = useState<Array<Array<string | null>>>([
    Array(9).fill(null),
  ]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  const winnerInfo = calculateWinner(currentSquares);
  const winner = winnerInfo?.winner ?? null;
  const winningLine = winnerInfo?.line ?? null;
  const isDraw = !winner && currentSquares.every((square) => square !== null);

  function handlePlay(nextSquares: Array<string | null>) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove: number) {
    setCurrentMove(nextMove);
  }

  function handleRestart() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
  }

  return (
    <div className="game-container">
      {/* Header */}
      <header className="game-header">
        <div className="game-badge">
          <span className="badge-dot" />
          <span>React + TypeScript</span>
        </div>
        <h1 className="game-title">Tres en Raya</h1>
        <p className="game-subtitle">
          Experiencia moderna con historial interactivo y detección de jugadas ganadoras
        </p>
      </header>

      {/* Main Game Section */}
      <main className="game-main">
        {/* Left Column: Board & Controls */}
        <section className="game-board-card" aria-label="Zona del tablero">
          {/* Status Banner */}
          <div
            className={`status-banner ${
              winner
                ? 'status-banner--winner'
                : isDraw
                ? 'status-banner--draw'
                : 'status-banner--turn'
            }`}
            role="status"
            aria-live="polite"
          >
            {winner ? (
              <div className="status-content status-content--result">
                <span className="status-emoji" role="img" aria-label="Trofeo">
                  🏆
                </span>
                <div className="status-text-group">
                  <span className="status-headline">¡Victoria para {winner}!</span>
                  <span className="status-subline">
                    Ha completado la línea de la victoria
                  </span>
                </div>
              </div>
            ) : isDraw ? (
              <div className="status-content status-content--result">
                <span className="status-emoji" role="img" aria-label="Apretón de manos">
                  🤝
                </span>
                <div className="status-text-group">
                  <span className="status-headline">¡Partida en Empate!</span>
                  <span className="status-subline">
                    Tablero completado sin ganador
                  </span>
                </div>
              </div>
            ) : (
              <div className="status-content status-content--turn">
                <span className="status-turn-label">Turno actual:</span>
                <div className={`turn-pill turn-pill--${xIsNext ? 'x' : 'o'}`}>
                  <span className="turn-pill-icon">{xIsNext ? 'X' : 'O'}</span>
                  <span className="turn-pill-name">
                    Jugador {xIsNext ? 'X' : 'O'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Board */}
          <Board
            xIsNext={xIsNext}
            squares={currentSquares}
            onPlay={handlePlay}
            winningLine={winningLine}
            winner={winner}
            isDraw={isDraw}
          />

          {/* Quick Restart Action */}
          <div className="game-actions">
            <button
              type="button"
              className="btn-restart"
              onClick={handleRestart}
              title="Reiniciar la partida y borrar el historial"
            >
              <svg
                className="btn-restart-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reiniciar partida</span>
            </button>
          </div>
        </section>

        {/* Right Column: Move History Sidebar */}
        <aside className="game-history-card" aria-label="Historial de movimientos">
          <div className="history-header">
            <div className="history-header-left">
              <svg
                className="history-header-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h2 className="history-heading">Historial</h2>
            </div>
            <span className="history-count-badge">
              {history.length - 1} {history.length - 1 === 1 ? 'jugada' : 'jugadas'}
            </span>
          </div>

          <p className="history-hint">
            Selecciona cualquier punto para revisar el estado del tablero:
          </p>

          <div className="history-scroll-panel">
            <ol className="history-list">
              {history.map((_, move) => {
                const isSelected = move === currentMove;
                const isStart = move === 0;
                const mover = move > 0 ? (move % 2 === 1 ? 'X' : 'O') : null;

                return (
                  <li key={move} className="history-list-item">
                    <button
                      type="button"
                      className={`history-pill-btn ${
                        isSelected ? 'history-pill-btn--active' : ''
                      }`}
                      onClick={() => jumpTo(move)}
                      aria-current={isSelected ? 'step' : undefined}
                    >
                      <span className="history-step-indicator">
                        {isStart ? '0' : `#${move}`}
                      </span>

                      <div className="history-desc-wrap">
                        <span className="history-desc-title">
                          {isStart ? 'Inicio del juego' : `Movimiento #${move}`}
                        </span>
                        {mover && (
                          <span
                            className={`history-player-tag history-player-tag--${mover.toLowerCase()}`}
                          >
                            Ficha {mover}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <span className="history-active-chip">Actual</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}