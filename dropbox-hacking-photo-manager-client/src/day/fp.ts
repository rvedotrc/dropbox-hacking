export type Left<T> = { tag: "left"; value: T };
export type Right<T> = { tag: "right"; value: T };
export type Either<A, B> = Left<A> | Right<B>;

export const isLeft = <A, B>(arg: Either<A, B>): arg is Left<A> =>
  arg.tag === "left";
export const isRight = <A, B>(arg: Either<A, B>): arg is Right<B> =>
  arg.tag === "right";

export const left = <A, B>(value: A): Either<A, B> => ({ tag: "left", value });
export const right = <A, B>(value: B): Either<A, B> => ({
  tag: "right",
  value,
});
