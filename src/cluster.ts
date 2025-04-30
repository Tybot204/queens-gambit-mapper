import { Board, Color, RawInput } from "./types";

/* eslint-disable @typescript-eslint/no-require-imports */
const rawData = require("./dataVerified.json");
// const rawData = require("./dataUnverified.json");

// import { inspect } from "util";

enum Direction {
  TOP = "TOP",
  RIGHT = "RIGHT",
  BOTTOM = "BOTTOM",
  LEFT = "LEFT",
}

const uniqueBoards: Board[] = [];

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

const sameBoard = (color1: Color, color2: Color) => {
  if ([Color.DARK_GRAY, Color.LIGHT_GRAY].includes(color1)) {
    return [Color.DARK_GRAY, Color.LIGHT_GRAY].includes(color2);
  } else if ([Color.DARK_RED, Color.LIGHT_RED].includes(color1)) {
    return [Color.DARK_RED, Color.LIGHT_RED].includes(color2);
  }
  return false;
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
    const found = uniqueBoards.find(b => b.tjId === board.tjId);
    if (!found) {
      uniqueBoards.push(board);
    }
  }

  for (const board of uniqueBoards) {
    if (!edgeRow(board.topRow)) board.topBoard = uniqueBoards.find(b => rowsMatch(board.topRow, b.bottomRow) && sameBoard(board.color, b.color));
    if (!edgeRow(board.bottomRow)) board.bottomBoard = uniqueBoards.find(b => rowsMatch(board.bottomRow, b.topRow) && sameBoard(board.color, b.color));
    if (!edgeRow(board.leftColumn)) board.leftBoard = uniqueBoards.find(b => rowsMatch(board.leftColumn, b.rightColumn) && sameBoard(board.color, b.color));
    if (!edgeRow(board.rightColumn)) board.rightBoard = uniqueBoards.find(b => rowsMatch(board.rightColumn, b.leftColumn) && sameBoard(board.color, b.color));
  }

  // const theBoard = uniqueBoards.find(b => b.tjId === "03b71a844da90971e14acaf7ba320291");
  // console.log(theBoard);

  const clusters: { board: Board; count: number }[] = [];
  const usedBoards: number[] = [];

  const countNeighbors = (board: Board) => {
    let count = 1;
    usedBoards.push(board.frequency);
    if (board.topBoard && !usedBoards.includes(board.topBoard.frequency)) {
      count += (countNeighbors(board.topBoard));
    }
    if (board.bottomBoard && !usedBoards.includes(board.bottomBoard.frequency)) {
      count += (countNeighbors(board.bottomBoard));
    };
    if (board.leftBoard && !usedBoards.includes(board.leftBoard.frequency)) {
      count += (countNeighbors(board.leftBoard));
    };
    if (board.rightBoard && !usedBoards.includes(board.rightBoard.frequency)) {
      count += (countNeighbors(board.rightBoard));
    };
    return count;
  };

  for (const board of uniqueBoards) {
    if (usedBoards.includes(board.frequency)) {
      continue;
    }

    const currentBoard = board;
    usedBoards.push(currentBoard.frequency);

    const count = countNeighbors(currentBoard);
    if (count > 1) clusters.push({ board: currentBoard, count });
  }

  const spacedClusters: (string | undefined)[][][] = [];
  const uniqueSpaceBoards: Board[] = [];

  const traverseBoards = (spacedCluster: (string | undefined)[][], board: Board, direction: Direction, oldRow: number, oldCol: number, startingPos: { row: number; col: number }) => {
    uniqueSpaceBoards.push(board);
    let nextRow = oldRow;
    let nextCol = oldCol;

    switch (direction) {
      case Direction.TOP:
        if (nextRow === 0) {
          spacedCluster.unshift([]);
          for (let i = 0; i < spacedCluster[0].length; i += 1) {
            spacedCluster[0][i] = undefined;
          }
          startingPos.row += 1;
        } else {
          nextRow -= 1;
        }
        break;
      case Direction.BOTTOM:
        if (nextRow === spacedCluster.length - 1) {
          spacedCluster.push([]);
          for (let i = 0; i < spacedCluster[0].length; i += 1) {
            spacedCluster[spacedCluster.length - 1][i] = undefined;
          }
        }
        nextRow += 1;
        break;
      case Direction.LEFT:
        if (nextCol === 0) {
          for (const row of spacedCluster) {
            row.unshift(undefined);
          };
          startingPos.col += 1;
        } else {
          nextCol -= 1;
        }
        break;
      case Direction.RIGHT:
        if (nextCol === spacedCluster[0].length - 1) {
          for (const row of spacedCluster) {
            row.push(undefined);
          }
        }
        nextCol += 1;
        break;
      default:
        break;
    }

    spacedCluster[nextRow][nextCol] = board.tjId;

    // if (board.tjId === "7d0b1a7de93414cfb6d080ae266aa4df" || board.tjId === "8457f612b136c325e35dfdc70ce3f592") {
    //   console.log(board);
    //   console.log(direction);
    //   console.log(spacedCluster);
    // }

    if (board.topBoard && !uniqueSpaceBoards.includes(board.topBoard)) {
      // if (board.tjId === "7eb6af8fada21680e601e3787ed5f350") {
      //   console.log("GOING TOP");
      // }
      startingPos = traverseBoards(spacedCluster, board.topBoard, Direction.TOP, nextRow, nextCol, startingPos);
    }
    if (board.bottomBoard && !uniqueSpaceBoards.includes(board.bottomBoard)) {
      // if (board.tjId === "7eb6af8fada21680e601e3787ed5f350") {
      //   console.log("GOING BOTTOM");
      // }
      startingPos = traverseBoards(spacedCluster, board.bottomBoard, Direction.BOTTOM, nextRow, nextCol, startingPos);
    }
    if (board.rightBoard && !uniqueSpaceBoards.includes(board.rightBoard)) {
      // if (board.tjId === "7eb6af8fada21680e601e3787ed5f350") {
      //   console.log("GOING RIGHT");
      // }
      startingPos = traverseBoards(spacedCluster, board.rightBoard, Direction.RIGHT, nextRow, nextCol, startingPos);
    }
    if (board.leftBoard && !uniqueSpaceBoards.includes(board.leftBoard)) {
      // if (board.tjId === "7eb6af8fada21680e601e3787ed5f350") {
      //   console.log("GOING LEFT");
      // }
      startingPos = traverseBoards(spacedCluster, board.leftBoard, Direction.LEFT, nextRow, nextCol, startingPos);
    }
    return startingPos;
  };

  for (const cluster of clusters) {
    const startingBoard = cluster.board;
    const spacedCluster: (string | undefined)[][] = [[startingBoard.tjId]];
    uniqueSpaceBoards.push(startingBoard);
    // if (startingBoard.tjId === "0053ec4563fb7324591ab128c3c89949") {
    //   console.log(startingBoard);
    //   // console.log(board.rightBoard?.tjId);
    //   // console.log(direction);
    //   console.log(spacedCluster);
    // }
    let startingPos = { row: 0, col: 0 };
    if (startingBoard.topBoard) startingPos = traverseBoards(spacedCluster, startingBoard.topBoard, Direction.TOP, startingPos.row, startingPos.col, startingPos);
    // if (startingBoard.tjId === "0dd978a7631bf2d573ccbe1dd47387ef") {
    //   console.log(startingPos);
    //   // console.log(board.rightBoard?.tjId);
    //   // console.log(direction);
    //   console.log(spacedCluster);
    // }
    if (startingBoard.bottomBoard) startingPos = traverseBoards(spacedCluster, startingBoard.bottomBoard, Direction.BOTTOM, startingPos.row, startingPos.col, startingPos);
    // if (startingBoard.tjId === "0dd978a7631bf2d573ccbe1dd47387ef") {
    //   console.log(startingPos);
    //   // console.log(board.rightBoard?.tjId);
    //   // console.log(direction);
    //   console.log(spacedCluster);
    // }
    if (startingBoard.leftBoard) startingPos = traverseBoards(spacedCluster, startingBoard.leftBoard, Direction.LEFT, startingPos.row, startingPos.col, startingPos);
    if (startingBoard.rightBoard) startingPos = traverseBoards(spacedCluster, startingBoard.rightBoard, Direction.RIGHT, startingPos.row, startingPos.col, startingPos);

    spacedClusters.push(spacedCluster);
  }

  // Output nice JSON
  console.log(JSON.stringify(spacedClusters));
};

start();
