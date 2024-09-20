import { Result } from '@badrap/result';
import {
  type Move,
  type Outcome,
  Position,
  type PositionError,
  type Setup,
  type Square,
  SquareSet,
} from 'chessops';
import { kingAttacks } from 'chessops/attacks';
import Status from './status';

export default class InvisibleKing extends Position {
  kings = SquareSet.empty();
  newKings = SquareSet.empty();

  private constructor() {
    super('chess');
  }

  override reset() {
    super.reset();
    this.kings = SquareSet.empty();
    this.newKings = SquareSet.empty();
  }

  protected override setupUnchecked(setup: Setup) {
    super.setupUnchecked(setup);
    for (const sq of SquareSet.full().diff(this.board.white)) {
      if (this.isSafe(sq)) {
        this.kings = this.kings.with(sq);
      }
    }
  }

  static default(): InvisibleKing {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup): Result<InvisibleKing, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return Result.ok(pos);
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
    if (isMate) {
      return { winner: 'white' };
    }
    return undefined;
  }

  override toSetup() {
    const setup = super.toSetup();
    for (const king of this.kings) {
      setup.board.set(king, { role: 'king', color: 'black' });
    }
    return setup;
  }

  override isCheck() {
    return false;
  }

  override play(move: Move) {
    if (this.turn === 'white') {
      super.play(move);
      return;
    }
    let kings = SquareSet.empty();
    for (const king of this.kings) {
      kings = kings.union(this.nearbyHelper(king).safeNearby);
    }
    this.newKings = kings.diff(this.kings);
    this.kings = kings;
    super.play(move);
  }

  status(king: Square): { status: Status; arrows?: [Square, Square][] } {
    const { nearbyAttackers, safeNearby } = this.nearbyHelper(king);
    if (safeNearby.isEmpty()) {
      return this.isSafe(king)
        ? { status: Status.stalemate, arrows: nearbyAttackers }
        : { status: Status.mate };
    }
    const captures = kingAttacks(king)
      .intersect(this.board.king)
      .union(safeNearby)
      .intersect(this.board.white);
    if (captures.nonEmpty()) {
      return {
        status: Status.capture,
        arrows: Array.from(captures, (capture) => [king, capture]),
      };
    }
    return { status: this.isSafe(king) ? Status.none : Status.check };
  }

  private nearbyHelper(king: Square): {
    nearbyAttackers: [Square, Square][];
    safeNearby: SquareSet;
  } {
    const nearbyAttackers: [Square, Square][] = [];
    let safeNearby = SquareSet.empty();
    for (const nearby of kingAttacks(king)) {
      const attackers = this.whiteAttackers(nearby);
      if (attackers.isEmpty()) {
        safeNearby = safeNearby.with(nearby);
      } else {
        for (const attacker of attackers) {
          nearbyAttackers.push([attacker, nearby]);
        }
      }
    }
    return { nearbyAttackers, safeNearby };
  }

  private isSafe(square: Square): boolean {
    return this.whiteAttackers(square).isEmpty();
  }

  private whiteAttackers(square: Square): SquareSet {
    return this.kingAttackers(square, 'white', this.board.white);
  }
}
