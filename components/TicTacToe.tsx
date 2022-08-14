import {
  ChangeEvent,
  KeyboardEvent, MouseEvent, useEffect, useRef, useState,
} from 'react';

import useTimer from '../hooks/useTimer';

import styles from '../styles/components/TicTacToe.module.css';

enum BoardCell {
    X = 'X',
    O = 'O',
    EMPTY = ''
}

enum GameStatus {
    DRAW = 'draw',
    WIN = 'win',
    NONE = 'none',
    END = 'end'
}

interface Score {
    [BoardCell.O]: number;
    [BoardCell.X]: number;
}

interface AlongContainers {
    rows: number[];
    columns: number[];
    diagonal: number[];
    oppositeDiagonal: number[];
}

interface PlayerContainers {
    [BoardCell.O]: AlongContainers;
    [BoardCell.X]: AlongContainers;
}

interface Cell {
    row: number
    column: number;
}

type PlayerBoardCell = BoardCell.O | BoardCell.X;

const MAX_MATCHES = 9;
const DEFAULT_SIZE = 3;
const CELL_ID_DELIMITOR = '-';
const DEFAULT_PLAYER = BoardCell.X;
const TOKEN_DARK = 'dark';
const TOKEN_BRIGHT = 'bright';
const DEFAULT_SCORE: Score = {
  [BoardCell.O]: 0,
  [BoardCell.X]: 0,
};

const PLAYERS = {
  [BoardCell.X]: 1,
  player1_color : "red",
  [BoardCell.O]: 2,
  player2_color: "blue",
};

const DEFAULT_CONTAINERS: AlongContainers = {
  rows: [0, 0, 0],
  columns: [0, 0, 0],
  diagonal: [0, 0, 0],
  oppositeDiagonal: [0, 0, 0],
};

