import { option as O, readerTaskEither as RTE, either as E } from 'fp-ts';
import { pipe } from 'fp-ts/function';

const foo = (data: number) => (input: string) => RTE.of(void 0);

const getOptionUndefinedCompration = (data?: number) =>
  data === undefined ? O.some(data) : O.none;
const getOptionRegularCompration = (data?: number) =>
  !data ? O.some(data) : O.none;
const getOptionFromNullable = (data?: number) => O.fromNullable(data);
const sum = (a: number) => (b: number) => RTE.of(a + b);

const testShortForm = (
  f: (data?: number) => O.None | O.Some<number>,
  data?: number
) =>
  pipe(
    RTE.of(f(data)),
    RTE.chain((r) =>
      pipe(
        r,
        O.match(() => RTE.of(0), sum(3))
      )
    )
  );

const testLongForm = (
  f: (data?: number) => O.None | O.Some<number>,
  data?: number
) =>
  pipe(
    RTE.of(f(data)),
    RTE.chain((r) =>
      pipe(
        r,
        O.match(
          () => RTE.of(0),
          (v) => sum(3)(v)
        )
      )
    )
  );
const logValue = (v: E.Either<unknown, number>, text: string) =>
  pipe(
    v,
    E.match(
      () => console.error('ERROR'),
      (data) => console.log(`${text}: ${data}`)
    )
  );

const test = async (
  text: string,
  f: (data?: number) => O.None | O.Some<number>,
  data?: number
) => {
  const long = await testLongForm(f, data)({})();
  const short = await testShortForm(f, data)({})();

  console.log(text);
  logValue(short, `Short form, ${data ? 'some data' : 'no data'}`);
  logValue(long, `Long form, ${data ? 'some data' : 'no data'}`);
};

test('getOptionUndefinedCompration', getOptionUndefinedCompration);
test('getOptionUndefinedCompration', getOptionUndefinedCompration, 2);

test('getOptionRegularCompration', getOptionRegularCompration);
test('getOptionRegularCompration', getOptionRegularCompration, 2);

test('getOptionFromNullable', getOptionFromNullable);
test('getOptionFromNullable', getOptionFromNullable, 2);
