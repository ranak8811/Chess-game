"use strict";

function Piece(x, y, type, color) {
  let char;
  let moved = false;
  switch (type) {
    case "Pawn":
      char = "\u2659";
      break;
    case "Knight":
      char = "\u265E";
      break;
    case "Bishop":
      char = "\u265D";
      break;
    case "Rook":
      char = "\u265C";
      break;
    case "Queen":
      char = "\u265B";
      break;
    case "King":
      char = "\u265A";
      break;
  }
  let fill = color === "White" ? "#fff" : "#000";
  let size = Piece.prototype.tileSize;
  let half = size / 2;
  let dispX = x * size + half;
  let dispY = y * size + half;
  return {
    type: type,
    color: color,
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get moved() {
      return moved;
    },
    set moved(b) {
      moved = b;
    },
    moveTo(nx, ny) {
      x = nx;
      y = ny;
    },
    moveDispTo(nx, ny) {
      dispX = nx;
      dispY = ny;
    },
    reset() {
      dispX = x * size + half;
      dispY = y * size + half;
    },
    draw(ctx) {
      ctx.fillStyle = fill;
      ctx.fillText(char, dispX, dispY + size * 0.1);
    },
  };
}

const canvas = document.getElementById("display");
const messages = document.getElementById("messages");
const ctx = canvas.getContext("2d");
const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
const sideSize = (Piece.prototype.tileSize = size / 8);
const tiles = new Array(8).fill().map(() => new Array(8).fill(""));
const highlights = new Array(8)
  .fill()
  .map(() => new Array(8).fill("#00000000"));
const pieces = [
  Piece(0, 0, "Rook", "Black"),
  Piece(1, 0, "Knight", "Black"),
  Piece(2, 0, "Bishop", "Black"),
  Piece(3, 0, "Queen", "Black"),
  Piece(4, 0, "King", "Black"),
  Piece(5, 0, "Bishop", "Black"),
  Piece(6, 0, "Knight", "Black"),
  Piece(7, 0, "Rook", "Black"),
  Piece(0, 1, "Pawn", "Black"),
  Piece(1, 1, "Pawn", "Black"),
  Piece(2, 1, "Pawn", "Black"),
  Piece(3, 1, "Pawn", "Black"),
  Piece(4, 1, "Pawn", "Black"),
  Piece(5, 1, "Pawn", "Black"),
  Piece(6, 1, "Pawn", "Black"),
  Piece(7, 1, "Pawn", "Black"),
  Piece(0, 6, "Pawn", "White"),
  Piece(1, 6, "Pawn", "White"),
  Piece(2, 6, "Pawn", "White"),
  Piece(3, 6, "Pawn", "White"),
  Piece(4, 6, "Pawn", "White"),
  Piece(5, 6, "Pawn", "White"),
  Piece(6, 6, "Pawn", "White"),
  Piece(7, 6, "Pawn", "White"),
  Piece(0, 7, "Rook", "White"),
  Piece(1, 7, "Knight", "White"),
  Piece(2, 7, "Bishop", "White"),
  Piece(3, 7, "Queen", "White"),
  Piece(4, 7, "King", "White"),
  Piece(5, 7, "Bishop", "White"),
  Piece(6, 7, "Knight", "White"),
  Piece(7, 7, "Rook", "White"),
];

canvas.width = size;
canvas.height = size;

ctx.textBaseline = "middle";
ctx.textAlign = "center";
ctx.font = sideSize + "px Georgia";

for (let x = 0; x < 8; ++x)
  for (let y = 0; y < 8; ++y)
    tiles[y][x] = y % 2 === x % 2 ? "#D2B48C" : "#A0522D";

let moving = null;
let validMoves = null;
let turn = false;
let winScreen = false;
let frameHandle;

