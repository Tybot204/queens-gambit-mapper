import { Board, Color, RawInput } from "./types";

/* eslint-disable @typescript-eslint/no-require-imports */
const rawData = require("./dataVerified.json");
// const rawData = require("./dataUnverified.json");

const MASTER_BOARD_WIDTH = 64;

const uniqueBoards: Board[] = [];
const masterBoard: (Board | undefined)[][] = new Array(MASTER_BOARD_WIDTH);
for (let i = 0; i < MASTER_BOARD_WIDTH; i++) {
  masterBoard[i] = new Array(MASTER_BOARD_WIDTH);
}

const rowsMatch = (row1: string[], row2: string[]) => {
  let index = 0;
  for (const row of row1) {
    if (row !== row2[index]) {
      return false;
    }
    index += 1;
  }
  return true;
};

const edgeRow = (row: string[]) => {
  if (row[0] === row[1]
    && row[1] === row[2]
    && row[2] === row[3]
    && row[3] === row[4]
    && row[4] === row[5]
    && row[5] === row[6]
    && row[6] === row[7]) {
    return true;
  }
  return false;
};

const traverseBoards = (startingBoard: Board | undefined, row: number, col: number) => {
  let currentBoard = startingBoard;
  let i = row;
  let j = col;

  // Traverse down
  while (currentBoard) {
    if (currentBoard) uniqueBoards.splice(uniqueBoards.indexOf(currentBoard), 1);
    currentBoard = currentBoard.bottomBoard;
    i += 1;
    if (masterBoard[i][j]) break;
    masterBoard[i][j] = currentBoard;
  }
  const lastRow = i;

  // Traverse right
  currentBoard = startingBoard;
  i = row;
  j = col;
  while (currentBoard) {
    if (currentBoard) uniqueBoards.splice(uniqueBoards.indexOf(currentBoard), 1);
    currentBoard = currentBoard.rightBoard;
    j += 1;
    if (masterBoard[i][j]) break;
    masterBoard[i][j] = currentBoard;
  }
  const lastCol = j;

  return { lastRow, lastCol };
};

const start = async () => {
  console.log("Starting...");

  const boards: Board[] = [];

  const rawDataTyped = rawData as RawInput;
  for (const key in rawDataTyped) {
    const data = rawDataTyped[key];
    const frequency = data.sequence;
    const color = data.fill as Color;

    const symbols = data.symbols;

    const topRow = symbols[0];
    const bottomRow = symbols[7];

    const leftColumn = [symbols[0][0], symbols[1][0], symbols[2][0], symbols[3][0], symbols[4][0], symbols[5][0], symbols[6][0], symbols[7][0]];
    const rightColumn = [symbols[0][7], symbols[1][7], symbols[2][7], symbols[3][7], symbols[4][7], symbols[5][7], symbols[6][7], symbols[7][7]];

    const centerPiece = symbols[3][3] || undefined;

    boards.push({
      tjId: key,
      frequency,
      topRow,
      leftColumn,
      rightColumn,
      bottomRow,
      centerPiece,
      color,
    });
  }

  for (const board of boards) {
    const found = uniqueBoards.find(b => b.frequency === board.frequency);
    if (!found) {
      uniqueBoards.push(board);
    }
  }

  for (const board of uniqueBoards) {
    if (!edgeRow(board.topRow)) board.topBoard = uniqueBoards.find(b => rowsMatch(board.topRow, b.bottomRow));
    if (!edgeRow(board.bottomRow)) board.bottomBoard = uniqueBoards.find(b => rowsMatch(board.bottomRow, b.topRow));
    if (!edgeRow(board.leftColumn)) board.leftBoard = uniqueBoards.find(b => rowsMatch(board.leftColumn, b.rightColumn));
    if (!edgeRow(board.rightColumn)) board.rightBoard = uniqueBoards.find(b => rowsMatch(board.rightColumn, b.leftColumn));
  }

  const topLeftBoard = uniqueBoards.find(b => edgeRow(b.topRow) && edgeRow(b.leftColumn));
  if (topLeftBoard) uniqueBoards.splice(uniqueBoards.indexOf(topLeftBoard), 1);

  const bottomLeftBoard = uniqueBoards.find(b => edgeRow(b.bottomRow) && edgeRow(b.leftColumn));
  if (bottomLeftBoard) uniqueBoards.splice(uniqueBoards.indexOf(bottomLeftBoard), 1);

  const topRightBoard = uniqueBoards.find(b => edgeRow(b.topRow) && edgeRow(b.rightColumn));
  if (topRightBoard) uniqueBoards.splice(uniqueBoards.indexOf(topRightBoard), 1);

  const bottomRightBoard = uniqueBoards.find(b => edgeRow(b.bottomRow) && edgeRow(b.rightColumn));
  if (bottomRightBoard) uniqueBoards.splice(uniqueBoards.indexOf(bottomRightBoard), 1);

  masterBoard[0][0] = topLeftBoard;
  masterBoard[0][MASTER_BOARD_WIDTH - 1] = topRightBoard;
  masterBoard[MASTER_BOARD_WIDTH - 1][0] = bottomLeftBoard;
  masterBoard[MASTER_BOARD_WIDTH - 1][MASTER_BOARD_WIDTH - 1] = bottomRightBoard;

  let startingBoard = topLeftBoard;
  let row = 0;
  let col = 0;

  while (startingBoard) {
    const last = traverseBoards(startingBoard, row, col);
    row = 0;
    col = last.lastCol;
    startingBoard = uniqueBoards.find(b => edgeRow(b.topRow));
  }

  console.log(masterBoard);
  console.log(masterBoard[MASTER_BOARD_WIDTH - 1][0]);
};

start();
