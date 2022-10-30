// traverseArray
// traverseSeqArray
// nonEmptyArray - filtermap
// chunksof

// fp ts can useful utils to work with arrays

import { array, nonEmptyArray, number, option, task } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';

const a = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// you can sort it
const sort = pipe(a, array.sort(number.Ord));

// you can filter it, map it, or both at the same time, reduce it
const processEveryItemSeq = pipe(
  a,
  array.filter((el) => el < 3),
  // array now is [-1, -2, 0, 1,2]
  array.map((el) => el * el),
  // array now is [1, 4, 0, 1,4]
  // in filtermap you should return option.some if you want to keep element
  // or option.none otherwise
  array.filterMap((el) => (el > 2 ? option.some(el + 3) : option.none)),
  // array now is [7, 7]
  array.reduce(0, (acc, el) => acc + el)
  // result is 14 now
);

// most of the modules has traverse function. You can create Task of array using it

const arrOfTasks: task.Task<number>[] = a.map((a) => task.of(a)); //array of task
const taskOfArray: task.Task<readonly number[]> = pipe(
  a,
  task.traverseArray((el) => task.of(el))
); //task of array

taskOfArray()
  .then((executionResult: number[]) => {
    //do smth
  })
  .catch();

// there are many useful util functions for array
// read about them in https://gcanti.github.io/fp-ts/modules/Array.ts.html

// e.g.: partition allows you to split array on two using some condition
// before: [1,2,3,4], condition: element is even
// after: {left: [1,3], right: [2,4]}

// uniq allows you to get only unique values from array
// before: [1,1,2,3,2,1,2,3]
// after: [1,2,3]

// reverse allows you to transform [1,10,2] into [2,10,1]

// etc

//also there is a non empty array - it's useful if you want to guarantee that array that you use has at least one element

const getNonEmptyArray = (): NonEmptyArray<string> =>
  ['a'] as nonEmptyArray.NonEmptyArray<string>;
const nonEmptyArr1: NonEmptyArray<string> = getNonEmptyArray();

// e.g. you have a function that receives array of ids, goes to DB and retreives items
// you wont be 100% sure that this array is not empty to prevent db error and/or to avoid extra db call
// also it allow developers to delegate checks to compiler. If you use nonEmptyArray, you don't need to remember if you checked that array is not empty anymore. You don't need to go through code and keep track on whethere you already checked array on emptiness or not

const getItems = (arr: NonEmptyArray<string>) => {
  //call db
  return [0, 1, 2];
};

// now you can write this:
const endpointRequest = (req: { ids: string[] }, res: any) =>
  pipe(
    req.ids,
    // creates Option with some(nonEmptyArray) or none
    nonEmptyArray.fromArray,
    option.match(
      // if array is empty - return empty result immediately
      () => [] as number[],
      // if it has some values - processes them
      (ids) => getItems(ids)
    )
  );