addEventListener("mousedown", (e) => {
  if (winScreen) {
    frameHandle = requestAnimationFrame(frame);
    winScreen = false;
    messages.innerText = "";
  }
  if (moving === null) {
    const rect = canvas.getBoundingClientRect();
    moving = getPieceAt(
      Math.floor((e.clientX - rect.x) / sideSize),
      Math.floor((e.clientY - rect.y) / sideSize)
    );
    if (moving === undefined || (moving.color === "White") === turn)
      moving = null;
    else validMoves = getSquaresChecked(moving);
  }
});
addEventListener("mousemove", (e) => {
  if (moving !== null) {
    const rect = canvas.getBoundingClientRect();
    moving.moveDispTo(e.clientX - rect.x, e.clientY - rect.y);
  }
});
addEventListener("mouseup", (e) => {
  if (moving !== null) {
    const rect = canvas.getBoundingClientRect();
    const tileX = Math.floor((e.clientX - rect.x) / sideSize);
    const tileY = Math.floor((e.clientY - rect.y) / sideSize);
    if (
      validMoves.find((m) => m[0] === tileX && m[1] === tileY) !== undefined
    ) {
      const index = pieces.findIndex((p) => p.x === tileX && p.y === tileY);
      if (index > -1) pieces.splice(index, 1);
      moving.moved = true;
      if (moving.type === "King") {
        if (tileX - moving.x === 2) {
          let rook = getPieceAt(7, moving.y);
          rook.moveTo(tileX - 1, moving.y);
          rook.reset();
        }
        if (tileX - moving.x === -2) {
          let rook = getPieceAt(0, moving.y);
          rook.moveTo(tileX + 1, moving.y);
          rook.reset();
        }
      }
      moving.moveTo(tileX, tileY);
      turn = !turn;
    }
    moving.reset();
    moving = null;
    let checkmate = true;
    for (const piece of pieces) {
      if (
        (piece.color !== "White") === turn &&
        getSquaresChecked(piece).length
      ) {
        checkmate = false;
        break;
      }
    }
    for (let x = 0; x < 8; ++x)
      for (let y = 0; y < 8; ++y) highlights[y][x] = "#00000000";
    if (checkmate) {
      winScreen = true;
      cancelAnimationFrame(frameHandle);
      draw();
      messages.innerText =
        (turn ? "White" : "Black") + " Wins!" + "\nClick to play again";
      reset();
    } else if (inCheck()) messages.innerText = "Check!";
    else messages.innerText = "";
  }
});

frameHandle = requestAnimationFrame(frame);

function getPieceAt(x, y) {
  return pieces.find((p) => p.x === x && p.y === y);
}

function getSquares(piece) {
  let validMoves = [];
  switch (piece.type) {
    case "Pawn":
      const n = piece.color === "White" ? 1 : -1;
      const r = piece.color === "White" ? 6 : 1;
      if (getPieceAt(piece.x, piece.y - 1 * n) === undefined) {
        validMoves.push([piece.x, piece.y - 1 * n, "#0000ff55"]);
        if (getPieceAt(piece.x, piece.y - 2 * n) === undefined && piece.y === r)
          validMoves.push([piece.x, piece.y - 2 * n, "#0000ff55"]);
      }
      const left = getPieceAt(piece.x - 1, piece.y - 1 * n);
      const right = getPieceAt(piece.x + 1, piece.y - 1 * n);
      if (left !== undefined && left.color !== piece.color)
        validMoves.push([piece.x - 1, piece.y - 1 * n, "#ff000055"]);
      if (right !== undefined && right.color !== piece.color)
        validMoves.push([piece.x + 1, piece.y - 1 * n, "#ff000055"]);
      break;
    case "Knight":
      const moves = [
        [piece.x + 2, piece.y + 1],
        [piece.x - 2, piece.y + 1],
        [piece.x + 2, piece.y - 1],
        [piece.x - 2, piece.y - 1],
        [piece.x + 1, piece.y + 2],
        [piece.x - 1, piece.y + 2],
        [piece.x + 1, piece.y - 2],
        [piece.x - 1, piece.y - 2],
      ];
      for (const m of moves) {
        const p = getPieceAt(...m);
        if (p === undefined) validMoves.push(m.concat("#0000ff55"));
        else if (p.color !== piece.color)
          validMoves.push(m.concat("#ff000055"));
      }
      break;
    case "Bishop":
      for (let dx = -1; dx < 2; dx += 2)
        for (let dy = -1; dy < 2; dy += 2) {
          let x = piece.x + dx;
          let y = piece.y + dy;
          while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            const p = getPieceAt(x, y);
            if (p !== undefined) {
              if (p.color !== piece.color) validMoves.push([x, y, "#ff000055"]);
              break;
            }
            validMoves.push([x, y, "#0000ff55"]);
            x += dx;
            y += dy;
          }
        }
      break;
    case "Rook":
      for (let d = -1; d < 2; d += 2) {
        let dx = d;
        let dy = 0;
        let x = piece.x + dx;
        let y = piece.y + dy;
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const p = getPieceAt(x, y);
          if (p !== undefined) {
            if (p.color !== piece.color) validMoves.push([x, y, "#ff000055"]);
            break;
          }
          validMoves.push([x, y, "#0000ff55"]);
          x += dx;
          y += dy;
        }
        dx = 0;
        dy = d;
        x = piece.x + dx;
        y = piece.y + dy;
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const p = getPieceAt(x, y);
          if (p !== undefined) {
            if (p.color !== piece.color) validMoves.push([x, y, "#ff000055"]);
            break;
          }
          validMoves.push([x, y, "#0000ff55"]);
          x += dx;
          y += dy;
        }
      }
      break;
    case "Queen":
      for (let dx = -1; dx < 2; ++dx)
        for (let dy = -1; dy < 2; ++dy) {
          let x = piece.x + dx;
          let y = piece.y + dy;
          while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            const p = getPieceAt(x, y);
            if (p !== undefined) {
              if (p.color !== piece.color) validMoves.push([x, y, "#ff000055"]);
              break;
            }
            validMoves.push([x, y, "#0000ff55"]);
            x += dx;
            y += dy;
          }
        }
      break;
    case "King":
      for (let dx = -1; dx < 2; ++dx)
        for (let dy = -1; dy < 2; ++dy) {
          const x = piece.x + dx;
          const y = piece.y + dy;
          const p = getPieceAt(x, y);
          if (p === undefined) validMoves.push([x, y, "#0000ff55"]);
          else if (p.color !== piece.color)
            validMoves.push([x, y, "#ff000055"]);
        }
      if (!piece.moved) {
        let left = getPieceAt(0, piece.y);
        let right = getPieceAt(7, piece.y);
        if (
          left !== undefined &&
          !left.moved &&
          getPieceAt(1, piece.y) === undefined &&
          getPieceAt(2, piece.y) === undefined &&
          getPieceAt(3, piece.y) === undefined
        )
          validMoves.push([piece.x - 2, piece.y, "#0000ff55"]);
        if (
          right !== undefined &&
          !right.moved &&
          getPieceAt(6, piece.y) === undefined &&
          getPieceAt(5, piece.y) === undefined
        )
          validMoves.push([piece.x + 2, piece.y, "#0000ff55"]);
      }
      break;
  }
  validMoves = validMoves.filter(
    (m) => m[0] >= 0 && m[0] < 8 && m[1] >= 0 && m[1] < 8
  );
  return validMoves;
}

