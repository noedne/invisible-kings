import { makeUci, type Move } from 'chessops';
import { scalachessCharPair } from 'chessops/compat';
import { makeSanAndPlay } from 'chessops/san';
import type { MoveData as MoveDataLichess } from 'lichess-pgn-viewer/interfaces';
import type { Path } from 'lichess-pgn-viewer/path';
import type InvisibleKing from './invisibleKing';
import makeInitial, { type Initial } from './makeInitial';

export type MoveData = MoveDataLichess & Initial;

export default function makeMove(
  pos: InvisibleKing,
  move: Move,
  path: Path,
): MoveData {
  const san = makeSanAndPlay(pos, move);
  return {
    ...makeInitial(pos),
    path: path.append(scalachessCharPair(move)),
    ply: (pos.fullmoves - 1) * 2 + (pos.turn === 'white' ? 0 : 1),
    move,
    san,
    uci: makeUci(move),
    startingComments: [],
    nags: [],
  };
}
