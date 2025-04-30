export interface RawInput {
  [key: string]: {
    sequence: number;
    symbols: string[][];
    fill: string;
    hasQR: boolean;
  };
}

export enum Color {
  DARK_GRAY = "darkGray",
  LIGHT_GRAY = "lightGray",
  LIGHT_RED = "lightRed",
  DARK_RED = "darkRed",
}

export interface Board {
  tjId: string;

  frequency: number;
  color: Color;

  topRow: string[];
  bottomRow: string[];

  leftColumn: string[];
  rightColumn: string[];

  centerPiece?: string;

  topBoard?: Board;
  bottomBoard?: Board;
  leftBoard?: Board;
  rightBoard?: Board;
}