export default function TicTacToe() {
  const {
    formattedTime, resetTimer, stopTimer,
  } = useTimer();

  const {
    formattedTime: overallFormattedTime, stopTimer: overallStopTimer,
  } = useTimer();

  const statisticsRef = useRef<null | HTMLDivElement>(null);
  const [status, setStatus] = useState<GameStatus>(GameStatus.NONE);
  const [history, setHistory] = useState<string[]>([]);
  const [score, setScore] = useState<Score>(DEFAULT_SCORE);
  const [player, setPlayer] = useState<string>(DEFAULT_PLAYER);
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [containers, setContainers] = useState<PlayerContainers>({
    O: DEFAULT_CONTAINERS,
    X: DEFAULT_CONTAINERS,
  });
  const [winningCells, setWinningCells] = useState<Cell[]>([]);
  const [board, setBoard] = useState<string[][]>([]);

  function timeout(delay: number) {
    return new Promise( res => setTimeout(res, delay) );
  }

  const resetGame = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setBoard(Array(size).fill(null).map((_) => Array(size).fill(BoardCell.EMPTY)));

    setContainers({
      O: {
        columns: Array(size).fill(0),
        diagonal: Array(size).fill(0),
        oppositeDiagonal: Array(size).fill(0),
        rows: Array(size).fill(0),
      },
      X: {
        columns: Array(size).fill(0),
        diagonal: Array(size).fill(0),
        oppositeDiagonal: Array(size).fill(0),
        rows: Array(size).fill(0),
      },
    });

    setWinningCells([]);
    setStatus(GameStatus.NONE);
    resetTimer();
  };

  const checkDraw = () => board.every((row) => row.every((cell) => cell !== BoardCell.EMPTY));

  const checkWinner = () => {
    const currentPlayerContainers: AlongContainers = containers[player as PlayerBoardCell];

    const winningRow = currentPlayerContainers.rows.findIndex((row) => row === size);
    if (winningRow > -1) {
      setWinningCells(
        Array(size).fill(Number).map((_, index) => ({ row: winningRow, column: index })),
      );

      return true;
    }

    const winningCol = currentPlayerContainers.columns.findIndex((row) => row === size);
    if (winningCol > -1) {
      setWinningCells(
        Array(size).fill(Number).map((_, index) => ({ row: index, column: winningCol })),
      );

      return true;
    }

    if (currentPlayerContainers.diagonal.every((cell) => cell >= 1)) {
      setWinningCells(
        Array(size).fill(Number).map((_, index) => ({
          row: index, column: index,
        })),
      );

      return true;
    }

    if (currentPlayerContainers.oppositeDiagonal.every((cell) => cell >= 1)) {
      setWinningCells(
        Array(size).fill(Number).map((_, index) => ({
          row: index, column: size - index - 1,
        })),
      );

      return true;
    }

    return false;
  };

  const updatePlayer = () => {
    setPlayer(player === BoardCell.X ? BoardCell.O : BoardCell.X);
  };

  const finishGame = () => {
    setStatus(GameStatus.END);
    overallStopTimer();
    stopTimer();

    setTimeout(() => {
      statisticsRef.current?.scrollIntoView();
    }, 2000);
  };

  const updateGame = () => {
    if (checkWinner()) {
      setStatus(GameStatus.WIN);

      setTimeout(() => {
        // setStatus(GameStatus.WIN);
        setScore({ ...score, [player as PlayerBoardCell]: score[player as PlayerBoardCell] + 1 });
        setHistory([...history, player]);

        if (score[player as PlayerBoardCell] + 1 > MAX_MATCHES / 2) {
          finishGame();
          return;
        }

        updatePlayer();
        resetGame();
      }, 2000);

      return;
    }

    if (checkDraw()) {
      setStatus(GameStatus.DRAW);

      setTimeout(() => {
        resetGame();
      }, 2000);
    }

    updatePlayer();
  };

  const handleCellClick = (evt: KeyboardEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>) => {
    const { currentTarget } = evt;
    const { id } = currentTarget;
    const [, rowIndex, colIndex] = id.split('-');

    if (board[+rowIndex][+colIndex] !== BoardCell.EMPTY || status === GameStatus.WIN) {
      return;
    }

    const newContainers: PlayerContainers = { ...containers };
    newContainers[player as PlayerBoardCell].rows[+rowIndex] += 1;
    newContainers[player as PlayerBoardCell].columns[+colIndex] += 1;

    if (colIndex === rowIndex) {
      newContainers[player as PlayerBoardCell].diagonal[+colIndex] += 1;
    }

    if ((+colIndex + +rowIndex === size - 1)) {
      newContainers[player as PlayerBoardCell].oppositeDiagonal[+colIndex] += 1;
    }

    setContainers(newContainers);

    const newBoard = [...board];
    newBoard[+rowIndex][+colIndex] = player;
    setBoard(newBoard);

    updateGame();
  };

  const renderStatus = () => {
    if (status === GameStatus.NONE) {
      return <></>;
    }

    const textMapper = {
      [GameStatus.DRAW]: 'Pareggio',
      [GameStatus.END]: `${PLAYERS[player as PlayerBoardCell]} vince!`,
      [GameStatus.WIN]: 'Game Over',
    };

    if (!textMapper[status]) {
      return <></>;
    }

    return (
      <div className="absolute inset-0 w-full h-full font-bold text-7xl flex items-center justify-center bg-alto-gray opacity-60">
        <p className="w-11/12 break-words">{textMapper[status]}</p>
      </div>
    );

  };

  const renderBoard = () => (
    <div className={`${styles.boardGame} ${styles[`boardSize${size}`]}`}>
      {
          board.map((row, rowIndex) => row.map((cell, colIndex) => {
            const identifier = `cell${CELL_ID_DELIMITOR}${rowIndex}${CELL_ID_DELIMITOR}${colIndex}`;
            // eslint-disable-next-line max-len
            const isWinning = winningCells.find((winningCell) => winningCell.row === rowIndex && winningCell.column === colIndex);
            const imagePath = `/images/${cell}_${isWinning ? TOKEN_BRIGHT : TOKEN_DARK}.svg`;

            return (
              <div
                key={identifier}
                className="border flex justify-center items-center"
                id={identifier}
                onKeyDown={handleCellClick}
                onClick={handleCellClick}
                role="button"
                tabIndex={2 + size * rowIndex + colIndex}
              >
                {cell !== BoardCell.EMPTY && <img className="h-11/12 w-11/12" src={imagePath} alt={identifier} />}
              </div>
            );
          }))
        }
    </div>
  );

  const renderPlayedMatches = () => (
    <div className="flex flex-col w-full items-center">
      <p className="font-bold text-xl mb-5">Partite giocate</p>
      <div className="flex flex-row w-full justify-center">
        {Array(MAX_MATCHES).fill(Number).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`played-matches-${index}`} className={`h-6 shadow-md w-6  rounded-full ${index + 1 <= history.length ? 'bg-dusty-gray' : ''} mx-0.5`} />
        ))}
      </div>
    </div>
  );

  const renderGameHistory = () => (
    <div className="flex flex-col w-full mt-6 items-center">
      <p className="font-bold text-xl mb-5">Vittorie</p>
      <div className="flex flex-row w-full justify-center items-center">
        {Array(MAX_MATCHES).fill(Number).map((_, index) => {
          const historyValue = history.slice(-MAX_MATCHES)[index];
          const formattedValue = historyValue === GameStatus.DRAW ? 'D' : `P${PLAYERS[historyValue as PlayerBoardCell]}`;

          let color = "h-7 w-7 rounded-lg shadow-md border mx-0.5 flex items-center justify-center text-sm";

          if(formattedValue === 'P1'){
            color += " bg-red-400"
          }
          if(formattedValue === 'P2'){
            color += " bg-blue-400"
          }

          return (
          // eslint-disable-next-line react/no-array-index-key
            <div
              key={`played-history-${index}`}
              // className="h-7 w-7 border border-dusty-gray mx-0.5 flex items-center justify-center text-sm">
            className={color}>
          {historyValue ? formattedValue : ''}
            </div>
          );
        })}
      </div>
    </div>
  );

  useEffect(() => {
    resetGame();
  }, [size]);

  const renderPlayerScore = (playerToRender: BoardCell) => (
    <>
      <div className={`${playerToRender === BoardCell.X ? "p-5 rounded-lg bg-red-400" : "p-5 rounded-lg bg-blue-400"}`}>
        <p className="font-bold text-3xl mb-3">
          Giocatore
          {' '}
          {PLAYERS[playerToRender as PlayerBoardCell]}
        </p>
        <p className="text-5xl md:text-7xl ">{score[playerToRender as PlayerBoardCell]}</p>
      </div>

    </>
  );

  return (
    <div>
      <section className="bg-porcelain-white py-16 text-center px-4 md:px-section h-screen flex flex-col justify-center">
        <h2 className="font-bold text-3xl mb-5">Un, due, TRIS!</h2>
        <p className="text-xl mb-6">Il gioco più affascinante di sempre</p>
        <div className="flex flex-row flex-wrap justify-between items-center w-full">
          <div className="hidden md:block">
            {renderPlayerScore(BoardCell.X)}
          </div>
          <div
            className="relative mx-0 md:mx-4 w-96 h-96 border border-alto-gray mb-10 md:mb-0"
          >
            {renderStatus()}
            {renderBoard()}
          </div>
          <div className="block md:hidden">
            {renderPlayerScore(BoardCell.X)}
          </div>
          <div>
            {renderPlayerScore(BoardCell.O)}
          </div>
        </div>
        <p className="mt-10 text-2xl md:text-3xl">{formattedTime}</p>
        <div className="mt-10 flex flex-col">
          {renderPlayedMatches()}
          {renderGameHistory()}
        </div>
        <div>
          <p className="mt-10 font-bold text-xl md:text-3xl mb-2 md:mb-7">Tempo totale</p>
          <span className="mt-10 text-xl md:text-3xl">{overallFormattedTime}</span>
        </div>
      </section>
    </div>
  );
}
