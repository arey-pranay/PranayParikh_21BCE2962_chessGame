const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

let games = {};
const clients = [];

function createNewGame() {
  return {
    players: [],
    board: Array(5)
      .fill(null)
      .map(() => Array(5).fill(null)),
    // chanceB: 0,
    gameOver: false,
    winner: null,
  };
}
let board = Array(5)
  .fill(null)
  .map(() => Array(5).fill(null));
let playersJoined = 0;
let chanceB = 0;
const resetBoard = () => {
  board = Array(5)
    .fill(null)
    .map(() => Array(5).fill(null));
};
const initializeA = () => {
  // for (let i = 0; i < 5; i++) {
  board[0][0] = "A-P1";
  board[0][1] = "A-P2";
  board[0][2] = "A-P3";
  board[0][3] = "A-H1";
  board[0][4] = "A-H2";

  // }
  console.log(board);
  playersJoined++;
  return;
};
const initializeB = () => {
  // for (let i = 0; i < 5; i++) {
  //   board[4][i] = "B";
  // }
  board[4][0] = "B-P1";
  board[4][1] = "B-P2";
  board[4][2] = "B-P3";
  board[4][3] = "B-H1";
  board[4][4] = "B-H2";
  console.log(board);
  playersJoined++;
  return;
};
function broadcast(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
const registerMove = (ws, player, piece, direction) => {
  console.log("line58: " + player);
  console.log("line58: " + piece);
  console.log("line58: " + direction);

  if (player == "B") {
    if (direction == "L") direction = "R";
    else if (direction == "R") direction = "L";
    else if (direction == "F") direction = "B";
    else if (direction == "B") direction = "F";
    else if (direction == "FL") direction = "BR";
    else if (direction == "FR") direction = "BL";
    else if (direction == "BL") direction = "FR";
    else if (direction == "BR") direction = "FL";
    // for BL BR Fl Fr also then
  }
  let toFind = player + "-" + piece;
  console.log("toFind: " + toFind);
  let I = -1;
  let J = -1;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (board[i][j] == toFind) {
        I = i;
        J = j;
        break;
      }
    }
  }
  if (I == -1 || J == -1) console.log("position not found, maybe died");

  let OldI = I;
  let OldJ = J;
  //not yet considering killing other pieces
  //considering only One direction of moving. Later u=I need to update for A and B separately, coz one's up is another's down
  if (piece == "P1" || piece == "P2" || piece == "P3") {
    switch (direction) {
      case "R":
        J--;
        break;
      case "L":
        J++;
        break;
      case "F":
        I++;
        break;
      case "B":
        I--;
        break;
    }
  } else if (piece == "H1") {
    switch (direction) {
      case "R":
        J--;
        J--;
        break;
      case "L":
        J++;
        J++;
        break;
      case "F":
        I++;
        I++;
        break;
      case "B":
        I--;
        I--;
        break;
    }
  } else {
    switch (direction) {
      case "FL":
        I++;
        J++;
        break;
      case "FR":
        I++;
        J--;
        break;
      case "BL":
        I--;
        J++;
        break;
      case "BR":
        I--;
        J--;
        break;
    }
  }

  console.log("passing to check validity");
  console.log(I);
  console.log(J);
  if (!checkValidity(player, piece, I, J)) {
    console.log("invalid move"); //of this move
    ws.send(JSON.stringify({ type: "error_alert", data: "invalid move" }));
    return;
  }
  board[OldI][OldJ] = "";
  board[I][J] = toFind;
  console.log("Updated Board");
  console.log(board);
  chanceB = !chanceB;
  return;
};
const checkValidity = (player, piece, I, J) => {
  console.log("checking validity");
  console.log(I);
  console.log(J);
  console.log(player);
  // console.log(board[I][J].charAt(0));
  if (I < 0 || J < 0 || I > 4 || J > 4) return false;
  if (board[I][J] && player == board[I][J].charAt(0)) return false;
  return true;
  //maybe out of bound
  //maybe unable to kill due to hierarchy etc
};
function isValidMove(game, playerId, charId, i, j) {
  if (i < 0 || i >= 5 || j < 0 || j >= 5) return false;
  const character = game.board[i][j];
  return !character || character.playerId !== playerId;
}

// function handleMove(game, playerId, move) {
//   console.log("Current game state:", JSON.stringify(game));
//   console.log(`Handling move for player ${playerId}: ${move}`);

//   const [charId, direction] = move.split(":");
//   let charPosition;

//   for (let i = 0; i < 5; i++) {
//     for (let j = 0; j < 5; j++) {
//       console.log(
//         `Checking cell (${i}, ${j}):`,
//         JSON.stringify(game.board[i][j])
//       );
//       if (
//         game.board[i][j] &&
//         game.board[i][j].id === charId &&
//         game.board[i][j].playerId === playerId
//       ) {
//         charPosition = { i, j };
//         console.log(`Character ${charId} found at position (${i}, ${j})`);
//         break;
//       }
//     }
//     if (charPosition) break;
//   }

