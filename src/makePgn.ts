import { kingAttacks, makeSquare, type Square } from 'chessops';
import {
  extend,
  isChildNode,
  makeOutcome,
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
  const { king, result } = pickKing(moves, game.moves, path, game.initial);
  const fen = makeFen(game.initial.pos, [king]);
  return makePgnChessops({
    headers: new Map([
      ['FEN', fen],
      ['Result', result],
    ]),
    moves,
  });
}

function pickKing(
  pgnNode: Node<PgnNodeData>,
  gameNode: Node<MoveData>,
  path: Path,
  initialOrMove: Initial,
): { king: Square; result: string } {
  const { pos, turn } = initialOrMove;
  const whiteToMove = turn === 'white';
  if (path.empty()) {
    const { outcome, king } = pos.outcomeWithKing();
    return {
      king: (whiteToMove ? undefined : king) ?? nullthrows(pos.kings.first()),
      result: makeOutcome(outcome),
    };
  }
  const pgnChild = extend(pgnNode, [{ san: '' }]);
  if (!isChildNode(pgnChild)) {
    throw Error();
  }
  const gameChild = nullthrows(
    gameNode.children.find((c) => c.data.path.last() === path.head()),
  );
  const { king, result } = pickKing(
    pgnChild,
    gameChild,
    path.tail(),
    gameChild.data,
  );
  pgnChild.data.san = whiteToMove ? gameChild.data.san : `K${makeSquare(king)}`;
  return {
    king: whiteToMove
      ? king
      : nullthrows(pos.kings.intersect(kingAttacks(king)).first()),
    result,
  };
}
