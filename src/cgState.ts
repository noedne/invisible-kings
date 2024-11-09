import type { Config } from 'chessground/config';
import type { DrawShape } from 'chessground/draw';
import type { Key, SquareClasses } from 'chessground/types';
import { makeSquare, type Move, parseSquare, type Square } from 'chessops';
import { chessgroundDests } from 'chessops/compat';
import { extend } from 'chessops/pgn';
import InvisibleKing from './invisibleKing';
import makeFen from './makeFen';
import makeMove from './makeMove';
import type { PgnViewer } from './makePgnViewer';
import Mode from './mode';
import Status from './status';

export default function cgState(this: PgnViewer): Config {
  const pos = this.curPos();
  if (this.mode === Mode.edit) {
    return {
      fen: makeFen(pos, []),
      highlight: { lastMove: false, custom: new Map() },
      animation: { enabled: false },
      movable: { free: true, color: 'both', dests: new Map() },
      draggable: { deleteOnDropOff: true },
      events: { move: () => undefined },
      drawable: { autoShapes: [] },
    };
  }
  if (pos.turn === 'white') {
    return {
      lastMove: Array.from(pos.newKings, makeSquare),
      highlight: { lastMove: true, custom: new Map() },
      animation: { enabled: false },
      movable: { free: false, color: 'white', dests: chessgroundDests(pos) },
      draggable: { deleteOnDropOff: false },
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
  const moveData = makeMove(this.curPos().clone(), move, this.path);
  const { path, pos, turn } = moveData;
  if (turn === 'white') {
    moveData.san = '--';
    const king = pos.board.kingOf('black');
    if (king !== undefined) {
      pos.board.take(king);
    }
  } else if (!pos.isVariantEnd()) {
    this.mode = Mode.timer;
    setTimeout(moveBlack.bind(this), 1000);
  }
  if (!this.game.nodeAt(path)) {
    extend(this.curNode(), [moveData]);
  }
  this.toPath(path);
}

function moveBlack(this: PgnViewer): void {
  this.mode = Mode.play;
  if (this.canGoTo('next')) {
    this.goTo('next');
  } else {
    onMove.bind(this)('a1', 'a1');
  }
  this.ground.playPremove();
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
