import LichessPgnViewer from 'lichess-pgn-viewer';
import overrideCgState from './overrideCgState';
import overwriteGame from './overwriteGame';

const div: HTMLElement | null = document.querySelector('body > div > div');
if (!div) {
  throw Error();
}
const pgn = prompt('PGN') ?? '';
const lpv = LichessPgnViewer(div, { pgn });
overrideCgState(lpv);
overwriteGame(lpv);
lpv.goTo('first');
