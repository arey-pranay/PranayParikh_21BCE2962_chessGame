const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

const clients = [];

let board = Array(5)
  .fill(null)
  .map(() => Array(5).fill(null));
let playersJoined = 0;
let chanceB = 0;
let moveHistory = {
  A: [],
  B: [],
};
const resetBoard = () => {
  board = Array(5)
    .fill(null)
    .map(() => Array(5).fill(null));
};
const resetHistory = () => {
  moveHistory = {
    A: [],
    B: [],
  };
};

const initializeA = () => {
  board[0][0] = "A-P1";
  board[0][1] = "A-P2";
  board[0][2] = "A-P3";
  board[0][3] = "A-H1";
  board[0][4] = "A-H2";
  console.log(board);
  playersJoined++;
  return;
};
const initializeB = () => {
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
  const originalDirection = direction;
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
        pathKill = checkValidityH1(player, piece, I, J);
        J--;

        break;
      case "L":
        J++;
        pathKill = checkValidityH1(player, piece, I, J);

        J++;
        break;
      case "F":
        I++;
        pathKill = checkValidityH1(player, piece, I, J);

        I++;
        break;
      case "B":
        I--;
        pathKill = checkValidityH1(player, piece, I, J);

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
  if (piece == "H1") {
    console.log(pathKill);
    if (pathKill[0] == -1 && pathKill[1] == -1) {
      console.log("invalid move"); //of this move
      ws.send(JSON.stringify({ type: "error_alert", data: "invalid move" }));
      return;
    }
    if (!checkValidity(player, piece, I, J)) {
      console.log("invalid move"); //of this move
      ws.send(JSON.stringify({ type: "error_alert", data: "invalid move" }));
      return;
    }
    board[pathKill[0]][pathKill[1]] = "";
    board[OldI][OldJ] = "";
    board[I][J] = toFind;
    console.log("Updated Board");
    console.log(board);
    chanceB = !chanceB;
    moveHistory[player].push((piece + " : " + originalDirection).toString());
    return;
  } else {
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
    moveHistory[player].push((piece + " : " + originalDirection).toString());
    return;
  }
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
const checkValidityH1 = (player, piece, I, J) => {
  console.log("checking validity for H1");
  console.log(I);
  console.log(J);
  console.log(player);
  // console.log(board[I][J].charAt(0));
  if (I < 0 || J < 0 || I > 4 || J > 4) return [-1, -1];
  if (board[I][J] && player == board[I][J].charAt(0)) return [-1, -1];
  return [I, J];
};

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
                moveHistory,
              },
            })
          );
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
    resetHistory();
    broadcast(
      JSON.stringify({
        type: "playerLeft",
        data: { board: board, moveHistory: moveHistory },
      })
    );
    console.log("WebSocket connection closed");
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
