import type { Config } from 'chessground/config';
import type { Key, SquareClasses } from 'chessground/types';
import { makeSquare, type Square } from 'chessops';
import type PgnViewer from 'lichess-pgn-viewer/pgnViewer';
import InvisibleKing from './invisibleKing';
import Status from './status';

export default function overrideCgState(lpv: PgnViewer): void {
  const oldCGState = lpv.cgState;
  lpv.cgState = () => ({ ...oldCGState(), ...cgState.bind(lpv)() });
}

function cgState(this: PgnViewer): Config {
  const data = this.curData();
  if (!('pos' in data && data.pos instanceof InvisibleKing)) {
    return {};
  }
  const custom: SquareClasses = new Map<Key, string>();
  if (data.pos.turn === 'white') {
    return {
      lastMove: Array.from(data.pos.newKings, makeSquare),
      highlight: { custom },
      animation: { enabled: false },
      drawable: { autoShapes: [] },
    };
  }
  const shapes: [Square, Square][] = [];
  for (const king of data.pos.kings) {
    const { status, arrows = [] } = data.pos.status(king);
    shapes.push(...arrows);
    switch (status) {
      case Status.check:
      case Status.mate:
        custom.set(makeSquare(king), 'check');
        break;
      case Status.stalemate:
        shapes.push([king, king]);
        break;
      default:
    }
  }
  if (shapes.length) {
    custom.clear();
  }
  return {
    highlight: { custom },
    animation: { enabled: true },
    drawable: {
      autoShapes: shapes.map(([a, b]) => ({
        orig: makeSquare(a),
        dest: makeSquare(b),
        brush: 'red',
      })),
    },
  };
}
