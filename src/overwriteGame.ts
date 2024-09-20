import { makeUci, type Position } from 'chessops';
import { scalachessCharPair } from 'chessops/compat';
import { makeFen, parseFen } from 'chessops/fen';
import { parsePgn, type PgnNodeData, transform } from 'chessops/pgn';
import { makeSanAndPlay, parseSan } from 'chessops/san';
import type { Game } from 'lichess-pgn-viewer/game';
import type { Initial, MoveData } from 'lichess-pgn-viewer/interfaces';
import type { Path } from 'lichess-pgn-viewer/path';
import type PgnViewer from 'lichess-pgn-viewer/pgnViewer';
import InvisibleKing from './invisibleKing';

export default function overwriteGame(lpv: PgnViewer): void {
  const game = parsePgn(lpv.opts.pgn)[0] ?? parsePgn('*')[0];
  if (!game) {
    throw Error();
  }
  const fen = game.headers.get('FEN');
  const pos = fen
    ? parseFen(fen)
        .chain((setup) => InvisibleKing.fromSetup(setup))
        .unwrap()
    : InvisibleKing.default();
  const initial = getInitiai(pos);
  const moves = transform<PgnNodeData, MoveDataWithPosition, State>(
    game.moves,
    new State(pos, lpv.game.pathAtMainlinePly(0)),
    process,
  );
  const players = {
    white: { isLichessUser: false },
    black: { isLichessUser: false },
  };
  const metadata = { isLichess: false };
  const GameClass = lpv.game.constructor as typeof Game;
  lpv.game = new GameClass(initial, moves, players, metadata);
}

function process(
  state: State,
  node: PgnNodeData,
): MoveDataWithPosition | undefined {
  const { pos } = state;
  const move = parseSan(pos, node.san);
  if (!move) {
    return undefined;
  }
  state.path = state.path.append(scalachessCharPair(move));
  const san = makeSanAndPlay(pos, move);
  return {
    ...getInitiai(pos),
    path: state.path,
    ply: (pos.fullmoves - 1) * 2 + (pos.turn === 'white' ? 0 : 1),
    move,
    san,
    uci: makeUci(move),
    startingComments: [],
    nags: [],
  };
}

function getInitiai(pos: Position): Initial {
  return {
    fen: makeFen(pos.toSetup()),
    turn: pos.turn,
    check: pos.isCheck(),
    comments: [],
    shapes: [],
    clocks: {},
    pos: pos.clone(),
  };
}

class State {
  constructor(
    readonly pos: Position,
    public path: Path,
  ) {}

  clone(): State {
    return new State(this.pos.clone(), this.path);
  }
}

interface MoveDataWithPosition extends MoveData {
  pos: Position;
}
