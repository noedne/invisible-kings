import type { Square } from 'chessops';
import { makeBoardFen } from 'chessops/fen';
import type InvisibleKing from './invisibleKing';

export default function makeFen(
  pos: InvisibleKing,
  kings: Iterable<Square>,
): string {
  const board = pos.board.clone();
  let king = board.kingOf('black');
  if (king !== undefined) {
    board.take(king);
  }
  for (king of kings) {
    board.set(king, { role: 'king', color: 'black' });
  }
  return makeBoardFen(board);
}
