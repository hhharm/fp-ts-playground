import { Either } from 'fp-ts/Either';
import { Task } from 'fp-ts/Task';
import { TaskEither } from 'fp-ts/TaskEither';
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import { pipe } from 'fp-ts/function';
import { taskEither, readerTaskEither } from 'fp-ts';
import {
  ApiRequest,
  ApiResponse,
  LocationId,
  PersonId,
  today,
  WeatherPrediction,
} from './1 - pipe';
import { getWeatherPrediction } from './2 - task';
import { getDBRequestTask } from './4 - taskEither';
/**
 * Currently, result of execution of the function will be different depending on the date and db result.
 * It is great, but it makes code less testable.
 * Let's move these to dependency, so we could call the function with whatever time and db mock we want
 *  */

// lets start with defining context of the function

interface ShouldTakeUmbrellaContext {
  readonly time: Date;
  readonly getDbRequestTaskFn: <T>(data: T) => Task<T>;
}

const context: ShouldTakeUmbrellaContext = {
  time: today(),
  getDbRequestTaskFn: getDBRequestTask,
};

// we can inject this context inside taskEither and access it whenever we want
// thing that allows it is called readerTaskEither - basically, it is taskEither that has some context

let dbCall = <T>(
  data: T
): ReaderTaskEither<ShouldTakeUmbrellaContext, Error, T> =>
  pipe(
    readerTaskEither.ask<ShouldTakeUmbrellaContext>(),
    readerTaskEither.chain((env) =>
      readerTaskEither.fromTaskEither(
        taskEither.tryCatch(env.getDbRequestTaskFn(data), (error) => {
          console.error('some error has happened!', error);
          return new Error('error');
        })
      )
    )
  );

// this can be simplified, with chainTaskEitherK function, that does both chain and fromTaskEither
dbCall = <T>(data: T): ReaderTaskEither<ShouldTakeUmbrellaContext, Error, T> =>
  pipe(
    readerTaskEither.ask<ShouldTakeUmbrellaContext>(),
    readerTaskEither.chainTaskEitherK((env) =>
      taskEither.tryCatch(env.getDbRequestTaskFn(data), (error) => {
        console.error('some error has happened!', error);
        return new Error('error');
      })
    )
  );

export const getLocationTask = (
  personId: string
): ReaderTaskEither<ShouldTakeUmbrellaContext, Error, string> =>
  dbCall('Moscow ' + personId);

export const getWeatherPredictionTask =
  // note - it is deleted now:
  // (date: Date) =>
  // and date is now taken from context
  (
    _location: LocationId
  ): ReaderTaskEither<ShouldTakeUmbrellaContext, Error, WeatherPrediction> =>
    pipe(
      readerTaskEither.ask<ShouldTakeUmbrellaContext>(),
      readerTaskEither.chain((env) => dbCall(getWeatherPrediction(env.time)))
    );

// without context creation
const shouldTakeUmbrellaFn = (personId: PersonId) =>
  pipe(
    readerTaskEither.of(personId),
    readerTaskEither.chain(getLocationTask),
    readerTaskEither.chain(getWeatherPredictionTask),
    readerTaskEither.orElse((error) => {
      // if error happens inside any step of the chain, execution will go right here
      console.log(error, 'error happened during request processing');
      return readerTaskEither.left({ code: 500, message: 'error!' });
    })
  );

// with context creation
const shouldTakeUmbrella = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    shouldTakeUmbrellaFn(req.query.personId)({
      time: today(),
      getDbRequestTaskFn: getDBRequestTask,
    }),
    taskEither.match(
      (error) =>
        res.send(`Failed with code ${error.code} and message ${error.message}`),
      (success) => res.send(`Success! Code 200, result ${success}`)
    )
  );

// now we can test function as we want, e.g. we can pass fixed time and db mock:

const shouldTakeUmbrellaFailureTest = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    shouldTakeUmbrellaFn(req.query.personId)({
      time: new Date('2022-12-12'),
      getDbRequestTaskFn: (data: unknown) => () => Promise.reject(),
    }),
    taskEither.match(
      () => console.log('Test succseeded, fails when db rejects'),
      () =>
        console.error(
          'Test failes - in success branch even if DB is anavailable'
        )
    )
  );
