import { Either } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { either } from 'fp-ts';
/**
 * Now let's think about errors. What if database call fails?
 *  */

export const getDBRequestWithPromise = <T>(data: T): Promise<T> =>
  Math.random() > 0.2
    ? Promise.resolve(data)
    : Promise.reject(new Error('Database is down'));

// in traditional way, we could write it like this:
const dbCallWithPromise = async <T>(data: T): Promise<T | null> => {
  try {
    const test = await getDBRequestWithPromise(data);
    return test;
  } catch (error) {
    console.error('some error has happened');
    return null;
  }
};
// and then we would needed to handle this T | null up to whole call stack.

// there is a way to handle it in more convinient way - Either
// Either is a thing that can have "left" value and "right" value
// usually errors are put in "left"  and success values are put in "right"

// you can see definition of Either in documentation, in current version it is
// export interface Left<E> {
//   readonly _tag: 'Left';
//   readonly left: E;
// }
// export interface Right<A> {
//   readonly _tag: 'Right';
//   readonly right: A;
// }export declare type Either<E, A> = Left<E> | Right<A>;

// Useful: https://rlee.dev/practical-guide-to-fp-ts-part-3 - flow chart of either

const dbCall = async <T>(data: T): Promise<Either<Error, T>> => {
  try {
    const test = await getDBRequestWithPromise(data);
    return either.right(test);
  } catch (error) {
    console.error('some error has happened!');
    return either.left(error);
  }
};

const mainFull = async () =>
  pipe(
    await dbCall<string>('test'),
    (callResult) =>
      either.chain((data) => {
        console.log(
          "This will only be executed when  await dbCall('data') returned Either.right"
        );
        return either.right<Error, string>('new value');
      })(callResult),
    // this will be executed only if previous call Either.right
    (chainResult) =>
      either.map((value: string) => value.toUpperCase())(chainResult),
    (mapResult) =>
      either.match(
        (error: Error) => console.error(`error: ${error.message}`),
        // value of data will be 'NEW VALUE'
        (data: string) => console.log(data, 'success!')
      )(mapResult)
  );

// same but shorted
// notice that if we don't write everthing explicitly, we don't need to write argument types, they are calculated by fp-ts
const main = async () =>
  pipe(
    await dbCall('test'),
    either.chain((data) => {
      console.log(
        "This will only be executed when  await dbCall('data') returned Either.right"
      );
      return either.right('new value');
    }),
    // this will be executed only if previous call Either.right
    either.map((value) => value.toUpperCase()),
    either.match(
      (error) => console.error(`error: ${error.message}`),
      // value of data will be 'NEW VALUE'
      (data) => console.log(data, 'success!')
    )
  );

// so, Either is an object that represent calculation that can end in two ways