//   if (!charPosition) {
//     console.log(`Character ${charId} not found for player ${playerId}`);
//     return { error: "Character not found" };
//   }

//   let { i, j } = charPosition;
//   const charType = charId[0];

//   let newPositions = [];
//   switch (charType) {
//     case "P":
//       switch (direction) {
//         case "L":
//           newPositions.push({ i, j: j - 1 });
//           break;
//         case "R":
//           newPositions.push({ i, j: j + 1 });
//           break;
//         case "F":
//           newPositions.push({ i: i - 1, j });
//           break;
//         case "B":
//           newPositions.push({ i: i + 1, j });
//           break;
//         default:
//           return { error: "Invalid move direction for Pawn" };
//       }
//       break;
//     case "H":
//       if (charId === "H1") {
//         switch (direction) {
//           case "L":
//             newPositions.push({ i, j: j - 1 }, { i, j: j - 2 });
//             break;
//           case "R":
//             newPositions.push({ i, j: j + 1 }, { i, j: j + 2 });
//             break;
//           case "F":
//             newPositions.push({ i: i - 1, j }, { i: i - 2, j });
//             break;
//           case "B":
//             newPositions.push({ i: i + 1, j }, { i: i + 2, j });
//             break;
//           default:
//             return { error: "Invalid move direction for Hero1" };
//         }
//       } else if (charId === "H2") {
//         switch (direction) {
//           case "FL":
//             newPositions.push({ i: i - 1, j: j - 1 }, { i: i - 2, j: j - 2 });
//             break;
//           case "FR":
//             newPositions.push({ i: i - 1, j: j + 1 }, { i: i - 2, j: j + 2 });
//             break;
//           case "BL":
//             newPositions.push({ i: i + 1, j: j - 1 }, { i: i + 2, j: j - 2 });
//             break;
//           case "BR":
//             newPositions.push({ i: i + 1, j: j + 1 }, { i: i + 2, j: j + 2 });
//             break;
//           default:
//             return { error: "Invalid move direction for Hero2" };
//         }
//       }
//       break;
//     default:
//       return { error: "Invalid character type" };
//   }

//   for (let pos of newPositions) {
//     if (!isValidMove(game, playerId, charId, pos.i, pos.j)) {
//       return { error: "Invalid move" };
//     }
//   }

//   game.board[i][j] = null;
//   for (let pos of newPositions) {
//     if (game.board[pos.i][pos.j]) {
//       game.board[pos.i][pos.j] = null;
//     }
//   }
//   game.board[newPositions[newPositions.length - 1].i][
//     newPositions[newPositions.length - 1].j
//   ] = { id: charId, playerId };

//   const remainingPlayers = new Set();
//   game.board.forEach((row) =>
//     row.forEach((cell) => {
//       if (cell) remainingPlayers.add(cell.playerId);
//     })
//   );

//   if (remainingPlayers.size === 1) {
//     game.gameOver = true;
//     game.winner = Array.from(remainingPlayers)[0];
//   }

//   game.currentTurn = (game.currentTurn + 1) % game.players.length;

//   return { success: true, game };
// }

server.on("connection", (ws) => {
  let playerId;
  let gameId;
  clients.push(ws);
  ws.on("message", (message) => {
    try {
      const { type, data } = JSON.parse(message);
      console.log("Received message:", type, data);

      switch (type) {
        case "a_joined":
          console.log("a joined");
          initializeA();
          // const updateMessage = ;
          broadcast(
            JSON.stringify({
              type: "update_board",
              data: { board, playersJoined },
            })
          );
          // ws.send(JSON.stringify({ type: "update_board", data: board }));
          break;
        case "b_joined":
          console.log("b joined");
          initializeB();
          // const updateMessage = JSON.stringify({ type: "update_board", data: board });
          broadcast(
            JSON.stringify({
              type: "update_board",
              data: {
                board,
                playersJoined,
              },
            })
          );
          // ws.send(JSON.stringify({ type: "update_board", data: board }));
          break;

        case "piece_moved":
          // chanceB = !chanceB;
          console.log("piece_moved event received");
          console.log(data);
          let player = data.chanceB != 0 ? "B" : "A";
          let piece = data.char;
          let direction = data.dir;
          registerMove(ws, player, piece, direction);
          broadcast(
            JSON.stringify({
              type: "move_registered",
              data: {
                board,
                chanceB,
              },
            })
          );
        // case "start_game":
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
    const index = clients.indexOf(ws);
    if (index !== -1) {
      clients.splice(index, 1);
    }
    playersJoined = 0;
    resetBoard();
    broadcast(
      JSON.stringify({
        type: "playerLeft",
        data: { board: board },
      })
    );
    console.log("WebSocket connection closed");
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
