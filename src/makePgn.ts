import { kingAttacks, makeSquare, type Square } from 'chessops';
import {
  extend,
  isChildNode,
  makePgn as makePgnChessops,
  Node,
  type PgnNodeData,
} from 'chessops/pgn';
import type { Path } from 'lichess-pgn-viewer/path';
import nullthrows from 'nullthrows';
import makeFen from './makeFen';
import type { Game } from './makeGame';
import type { Initial } from './makeInitial';
import type { MoveData } from './makeMove';

export default function makePgn(game: Game, path: Path): string {
  const moves = new Node<PgnNodeData>();
  const king = pickKing(moves, game.moves, path, game.initial);
  const fen = makeFen(game.initial.pos, [king]);
  return makePgnChessops({ headers: new Map([['FEN', fen]]), moves });
}

function pickKing(
  pgnNode: Node<PgnNodeData>,
  gameNode: Node<MoveData>,
  path: Path,
  initialOrMove: Initial,
): Square {
  const { pos, turn } = initialOrMove;
  const whiteToMove = turn === 'white';
  if (path.empty()) {
    return nullthrows(
      (whiteToMove ? undefined : pos.outcomeWithKing().king) ??
        pos.kings.first(),
    );
  }
  const pgnChild = extend(pgnNode, [{ san: '' }]);
  if (!isChildNode(pgnChild)) {
    throw Error();
  }
  const gameChild = nullthrows(
    gameNode.children.find((c) => c.data.path.last() === path.head()),
  );
  const king = nullthrows(
    pickKing(pgnChild, gameChild, path.tail(), gameChild.data),
  );
  pgnChild.data.san = whiteToMove ? gameChild.data.san : `K${makeSquare(king)}`;
  return whiteToMove
    ? king
    : nullthrows(pos.kings.intersect(kingAttacks(king)).first());
}
