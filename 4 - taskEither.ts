import { Either } from 'fp-ts/Either';
import { Task } from 'fp-ts/Task';
import { TaskEither } from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { either, taskEither } from 'fp-ts';
import {
  ApiRequest,
  ApiResponse,
  LocationId,
  today,
  WeatherPrediction,
} from './1 - pipe';
import { getWeatherPrediction } from './2 - task';

/**
 * So, lets combine either and task either!
 *  */
export const getDBRequestTask =
  <T>(data: T): Task<T> =>
  () =>
    Math.random() > 0.2
      ? Promise.resolve(data)
      : Promise.reject(new Error('Database is down'));

const dbCall = <T>(data: T): TaskEither<Error, T> =>
  pipe(
    taskEither.tryCatch(getDBRequestTask(data), (error) => {
      console.error('some error has happened!', error);
      return new Error('error');
    })
  );

export const getLocationTask = (personId: string): TaskEither<Error, string> =>
  dbCall('Moscow ' + personId);

export const getWeatherPredictionTask =
  (date: Date) =>
  (_location: LocationId): TaskEither<Error, WeatherPrediction> =>
    dbCall(getWeatherPrediction(date));

const shouldTakeUmbrellaFull = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    taskEither.of(req.query.personId),
    (idTE) => taskEither.chain(getLocationTask)(idTE),
    (locationTE) =>
      taskEither.chain(getWeatherPredictionTask(today()))(locationTE),
    (predictionTE) =>
      taskEither.orElse((error) => {
        // if error happens inside any step of the chain, execution will go right here
        console.log(error, 'error happened during request processing');
        return taskEither.right(void 0);
      })(predictionTE)
  );

// or shorter:
const shouldTakeUmbrella = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    taskEither.of(req.query.personId),
    taskEither.chain(getLocationTask),
    taskEither.chain(getWeatherPredictionTask(today())),
    taskEither.orElse((error) => {
      // if error happens inside any step of the chain, execution will go right here
      console.log(error, 'error happened during request processing');
      return taskEither.right(void 0);
    })
  );

// so, TaskEither is a combination of Task and Either. This is lazy async computation that can go in two ways
