import { pipe } from 'fp-ts/function';

// let's assume we want to create API endpoint that helps to decide whether person should take umbrella when going out

// first, we need to get person's location from DB
export type LocationId = string;
export type PersonId = string;

function getLocation(_personId: PersonId): LocationId {
  return 'Moscow';
}

// then need to go to weather prediction site and get predict for today
export type WeatherPrediction = 'Sunny' | 'Rainy';
const getWeatherPrediction = (
  _date: Date,
  _location: LocationId
): WeatherPrediction => {
  const random = Math.random();
  return random > 0.5 ? 'Sunny' : 'Rainy';
};

// then we need to combine these
export interface ApiRequest {
  query: Record<string, string>;
}

export interface ApiResponse {
  send: (result: string) => unknown;
}

let shouldTakeUmbrella: any = (req: ApiRequest, res: ApiResponse): void => {
  const personId = req.query.personId;
  const userLocation = getLocation(personId);
  const today = new Date();
  const weatherPrediction = getWeatherPrediction(today, userLocation);
  if (weatherPrediction === 'Sunny') {
    res.send('No need for umbrella today!');
  } else {
    res.send('You sure should take you umbrella!');
  }
};

// now let's rewrite this as functions combination

export const today = () => new Date();
export const takeDecision = (weather: WeatherPrediction) =>
  weather === 'Sunny'
    ? 'No need for umbrella today!'
    : 'You sure should take you umbrella!';

const getWeatherPredictionCurried =
  (_date: Date) =>
  (_location: LocationId): WeatherPrediction => {
    const random = Math.random();
    return random > 0.5 ? 'Sunny' : 'Rainy';
  };

shouldTakeUmbrella = (req: ApiRequest, res: ApiResponse) => {
  takeDecision(
    getWeatherPredictionCurried(today())(getLocation(req.query.personId))
  );
};

// looks ugly a little)) let's use fp-ts pipe: it take the result of previous combination and puts into next one
const shouldTakeUmbrellaFull = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    getLocation(req.query.personId),
    (location) => getWeatherPredictionCurried(today())(location),
    (weatherPrediction) => takeDecision(weatherPrediction)
  );

// and now let's remove excessive words. shouldTakeUmbrellaFull and shouldTakeUmbrella are exactly the same
shouldTakeUmbrella = (req: ApiRequest, res: ApiResponse) =>
  pipe(
    getLocation(req.query.personId),
    getWeatherPredictionCurried(today()),
    takeDecision
  );

// so, pipe is a function that takes result of the previous line and pass it to the next line
