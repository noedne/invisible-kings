import type { Api } from 'chessground/api';
import LichessPgnViewer from 'lichess-pgn-viewer';
import type PgnViewerLichess from 'lichess-pgn-viewer/pgnViewer';
import nullthrows from 'nullthrows';
import cgState from './cgState';
import InvisibleKing from './invisibleKing';
import makeGame, { type Game, type GameConstructor } from './makeGame';
import type { Initial } from './makeInitial';
import makePgn from './makePgn';
import Mode from './mode';

const PARAM = 'pgn';

export interface PgnViewer extends PublicInterface<PgnViewerLichess> {
  game: Game;
  ground: Api;
  mode: Mode;
  curPos(): InvisibleKing;
  setPgn(pgn: string | null): void;
}

type PublicInterface<T> = { [K in keyof T]: T[K] };

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

function curPos(this: PgnViewer) {
  return (this.curData() as Initial).pos;
}

function setPgn(this: PgnViewer, pgn: string | null) {
  const emptyPath = this.game.pathAtMainlinePly(0);
  if (pgn === null) {
    this.mode = Mode.edit;
    this.game.moves.children = [];
  } else {
    this.mode = Mode.play;
    this.game = makeGame(this.game.constructor, emptyPath, pgn);
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

function makeChanges(pgnViewer: PgnViewer) {
  return {
    translate,
    goTo: newGoTo(pgnViewer),
    flip: flip.bind(pgnViewer),
    cgState: newCgState(pgnViewer),
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
  if (this.mode !== Mode.timer) {
    this.setPgn(
      this.mode === Mode.edit ? `[FEN "${this.ground.getFen()}"]` : null,
    );
  }
}

function newCgState(pgnViewer: PgnViewer): PgnViewer['cgState'] {
  const oldCgState = pgnViewer.cgState;
  return () => ({ ...oldCgState(), ...cgState.bind(pgnViewer)() });
}

function practiceUrl(this: PgnViewer) {
  this.opts.pgn = this.mode === Mode.play ? makePgn(this.game, this.path) : '';
  return this.opts.pgn
    ? `?${new URLSearchParams({ [PARAM]: this.opts.pgn })}`
    : '';
}
