# DataStorage

Minecraft data storage that uses custom Map (`ClonableMap`) and dynamic properties to avoid constant modifications to the database.

## Installation

Download the production or development build and import it to your project like this:

```js
import 'DataStorage'; // this will only add a new property to world, Entity.prototype and ItemStack.prototype (if dynamic properties are present in ItemStack)
```

or

```js
import { DataStorage, Compressor, ObjectNotation } from 'DataStorage';
```

## Usage

DataStorage will be created for entities (including players), world and items by default, so there is no need to construct a `new DataStorage()` manually.

```js
import 'DataStorage';

world.beforeEvents.playerLeave.subscribe(evt => {
  const { player } = evt;

  player.dataStorage.save(); // save all the data from the map
});

world.beforeEvents.itemUse.subscribe(evt => {
  const { source, itemStack } = evt;

  if (source?.typeId === 'minecraft:player') {
    const data = source.dataStorage.load().clone('item_use_history') || []; // clone this map, and if it's undefined create a new empty array
    if (itemStack) data.push(itemStack.typeId);
    source.dataStorage.data.set('item_use_history', data); // set the data to the ClonableMap
  }
});
```

## Usage of compressors

All data will be converted to `JSON` when saving, that's why DataStorage also offers a Compressor class that allows for data to be compressed before saving.

```js
import { Compressor } from 'DataStorage';

// using lz-string as an example
import LZString from 'lz-string';
const LZ_STRING = new Compressor('lz-string'); // name is required for easy identification of the compressor and can not be modified
LZ_STRING.compressMethod = function(data) { // this is how compression should be handled
  return LZString.compress(data);
}
LZ_STRING.decompressMethod = function(data) { // this is how decompression should be handled
  return LZString.decompress(data);
}
Compressor.default = LZ_STRING;
```

## Usage of ObjectNotation

By default, all data saved will be converted to `JSON` before actually setting the properties. If you want to use anything other than JSON, you can do as follow:

```js
import { ObjectNotation } from 'DataStorage';

import JSON5 from 'JSON5';
ObjectNotation.default = JSON5;
```
