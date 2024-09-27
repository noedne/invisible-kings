import LichessPgnViewer from 'lichess-pgn-viewer';
import overrideCgState from './overrideCgState';
import overwriteGame from './overwriteGame';
import type { PgnViewer } from './types';

const div = document.querySelector<HTMLElement>('body > div > div');
if (!div) {
  throw Error();
}
const pgn = prompt('PGN') ?? '';
const lpv = LichessPgnViewer(div, { pgn }) as PgnViewer;
lpv.ground?.set({
  movable: { color: 'white' },
  draggable: { enabled: true },
  selectable: { enabled: true },
});
overrideCgState(lpv);
overwriteGame(lpv);
lpv.goTo('first');
