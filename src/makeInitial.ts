import type { Initial as InitialLichess } from 'lichess-pgn-viewer/interfaces';
import type InvisibleKing from './invisibleKing';
import makeFen from './makeFen';

export type Initial = InitialLichess & { pos: InvisibleKing };

export default function makeInitial(pos: InvisibleKing): Initial {
  return {
    fen: makeFen(pos, pos.kings),
    turn: pos.turn,
    check: pos.isCheck(),
    comments: [],
    shapes: [],
    clocks: {},
    pos: pos.clone(),
  };
}
