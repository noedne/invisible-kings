import { Node, parsePgn, type PgnNodeData, transform } from 'chessops/pgn';
import { parseSan } from 'chessops/san';
import type { Game as GameLichess } from 'lichess-pgn-viewer/game';
import type { Path } from 'lichess-pgn-viewer/path';
import nullthrows from 'nullthrows';
import InvisibleKing from './invisibleKing';
import makeInitial, { type Initial } from './makeInitial';
import makeMove, { type MoveData } from './makeMove';

export type GameConstructor = new <
  T extends ConstructorParameters<typeof GameLichess>,
>(
  ...args: T
) => GameInterface<T[0], T[1]>;

export type Game = GameInterface<Initial, Node<MoveData>>;

interface GameInterface<
  TInitial extends GameLichess['initial'],
  TMoves extends GameLichess['moves'],
> extends GameLichess {
  constructor: GameConstructor;
  readonly initial: TInitial;
  readonly moves: TMoves;
}

export default function makeGame(
  Constructor: GameConstructor,
  emptyPath: Path,
  pgn: string,
): Game {
  const game = nullthrows(parsePgn(pgn)[0] ?? parsePgn('*')[0]);
  const pos = new InvisibleKing(game.headers.get('FEN'));
  const initial = makeInitial(pos);
  const moves = transform(game.moves, new State(pos, emptyPath), process);
  const players = {
    white: { isLichessUser: false },
    black: { isLichessUser: false },
  };
  const metadata = {
    isLichess: false,
    result: game.headers.get('Result') ?? '*',
  };
  return new Constructor(initial, moves, players, metadata);
}

function process(state: State, node: PgnNodeData): MoveData | undefined {
  const { path, pos } = state;
  const move = parseSan(pos, node.san);
  if (!move) {
    return undefined;
  }
  const moveData = makeMove(pos, move, path);
  state.path = moveData.path;
  return moveData;
}

class State {
  constructor(
    readonly pos: InvisibleKing,
    public path: Path,
  ) {}

  clone(): State {
    return new State(this.pos.clone(), this.path);
  }
}
