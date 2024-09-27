import { parsePgn, type PgnNodeData, transform } from 'chessops/pgn';
import { parseSan } from 'chessops/san';
import type { Path } from 'lichess-pgn-viewer/path';
import InvisibleKing from './invisibleKing';
import type { MoveData, PgnViewer } from './types';

const defaultPlayers = {
  white: { isLichessUser: false },
  black: { isLichessUser: false },
};

const defaultMetadata = { isLichess: false };

export default function overwriteGame(lpv: PgnViewer): void {
  const game = parsePgn(lpv.opts.pgn)[0] ?? parsePgn('*')[0];
  if (!game) {
    throw Error();
  }
  const pos = new InvisibleKing(game.headers.get('FEN'));
  const initial = pos.toInitial();
  const moves = transform<PgnNodeData, MoveData, State>(
    game.moves,
    new State(pos, lpv.game.pathAtMainlinePly(0)),
    process,
  );
  const Game = lpv.game.constructor;
  lpv.game = new Game(initial, moves, defaultPlayers, defaultMetadata);
}

function process(state: State, node: PgnNodeData): MoveData | undefined {
  const { path, pos } = state;
  const move = parseSan(pos, node.san);
  if (!move) {
    return undefined;
  }
  const moveData = pos.playAndMakeData(move, path);
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