function getSquaresChecked(piece) {
  validMoves = getSquares(piece);
  for (const move of validMoves) {
    let x = piece.x;
    let y = piece.y;
    const index = pieces.findIndex((p) => p.x === move[0] && p.y === move[1]);
    let removed;
    if (index !== -1) removed = pieces.splice(index, 1)[0];
    piece.moveTo(move[0], move[1]);
    if (inCheck()) move[2] = "rm";
    else highlights[move[1]][move[0]] = move[2];
    piece.moveTo(x, y);
    if (removed !== undefined) pieces.splice(index, 0, removed);
  }
  return validMoves.filter((a) => a[2] !== "rm");
}

function inCheck() {
  let king = pieces.find(
    (p) => p.type === "King" && (p.color !== "White") === turn
  );
  if (king === undefined) return true;
  for (const piece of pieces)
    if (getSquares(piece).find((a) => a[0] === king.x && a[1] === king.y))
      return true;
  return false;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let x = 0; x < 8; ++x)
    for (let y = 0; y < 8; ++y) {
      ctx.fillStyle = tiles[y][x];
      ctx.fillRect(x * sideSize, y * sideSize, sideSize, sideSize);
      ctx.fillStyle = highlights[y][x];
      ctx.fillRect(x * sideSize, y * sideSize, sideSize, sideSize);
    }

  for (const piece of pieces) piece.draw(ctx);
}

function frame() {
  draw();

  frameHandle = requestAnimationFrame(frame);
}

function reset() {
  pieces.splice(0, pieces.length);
  pieces.splice(
    0,
    0,
    Piece(0, 0, "Rook", "Black"),
    Piece(1, 0, "Knight", "Black"),
    Piece(2, 0, "Bishop", "Black"),
    Piece(3, 0, "Queen", "Black"),
    Piece(4, 0, "King", "Black"),
    Piece(5, 0, "Bishop", "Black"),
    Piece(6, 0, "Knight", "Black"),
    Piece(7, 0, "Rook", "Black"),
    Piece(0, 1, "Pawn", "Black"),
    Piece(1, 1, "Pawn", "Black"),
    Piece(2, 1, "Pawn", "Black"),
    Piece(3, 1, "Pawn", "Black"),
    Piece(4, 1, "Pawn", "Black"),
    Piece(5, 1, "Pawn", "Black"),
    Piece(6, 1, "Pawn", "Black"),
    Piece(7, 1, "Pawn", "Black"),
    Piece(0, 6, "Pawn", "White"),
    Piece(1, 6, "Pawn", "White"),
    Piece(2, 6, "Pawn", "White"),
    Piece(3, 6, "Pawn", "White"),
    Piece(4, 6, "Pawn", "White"),
    Piece(5, 6, "Pawn", "White"),
    Piece(6, 6, "Pawn", "White"),
    Piece(7, 6, "Pawn", "White"),
    Piece(0, 7, "Rook", "White"),
    Piece(1, 7, "Knight", "White"),
    Piece(2, 7, "Bishop", "White"),
    Piece(3, 7, "Queen", "White"),
    Piece(4, 7, "King", "White"),
    Piece(5, 7, "Bishop", "White"),
    Piece(6, 7, "Knight", "White"),
    Piece(7, 7, "Rook", "White")
  );
}
