import React, { useState, useEffect, useCallback } from "react";

const Home = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [gameId, setGameId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const connect = useCallback(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);

      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      if (message.type === "game_state") {
        setGameState(message.data);
      } else if (message.type === "invalid_move") {
        console.error("Invalid move:", message.data);
        alert(`Invalid move: ${message.data}`);
      }
    };

    setSocket(ws);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(message));
      } else {
        console.error("WebSocket is not connected");
      }
    },
    [socket, isConnected]
  );

  const board = gameState
    ? gameState.board
    : Array(5)
        .fill(null)
        .map(() => Array(5).fill(null));
  const currentTurn = gameState ? gameState.players[gameState.currentTurn] : "";
  const gameOver = gameState ? gameState.gameOver : false;
  const winner = gameState ? gameState.winner : "";
  const waitingForGameStart = !gameState || gameState.players.length < 2;

  const joinGame = (gameId, playerId) => {
    if (isConnected) {
      console.log(`Joining game ${gameId} as ${playerId}`);
      sendMessage({ type: "join_game", data: { gameId, playerId } });
      setPlayerId(playerId);
      setGameId(gameId);
      setIsJoined(true);
    }
  };

  const setupCharacters = () => {
    if (isConnected) {
      const setupData = {
        playerId,
        gameId,
      };
      console.log("Sending setup data:", setupData);
      sendMessage({ type: "setup_characters", data: setupData });
    }
  };

  const handleMove = (move) => {
    if (isConnected && isJoined && !gameOver && currentTurn === playerId) {
      console.log(`Sending move: ${move}`);
      sendMessage({ type: "make_move", data: { gameId, move } });
    } else if (currentTurn !== playerId) {
      alert("It's not your turn!");
    }
  };

  const renderBoard = () => {
    return board.map((row, i) => (
      <div key={i} className="flex">
        {row.map((cell, j) => (
          <div
            key={j}
            className="w-16 h-16 border border-gray-400 flex items-center justify-center"
          >
            {cell ? `${cell.playerId}-${cell.id}` : ""}
          </div>
        ))}
      </div>
    ));
  };

  if (waitingForGameStart) {
    return (
      <div className="p-4">
        <h1 className="text-center text-2xl font-bold mb-4">Join Game</h1>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => joinGame("1", "A")}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Join as Player A
          </button>
          <button
            onClick={() => joinGame("1", "B")}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Join as Player B
          </button>
        </div>
        {isJoined && (
          <div className="text-center">
            <button
              onClick={setupCharacters}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Start Game
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-center text-2xl font-bold mb-4">Chess-like Game</h1>
      <div className="mb-4">{renderBoard()}</div>
      <div className="text-center text-xl font-bold mb-4">
        Current Turn: Player {currentTurn}
      </div>
      {gameOver ? (
        <div className="text-center text-xl font-bold mt-4">
          {winner ? `Player ${winner} wins!` : "Game Over"}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded mt-2"
          >
            Start New Game
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center mt-4">
          {["P1", "P2", "P3", "H1", "H2"].map((char) => (
            <div key={char} className="m-2">
              <p className="text-center font-bold">{char}</p>
              <div className="flex flex-wrap justify-center">
                {char.startsWith("P")
                  ? ["L", "R", "F", "B"].map((dir) => (
                      <button
                        key={`${char}:${dir}`}
                        onClick={() => handleMove(`${char}:${dir}`)}
                        className="px-2 py-1 bg-blue-500 text-white rounded m-1"
                        disabled={currentTurn !== playerId}
                      >
                        {dir}
                      </button>
                    ))
                  : char === "H1"
                  ? ["L", "R", "F", "B"].map((dir) => (
                      <button
                        key={`${char}:${dir}`}
                        onClick={() => handleMove(`${char}:${dir}`)}
                        className="px-2 py-1 bg-green-500 text-white rounded m-1"
                        disabled={currentTurn !== playerId}
                      >
                        {dir}
                      </button>
                    ))
                  : ["FL", "FR", "BL", "BR"].map((dir) => (
                      <button
                        key={`${char}:${dir}`}
                        onClick={() => handleMove(`${char}:${dir}`)}
                        className="px-2 py-1 bg-red-500 text-white rounded m-1"
                        disabled={currentTurn !== playerId}
                      >
                        {dir}
                      </button>
                    ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
