import {
  makeUci,
  type Move,
  type Outcome,
  Position,
  type Square,
  SquareSet,
} from 'chessops';
import { kingAttacks } from 'chessops/attacks';
import { scalachessCharPair } from 'chessops/compat';
import { makeFen, parseFen } from 'chessops/fen';
import { makeSanAndPlay } from 'chessops/san';
import type { Path } from 'lichess-pgn-viewer/path';
import { Status, type Initial, type MoveData } from './types';

export default class InvisibleKing extends Position {
  kings: SquareSet;
  newKings: SquareSet;

  public constructor(fen?: string) {
    super('chess');
    if (fen === undefined) {
      this.reset();
      for (const sq of this.board.black.union(this.board.pawn)) {
        this.board.take(sq);
      }
    } else {
      this.setupUnchecked(parseFen(fen).unwrap());
    }
    this.newKings = SquareSet.empty();
    this.kings = SquareSet.empty();
    for (const sq of SquareSet.full().diff(this.board.white)) {
      if (this.isSafe(sq)) {
        this.kings = this.kings.with(sq);
      }
    }
  }

  override clone() {
    const pos = super.clone() as InvisibleKing;
    pos.kings = this.kings;
    pos.newKings = this.newKings;
    return pos;
  }

  override isVariantEnd() {
    return !!this.variantOutcome();
  }

  override variantOutcome(): Outcome | undefined {
    if (this.turn === 'white') {
      return this.halfmoves === 100 ? { winner: undefined } : undefined;
    }
    let isMate = true;
    for (const king of this.kings) {
      switch (this.status(king).status) {
        case Status.capture:
        case Status.stalemate:
          return { winner: undefined };
        case Status.mate:
          break;
        default:
          isMate = false;
      }
    }
    return isMate ? { winner: 'white' } : undefined;
  }

  override toSetup() {
    const setup = super.toSetup();
    let king = this.board.kingOf('black');
    if (king !== undefined && !this.kings.has(king)) {
      setup.board.take(king);
    }
    for (king of this.kings) {
      setup.board.set(king, { role: 'king', color: 'black' });
    }
    return setup;
  }

  toInitial(): Initial {
    return {
      fen: makeFen(this.toSetup()),
      turn: this.turn,
      check: this.isCheck(),
      comments: [],
      shapes: [],
      clocks: {},
      pos: this.clone(),
    };
  }

  override isCheck() {
    return false;
  }

  playAndMakeData(move: Move, path: Path): MoveData {
    const san = makeSanAndPlay(this, move);
    return {
      ...this.toInitial(),
      path: path.append(scalachessCharPair(move)),
      ply: (this.fullmoves - 1) * 2 + (this.turn === 'white' ? 0 : 1),
      move,
      san,
      uci: makeUci(move),
      startingComments: [],
      nags: [],
    };
  }

  override play(move: Move) {
    if (this.turn === 'black') {
      let kings = SquareSet.empty();
      for (const king of this.kings) {
        kings = kings.union(this.nearbyHelper(king).safeNearby);
      }
      this.newKings = kings.diff(this.kings);
      this.kings = kings;
    }
    super.play(move);
  }

  status(king: Square): { status: Status; arrows?: [Square, Square][] } {
    const { captures, nearbyAttackers, safeNearby } = this.nearbyHelper(king);
    if (captures.nonEmpty()) {
      return {
        status: Status.capture,
        arrows: Array.from(captures, (capture) => [king, capture]),
      };
    }
    const isCheck = !this.isSafe(king);
    const canMove = safeNearby.nonEmpty();
    switch (true) {
      case isCheck && canMove:
        return { status: Status.check };
      case isCheck && !canMove:
        return { status: Status.mate };
      case !isCheck && !canMove:
        return { status: Status.stalemate, arrows: nearbyAttackers };
      default:
        return { status: Status.none };
    }
  }

  private nearbyHelper(king: Square): {
    captures: SquareSet;
    nearbyAttackers: [Square, Square][];
    safeNearby: SquareSet;
  } {
    let captures = SquareSet.empty();
    const nearbyAttackers: [Square, Square][] = [];
    let safeNearby = SquareSet.empty();
    const whiteKing = this.board.kingOf('white');
    for (const nearby of kingAttacks(king)) {
      const attackers = this.whiteAttackers(nearby);
      if (attackers.isEmpty()) {
        safeNearby = safeNearby.with(nearby);
        if (this.board.getColor(nearby) === 'white') {
          captures = captures.with(nearby);
        }
      } else {
        for (const attacker of attackers) {
          nearbyAttackers.push([attacker, nearby]);
        }
        if (nearby === whiteKing) {
          captures = captures.with(nearby);
        }
      }
    }
    return { captures, nearbyAttackers, safeNearby };
  }

  private isSafe(square: Square): boolean {
    return this.whiteAttackers(square).isEmpty();
  }

  private whiteAttackers(square: Square): SquareSet {
    return this.kingAttackers(square, 'white', this.board.white);
  }
}
