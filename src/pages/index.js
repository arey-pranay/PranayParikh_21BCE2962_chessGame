import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";

const Home = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [gameId, setGameId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const [board, setBoard] = useState(
    Array(5)
      .fill(null)
      .map(() => Array(5).fill(null))
  );
  const [playerCount, setPlayerCount] = useState(0);
  const [chanceB, setChanceB] = useState(0);
  useEffect(() => {
    if (playerCount < 2) return;
    let countA = 0;
    let countB = 0;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (board[i][j]) {
          if (board[i][j].charAt(0) == "A") {
            countA++;
          }
          if (board[i][j].charAt(0) == "B") {
            countB++;
          }
        }
      }
    }
    if (countA == 0) {
      setTimeout(() => {
        // window.location.reload();
        alert("Game Ends! B Won");
        setBoard([]);
        window.location.reload();
      }, 200);
    }
    if (countB == 0) {
      setTimeout(() => {
        // window.location.reload();
        alert("Game Ends! A Won");
        setBoard([]);
        window.location.reload();
      }, 200);
    }
    setALeft(countA);
    setBLeft(countB);

    // checkForWin()
    console.log(board);
  }, [board]);
  // const checkForWin = ()=>{
  //   if(aLeft==0) alert("B Won");
  //   if(BLeft==0) alert("A Won");
  // }
  const [aLeft, setALeft] = useState(5);
  const [bLeft, setBLeft] = useState(5);
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
      if (message.type === "update_board") {
        setBoard(message.data.board);
        console.log(message.data);
        setPlayerCount(message.data.playersJoined);
      } else if (message.type == "move_registered") {
        // alert("move registered");
        setBoard(message.data.board);
        setChanceB(message.data.chanceB); //invalid, killing, winning etc ignore for now coz  just wanna get all set up and running first
      } else if (message.type == "playerLeft") {
        setBoard(message.data.board);
        setPlayerCount(0);
        setPlayerId("");
        // alert("You won, the other player left");
        // setTimeout(() => {
        //   location.reload();
        // }, 1000);
      } else if (message.type == "error_alert") {
        alert(message.data);
      }
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

  // const board = gameState
  //   ? gameState.board
  //   : Array(5)
  //       .fill(null)
  //       .map(() => Array(5).fill(null));
  // const currentTurn = gameState ? gameState.players[gameState.currentTurn] : "";
  const [currentTurn, setCurrentTurn] = useState("A");
  useEffect(() => {
    setCurrentTurn(chanceB == 1 ? "B" : "A");
  }, [chanceB]);

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
    alert("button clicked");
    if (isConnected && isJoined && !gameOver && currentTurn === playerId) {
      console.log(`Sending move: ${move}`);
      sendMessage({ type: "make_move", data: { gameId, move } });
    } else if (currentTurn !== playerId) {
      alert("It's not your turn!");
    }
  };

  const renderBoard = () => {
    return board.map((row, i) => (
      <div key={i} className="flex w-full justify-center ">
        {row.map((col, j) => (
          <div
            key={j}
            className={`w-20 m-1 h-20 border ${
              !col
                ? "bg-purple-50 rounded"
                : col.charAt(0) == "A"
                ? "bg-cyan-200 rounded-b-3xl"
                : "bg-emerald-200 rounded-t-3xl"
            }  border-gray-400 flex items-center justify-center transition-all duration-500`}
          >
            {col}
          </div>
        ))}
      </div>
    ));
  };
  if (playerCount < 2) {
    return (
      <div className="bg-purple-50 h-screen flex flex-col justify-between overflow-x-hidden">
        <div className="w-full flex justify-between bg-black text-white text-3xl font-normal p-8">
          <button
            onClick={() => {
              sendMessage({ type: "a_joined", data: {} });
              setPlayerId("A");
            }}
            disabled={playerId}
            className={`${
              !playerId && "hover:opacity-50 cursor-pointer "
            } text-cyan-200`}
          >
            Join as Player <strong>A</strong>
          </button>
          <button
            onClick={() => {
              sendMessage({ type: "b_joined", data: {} });
              setPlayerId("B");
            }}
            disabled={playerId}
            className={` ${
              !playerId && "hover:opacity-50 cursor-pointer"
            } text-emerald-200`}
          >
            Join as Player <strong>B</strong>
          </button>
        </div>
        <div className="w-full h-full bg-purple-50 text-purple-950 text-center py-8">
          {playerCount == 0 ? (
            <h1 className="text-4xl">Press Join to Initialize a Game</h1>
          ) : (
            <h1 className="text-4xl">1 Player Joined, Waiting for 1 </h1>
          )}
          {/* {playerId && (
            <h1 className="text-center underline  text-lg m-10">
              Hey, you are Player: <strong>{playerId}</strong>
            </h1>
          )} */}
          <iframe
            // width="560"
            // height="315"
            className="w-1/3 h-fit aspect-video mx-auto mt-7"
            src="https://www.youtube.com/embed/ZUOlj3Rn2jU?si=Vcv715IwUhBZdWQq"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
          <h1>
            {" "}
            This video was put here for recording purposes only, I have not
            created hitwicket, but would love to contribute in its development.
          </h1>
        </div>

        <footer className="w-full bg-purple-950 text-white text-center py-2">
          A{" "}
          <Link
            href="https://in.linkedin.com/in/pranay-parikh-530331218"
            target="_blank"
            className="hover:underline hover:underline-offset-2 underline-offset-0 transition-all duration-100"
          >
            {" "}
            Pranay Parikh{" "}
          </Link>{" "}
          Product
        </footer>
        {/* <h1>{playerCount} joined</h1> */}
      </div>
    );
  }

  // return <div>both joined</div>;

  // if (waitingForGameStart) {
  //   return (
  //     <div className="p-4">
  //       <h1 className="text-center text-2xl font-bold mb-4">Join Game</h1>
  //       <div className="flex justify-center space-x-4 mb-4">
  //         <button
  //           onClick={() => joinGame("1", "A")}
  //           className="px-4 py-2 bg-blue-500 text-white rounded"
  //         >
  //           Join as Player A
  //         </button>
  //         <button
  //           onClick={() => joinGame("1", "B")}
  //           className="px-4 py-2 bg-blue-500 text-white rounded"
  //         >
  //           Join as Player B
  //         </button>
  //       </div>
  //       {isJoined && (
  //         <div className="text-center">
  //           <button
  //             onClick={setupCharacters}
  //             className="px-4 py-2 bg-green-500 text-white rounded"
  //           >
  //             Start Game
  //           </button>
  //         </div>
  //       )}
  //     </div>
  //   );
  // }

  return (
    <div className=" bg-purple-50 h-screen flex flex-col justify-between overflow-x-hidden">
      <header className="w-full flex justify-between items-center p-2 bg-purple-950 px-10">
        <h1 className="text-center text-xl font-bold text-white hover:tracking-wider transition-all duration-200">
          Clash of Chess
        </h1>
        <div className="flex gap-10">
          <h1 className="text-cyan-500">
            A&apos;s Remaining Pieces: <strong>{aLeft}</strong>
          </h1>
          <h1 className="text-emerald-500">
            B&apos;s Remaining Pieces: <strong>{bLeft}</strong>
          </h1>
        </div>

        <h1 className="text-center  text-xl text-white">
          Hey, you are: <strong>{playerId}</strong>
        </h1>
        {/* <h1 className="text-purple-50">By Pranay</h1> */}
      </header>
      <div className="w-full gap-4 sm:flex justify-between p-2">
        <>
          <div className="my-4 p-2 rounded  sm:w-1/3 mx-auto bg-purple-950 ">
            {renderBoard()}
          </div>
        </>
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
          <>
            <div className="flex flex-wrap  mt-4 sm:w-2/3  justify-center ">
              {["P1", "P2", "P3", "H1", "H2"].map((char) => (
                <div key={char} className="m-2">
                  <p className="text-center font-bold">{char}</p>
                  <div className="flex flex-wrap justify-center">
                    {char.startsWith("P")
                      ? ["L", "F", "B", "R"].map((dir) => (
                          <button
                            key={`${char}:${dir}`}
                            onClick={() =>
                              // handleMove(`${char}:${dir}`)

                              sendMessage({
                                type: "piece_moved",
                                data: { chanceB, char, dir },
                              })
                            }
                            className={`px-5 py-5 bg-purple-500 text-white rounded m-1 text-xl ${
                              currentTurn == playerId && "hover:opacity-70"
                            }`}
                            disabled={currentTurn !== playerId}
                          >
                            {dir}
                          </button>
                        ))
                      : char === "H1"
                      ? ["L", "F", "B", "R"].map((dir) => (
                          <button
                            key={`${char}:${dir}`}
                            // onClick={() => handleMove(`${char}:${dir}`)}
                            onClick={() =>
                              // handleMove(`${char}:${dir}`)

                              sendMessage({
                                type: "piece_moved",
                                data: { chanceB, char, dir },
                              })
                            }
                            className={`px-5 py-5 bg-purple-600 text-white rounded m-1 text-xl ${
                              currentTurn == playerId && "hover:opacity-70"
                            }`}
                            disabled={currentTurn !== playerId}
                          >
                            {dir}
                          </button>
                        ))
                      : ["FL", "BL", "BR", "FR"].map((dir) => (
                          <button
                            key={`${char}:${dir}`}
                            // onClick={() => handleMove(`${char}:${dir}`)}
                            onClick={() =>
                              // handleMove(`${char}:${dir}`)

                              sendMessage({
                                type: "piece_moved",
                                data: { chanceB, char, dir },
                              })
                            }
                            className={`px-5 py-5 bg-purple-700 text-white rounded m-1 text-xl ${
                              currentTurn == playerId && " hover:opacity-70"
                            }`}
                            disabled={currentTurn !== playerId}
                          >
                            {dir}
                          </button>
                        ))}
                  </div>
                </div>
              ))}
            </div>
            <div className=" sm:text-xl flex justify-center w-full h-fit sm:h-full flex-col sm:w-fit text-center gap-4">
              {currentTurn == playerId ? (
                <div className="rounded-full mx-auto sm:mx-0 bg-purple-950 p-7 my-8 sm:my-0 text-white hover:rotate-12 transition-all duration-200 hover:scale-90">
                  {" "}
                  <h1 className="font-bold underline">Your Turn</h1>
                </div>
              ) : (
                <div className="rounded-full mx-auto sm:mx-0 bg-yellow-400 p-7 my-8 sm:my-0 text-white hover:rotate-12 transition-all duration-200 hover:scale-90">
                  {" "}
                  <h1 className="font-semibold text-lg whitespace-nowrap">
                    {" "}
                    {chanceB == 1 ? "B" : "A"}&apos;s Turn <br />
                  </h1>
                  <h1 className="text-sm whitespace-nowrap"> Please Wait </h1>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <footer className="w-full bg-purple-950 text-white text-center py-2">
        A{" "}
        <Link
          href="https://in.linkedin.com/in/pranay-parikh-530331218"
          target="_blank"
          className="hover:underline hover:underline-offset-2 underline-offset-0 transition-all duration-100"
        >
          {" "}
          Pranay Parikh{" "}
        </Link>{" "}
        Product
      </footer>
    </div>
  );
};

export default Home;
