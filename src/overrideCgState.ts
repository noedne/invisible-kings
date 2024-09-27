import type { Config } from 'chessground/config';
import type { DrawShape } from 'chessground/draw';
import type { Key, SquareClasses } from 'chessground/types';
import { makeSquare, parseSquare, type Move, type Square } from 'chessops';
import { chessgroundDests } from 'chessops/compat';
import { extend } from 'chessops/pgn';
import InvisibleKing from './invisibleKing';
import { Status, type PgnViewer } from './types';

export default function overrideCgState(lpv: PgnViewer): void {
  const oldCGState = lpv.cgState;
  lpv.cgState = (): Config => ({ ...oldCGState(), ...cgState.bind(lpv)() });
}

function cgState(this: PgnViewer): Config {
  const { pos } = this.curData();
  if (pos.turn === 'white') {
    return {
      lastMove: Array.from(pos.newKings, makeSquare),
      highlight: { custom: new Map() },
      animation: { enabled: false },
      movable: { dests: chessgroundDests(pos) },
      events: { move: onMove.bind(this) },
      drawable: { autoShapes: [] },
    };
  }
  const [custom, autoShapes] = makeMarks(pos);
  return {
    highlight: { custom },
    animation: { enabled: true },
    drawable: { autoShapes },
  };
}

function onMove(this: PgnViewer, orig: Key, dest: Key): void {
  const move = parseMove(orig, dest);
  if (!move) {
    return;
  }
  const moveData = this.curData().pos.clone().playAndMakeData(move, this.path);
  if (moveData.turn === 'white') {
    moveData.san = '--';
  } else if (!moveData.pos.isVariantEnd()) {
    setTimeout(moveBlack.bind(this), 1000);
  }
  if (!this.game.nodeAt(moveData.path)) {
    extend(this.curNode(), [moveData]);
  }
  this.toPath(moveData.path);
}

function moveBlack(this: PgnViewer): void {
  if (this.canGoTo('next')) {
    this.goTo('next');
  } else {
    onMove.bind(this)('a1', 'a1');
  }
  this.ground?.playPremove();
}

function makeMarks(pos: InvisibleKing): [SquareClasses, DrawShape[]] {
  let shapes: DrawShape[] = [];
  const classes = new Map<Key, string>();
  for (const king of pos.kings) {
    const { status, arrows = [] } = pos.status(king);
    shapes = shapes.concat(arrows.map(makeShape));
    switch (status) {
      case Status.check:
      case Status.mate:
        classes.set(makeSquare(king), 'check');
        break;
      case Status.stalemate:
        shapes.push(makeShape([king, king]));
        break;
      default:
    }
  }
  if (shapes.length) {
    classes.clear();
  }
  return [classes, shapes];
}

function makeShape([from, to]: [Square, Square]): DrawShape {
  return { orig: makeSquare(from), dest: makeSquare(to), brush: 'red' };
}

function parseMove(orig: Key, dest: Key): Move | undefined {
  const from = parseSquare(orig);
  const to = parseSquare(dest);
  return from === undefined || to === undefined ? undefined : { from, to };
}
