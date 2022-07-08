import {
  ApiRequest,
  ApiResponse,
  LocationId,
  PersonId,
  takeDecision,
  today,
  WeatherPrediction,
} from './1 - pipe';
import { Task } from 'fp-ts/Task';
import { pipe } from 'fp-ts/function';
import { task } from 'fp-ts';

/**
 * Now let's assume that values for person and for weather predictions are taken asyncroniously
 * in real life it could be DB or API call
 *  */

let shouldTakeUmbrella: any;

export const getDBRequest = (data: any): Promise<any> => Promise.resolve(data);

export const getWeatherPrediction = (date: Date) => {
  const random = Math.random();
  return random > 0.5 || date.getTime() % 2 === 0 ? 'Sunny' : 'Rainy';
};

// lets use Task: it is lasy async computation. Task<T> is equal to <T>() => Promise<T>
const getLocationTask =
  (personId: string): Task<string> =>
  () =>
    getDBRequest('Moscow ' + personId);

const getWeatherPredictionTask =
  (date: Date) =>
  (_location: LocationId): Task<WeatherPrediction> =>
  () =>
    getDBRequest(getWeatherPrediction(date));

// now we can combine them using chain:
shouldTakeUmbrella = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    task.of(req.query.personId),
    task.chain(getLocationTask),
    task.chain(getWeatherPredictionTask(today()))
  );
