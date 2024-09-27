import type { Game as GameBase } from 'lichess-pgn-viewer/game';
import type {
  InitialOrMove,
  MoveData as MoveDataBase,
} from 'lichess-pgn-viewer/interfaces';
import type PgnViewerBase from 'lichess-pgn-viewer/pgnViewer';
import type InvisibleKing from './invisibleKing';

export interface Initial extends InitialOrMove {
  pos: InvisibleKing;
}

export interface MoveData extends Initial, MoveDataBase {}

export interface PgnViewer extends PgnViewerBase {
  game: Game;
  curData(): MoveData;
}

export const enum Status {
  'capture',
  'check',
  'mate',
  'none',
  'stalemate',
}

interface Game extends GameBase {
  constructor: new (...args: ConstructorParameters<typeof GameBase>) => Game;
}
