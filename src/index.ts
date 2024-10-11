import nullthrows from 'nullthrows';
import makePgnViewer from './makePgnViewer';

makePgnViewer(
  nullthrows(document.querySelector<HTMLElement>('body > div > div')),
);
