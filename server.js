const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

let games = {};

function createNewGame() {
  return {
    players: [],
    board: Array(5)
      .fill(null)
      .map(() => Array(5).fill(null)),
    currentTurn: 0,
    gameOver: false,
    winner: null,
  };
}

function isValidMove(game, playerId, charId, i, j) {
  if (i < 0 || i >= 5 || j < 0 || j >= 5) return false;
  const character = game.board[i][j];
  return !character || character.playerId !== playerId;
}

function handleMove(game, playerId, move) {
  console.log("Current game state:", JSON.stringify(game));
  console.log(`Handling move for player ${playerId}: ${move}`);

  const [charId, direction] = move.split(":");
  let charPosition;

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      console.log(
        `Checking cell (${i}, ${j}):`,
        JSON.stringify(game.board[i][j])
      );
      if (
        game.board[i][j] &&
        game.board[i][j].id === charId &&
        game.board[i][j].playerId === playerId
      ) {
        charPosition = { i, j };
        console.log(`Character ${charId} found at position (${i}, ${j})`);
        break;
      }
    }
    if (charPosition) break;
  }

  if (!charPosition) {
    console.log(`Character ${charId} not found for player ${playerId}`);
    return { error: "Character not found" };
  }

  let { i, j } = charPosition;
  const charType = charId[0];

  let newPositions = [];
  switch (charType) {
    case "P":
      switch (direction) {
        case "L":
          newPositions.push({ i, j: j - 1 });
          break;
        case "R":
          newPositions.push({ i, j: j + 1 });
          break;
        case "F":
          newPositions.push({ i: i - 1, j });
          break;
        case "B":
          newPositions.push({ i: i + 1, j });
          break;
        default:
          return { error: "Invalid move direction for Pawn" };
      }
      break;
    case "H":
      if (charId === "H1") {
        switch (direction) {
          case "L":
            newPositions.push({ i, j: j - 1 }, { i, j: j - 2 });
            break;
          case "R":
            newPositions.push({ i, j: j + 1 }, { i, j: j + 2 });
            break;
          case "F":
            newPositions.push({ i: i - 1, j }, { i: i - 2, j });
            break;
          case "B":
            newPositions.push({ i: i + 1, j }, { i: i + 2, j });
            break;
          default:
            return { error: "Invalid move direction for Hero1" };
        }
      } else if (charId === "H2") {
        switch (direction) {
          case "FL":
            newPositions.push({ i: i - 1, j: j - 1 }, { i: i - 2, j: j - 2 });
            break;
          case "FR":
            newPositions.push({ i: i - 1, j: j + 1 }, { i: i - 2, j: j + 2 });
            break;
          case "BL":
            newPositions.push({ i: i + 1, j: j - 1 }, { i: i + 2, j: j - 2 });
            break;
          case "BR":
            newPositions.push({ i: i + 1, j: j + 1 }, { i: i + 2, j: j + 2 });
            break;
          default:
            return { error: "Invalid move direction for Hero2" };
        }
      }
      break;
    default:
      return { error: "Invalid character type" };
  }

  for (let pos of newPositions) {
    if (!isValidMove(game, playerId, charId, pos.i, pos.j)) {
      return { error: "Invalid move" };
    }
  }

  game.board[i][j] = null;
  for (let pos of newPositions) {
    if (game.board[pos.i][pos.j]) {
      game.board[pos.i][pos.j] = null;
    }
  }
  game.board[newPositions[newPositions.length - 1].i][
    newPositions[newPositions.length - 1].j
  ] = { id: charId, playerId };

  const remainingPlayers = new Set();
  game.board.forEach((row) =>
    row.forEach((cell) => {
      if (cell) remainingPlayers.add(cell.playerId);
    })
  );

  if (remainingPlayers.size === 1) {
    game.gameOver = true;
    game.winner = Array.from(remainingPlayers)[0];
  }

  game.currentTurn = (game.currentTurn + 1) % game.players.length;

  return { success: true, game };
}

server.on("connection", (ws) => {
  let playerId;
  let gameId;

  ws.on("message", (message) => {
    try {
      const { type, data } = JSON.parse(message);
      console.log("Received message:", type, data);

      switch (type) {
        case "join_game":
          playerId = data.playerId;
          gameId = data.gameId;

          if (!games[gameId]) {
            games[gameId] = createNewGame();
          }
          if (!games[gameId].players.includes(playerId)) {
            games[gameId].players.push(playerId);
          }
          ws.send(JSON.stringify({ type: "game_state", data: games[gameId] }));
          break;

        case "setup_characters":
          if (games[gameId]) {
            const row = playerId === "A" ? 4 : 0;
            const characters = ["P1", "P2", "P3", "H1", "H2"];
            characters.forEach((char, index) => {
              games[gameId].board[row][index] = {
                id: char,
                playerId: playerId,
              };
              console.log(
                `Set up ${char} for player ${playerId} at position (${row}, ${index})`
              );
            });
            console.log("Updated board:", JSON.stringify(games[gameId].board));
            server.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({ type: "game_state", data: games[gameId] })
                );
              }
            });
          }
          break;

        case "make_move":
          const game = games[gameId];
          if (game) {
            if (game.players[game.currentTurn] !== playerId) {
              ws.send(
                JSON.stringify({ type: "invalid_move", data: "Not your turn" })
              );
              return;
            }
            console.log("Current game state:", JSON.stringify(game));
            console.log(`Player ${playerId} attempting move: ${data.move}`);

            const result = handleMove(game, playerId, data.move);
            if (result.error) {
              ws.send(
                JSON.stringify({ type: "invalid_move", data: result.error })
              );
            } else {
              server.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({ type: "game_state", data: result.game })
                  );
                }
              });
            }
          }
          break;

        default:
          console.error("Unknown message type:", type);
      }
    } catch (e) {
      console.error("Error processing message:", e);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
