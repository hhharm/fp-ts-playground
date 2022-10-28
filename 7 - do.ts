// do is a thing that creates empty object
// it is present in almost every module in fp-ts
// you can add fields to that object using bind

import { option, either } from 'fp-ts';
import { pipe } from 'fp-ts/function';

const optionObject = option.Do; // object is {}
const optionObjectWithField = option.bind('field', () => option.of(true))(
  optionObject
);
// now object is {field: option.of(true)}

//same can be done with other fp-ts modules
const eitherObject = either.Do;
const eitherObjectWithField = either.bind('field', () => either.right(true))(
  eitherObject
);

// this can be used in pipes if you want to save some calculation result
const echo = (arg: number): number => arg;

const objectWithManyFields = pipe(
  option.Do,
  option.bind('a', () => option.of(echo(1))),
  //while you add bind to sequence, you extend object and you can access all previously calculated values
  option.bind('b', (object) => option.of(echo(2 + object.a))),
  option.bind('c', () => option.of(echo(3))),
  option.bind('d', (object) => option.of(echo((4 * object.b) / object.c))),
  // when the object is no longer needed, you can do map, chain or any other funciton
  option.map((object) => {
    return object.a + object.b - object.c * object.d;
  })
  // after that object is not longer avaliable
);
