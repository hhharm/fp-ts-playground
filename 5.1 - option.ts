// Option is another useful thing from fp-ts
// it represent something that can be missing or present

// in fp-ts implementation is looks much alike to Either
// the different is that Either saves two values, and Option save only one value
// export interface None {
//   readonly _tag: 'None'
// }
// export interface Some<A> {
//   readonly _tag: 'Some'
//   readonly value: A
// }
// export declare type Option<A> = None | Some<A>

// it's better to see some example

import { option } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';

// imaging you want to check that some item exist in your DB

// in usual way it can be written like this:
type Person = { id: string; name: string; parentId: string };
const people: Person[] = [
  { id: '1', name: 'Sasha', parentId: '2' },
  { id: '2', name: 'Dasha', parentId: '4' },
  { id: '3', name: 'Pasha', parentId: '2' },
  { id: '4', name: 'Tasha', parentId: '5' },
];
const getItem = (id: string): Person | null => {
  const person = people.find((o) => o.id === id);
  return person ?? null;
};

// and there'll be function that use it
const getPersonName = (id: string): string => {
  const person = getItem(id);
  if (person === null) {
    return person.name;
  }
  return 'Unknown';
};

// in fp-ts way it can be written like this
const getItemFpFull = (id: string): option.Option<Person> => {
  const person = people.find((o) => o.id === id);
  return person === undefined ? option.none : option.some(person);
};

// or, using option pipe and option generator
// option.fromNullable takes argument and return option.some if argument is defined
// and option.none otherwise
const getItemFp = (id: string): option.Option<Person> =>
  option.fromNullable(people.find((o) => o.id === id));

// and after that it can be used in function

// and there'll be function that use it
const getPersonNameFpFull = (id: string): string =>
  pipe(getItemFp(id), (itemOption: option.Option<Person>) =>
    option.match(
      () => 'Unknown',
      (p: Person) => p.name
    )(itemOption)
  );

//or shorter
const getPersonNameFp = (id: string): string =>
  pipe(
    getItemFp(id),
    option.match(
      // function that will be run if option is None
      () => 'Unknown',
      // function that will be run if option is Some
      (p) => p.name
    )
  );

// same as Either, option can be chained and mapped, and other standart fp-ts operations
// see more in documentation https://gcanti.github.io/fp-ts/modules/Option.ts.html

const getPersonGrandParent = (id: string): option.Option<string> =>
  pipe(
    getItemFp(id),
    option.chain((person) => getItemFp(person.parentId)),
    option.chain((person) => getItemFp(person.parentId)),
    option.map((grandParent) => `Person grandparent is ${grandParent.name}`)
  );
