import LichessPgnViewer from 'lichess-pgn-viewer';
import type PgnViewerLichess from 'lichess-pgn-viewer/pgnViewer';
import nullthrows from 'nullthrows';
import cgState from './cgState';
import InvisibleKing from './invisibleKing';
import makeGame, { type GameConstructor } from './makeGame';
import type { Initial } from './makeInitial';
import makePgn from './makePgn';
import Mode from './mode';

const PARAM = 'pgn';

export type PgnViewer = PgnViewerLichess & ReturnType<typeof makeExtras>;

export default function makePgnViewer(div: HTMLElement) {
  const lpv = LichessPgnViewer(div, {});
  const pgnViewer = Object.assign(lpv, makeExtras(lpv));
  pgnViewer.ground.set({
    draggable: { enabled: true },
    selectable: { enabled: true },
  });
  setupImport(pgnViewer);
  Object.assign(pgnViewer, makeChanges(pgnViewer));
  pgnViewer.setPgn(new URLSearchParams(window.location.search).get(PARAM));
}

function makeExtras(lpv: PgnViewerLichess) {
  return {
    game: makeGame(lpv.game.constructor as GameConstructor, lpv.path, '*'),
    ground: nullthrows(lpv.ground),
    mode: Mode.edit,
    curPos,
    setPgn,
  };
}

function curPos(this: PgnViewer): InvisibleKing {
  return (this.curData() as Initial).pos;
}

function setPgn(this: PgnViewer, pgn: string | null) {
  const isPlay = pgn !== null;
  this.mode = isPlay ? Mode.play : Mode.edit;
  this.opts.menu.practiceWithComputer = { enabled: isPlay };
  this.opts.menu.analysisBoard = { enabled: isPlay };
  const emptyPath = this.game.pathAtMainlinePly(0);
  if (isPlay) {
    this.game = makeGame(this.game.constructor, emptyPath, pgn);
  } else {
    this.opts.pgn = '';
    this.game.moves.children = [];
  }
  this.toPath(emptyPath);
}

function setupImport(pgnViewer: PgnViewer) {
  Object.assign(window, { importPgn });
  URL.createObjectURL = () => `javascript:${importPgn.name}()`;
  function importPgn() {
    pgnViewer.setPgn(
      nullthrows(document.querySelector<HTMLTextAreaElement>('textarea')).value,
    );
  }
}

function makeChanges(pgnViewer: PgnViewer): Partial<PgnViewer> {
  return {
    translate,
    goTo: newGoTo(pgnViewer),
    flip: flip.bind(pgnViewer),
    cgState: newCgState(pgnViewer),
    analysisUrl,
    practiceUrl,
  };
}

function translate(this: PgnViewer, key: string) {
  return {
    flipTheBoard: `${this.mode === Mode.edit ? 'start' : 'reset'} (f)`,
    analysisBoard: 'analysis board',
    practiceWithComputer: 'link',
    getPgn: 'pgn',
    download: 'import',
  }[key];
}

function newGoTo(pgnViewer: PgnViewer): PgnViewer['goTo'] {
  const { goTo } = pgnViewer;
  return (...args) => {
    if (pgnViewer.mode === Mode.play) {
      goTo(...args);
    }
  };
}

function flip(this: PgnViewer) {
  switch (this.mode) {
    case Mode.edit: {
      const fen = this.ground.getFen();
      const pos = new InvisibleKing(fen);
      if (pos.kings.isEmpty()) {
        alert(
          `Cannot place enemy king. ${
            pos.board.white.size() > 7
              ? 'Can you do it using only 7 pieces?'
              : 'Congrats!'
          }`,
        );
      } else {
        this.setPgn(`[FEN "${fen}"]`);
      }
      break;
    }
    case Mode.play:
      this.setPgn(null);
      break;
    case Mode.timer:
  }
}

function newCgState(pgnViewer: PgnViewer): PgnViewer['cgState'] {
  const oldCgState = pgnViewer.cgState;
  return () => ({ ...oldCgState(), ...cgState.bind(pgnViewer)() });
}

function analysisUrl(this: PgnViewer) {
  this.opts.pgn = makePgn(this.game, this.path);
  return `https://www.chess.com/analysis${this.practiceUrl()}`;
}

function practiceUrl(this: PgnViewer) {
  return `?${new URLSearchParams({ [PARAM]: this.opts.pgn })}`;
}
