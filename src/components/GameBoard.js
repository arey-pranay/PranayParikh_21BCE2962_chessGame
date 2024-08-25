import React from "react";

const GameBoard = ({ board }) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="w-16 h-16 flex items-center justify-center border border-gray-500"
          >
            {cell ? `${cell.playerId}-${cell.id}` : ""}
          </div>
        ))
      )}
    </div>
  );
};

export default GameBoard;
