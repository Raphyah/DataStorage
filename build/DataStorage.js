/**
 * DataStorage - Library for easy management of dynamic properties
 * Version: 1.3
 * Author: Raphyah
 * License: GNU General Public License version 3
 * GitHub: https://www.github.com/Raphyah
 *
 * Description:
 * This library should allow easy definition and retrieval of data to dynamic properties.
 * Instead of assigning the values directly to the dynamic properties, it should first store the data to a custom Map object called CloneableMap.
 *
 * Examples can be found on my GitHub.
 *
 * Release date: January 25, 2024
 * Last updated: February 28, 2024
 */
'use strict';

/**
 * the `World` constructor
 * - used to set dataStorage to it
 * - used to check if a certain value passed is instance of it
 * the `Entity` constructor
 * - used to append data directly to it's prototype
 * - used to check if a certain value passed is instance of it
 * the `ItemStack` constructor
 * - used to check if certain properties exist on it
 * - used to append data directly to it's prototype
 * - used to check if a certain value passed is instance of it
 */
import { system, World, Entity, ItemStack } from '@minecraft/server';

function BreakLoop (reason, status) {
  this.reason = reason;
  this.exitStatus = status;
}

const smoothLoop = (callback, map) => new Promise(resolve => {
  let iterable = map.entries();

  let lastReturned;

  function runLoop() {
    const PAIR = iterable.next().value;

    if (PAIR) {
      lastReturned = callback(PAIR[1], PAIR[0]);
    } else {
      lastReturned = new BreakLoop('Iteration finished', 0);
    }

    if (lastReturned && lastReturned.constructor !== BreakLoop) {
      system.run(runLoop);
    } else {
      resolve(lastReturned);
    }
  }

  system.run(runLoop);
});

/**
 * Constructor used to define compressors
 *
 * [Static properties]
 * - Compressor.default
 *   - Set or get default compressor
 *
 * [Static methods]
 * - Compressor.add(compressor)
 *   - Add a new compressor to the list
 * - Compressor.find(value = this.default)
 *   - Tries to find a compressor in the list
 *   - Will return `value` if it's a Compressor instance
 *
 * [Instance properties]
 * - Compressor.prototype.name (read-only)
 *   - Returns the name of this compressor
 * - Compressor.prototype.compressMethod (write-only)
 *   - Sets a function of how data should be compressed
 * - Compressor.prototype.decompressMethod (write-only)
 *   - Sets a function of how data should be decompressed
 *
 * [Instance methods]
 * - Compressor.prototype.compress(data)
 *   - Compress and returns the result based on your compress method
 * - Compressor.prototype.decompress(data)
 *   - Decompress and returns the result based on your decompress method
 */
export class Compressor {
  static #list = [];

  #name;
  #compress;
  #decompress;
  /**
   * Constructs a new Compressor instance
   * @param {String} compressorName The name of the compressor. This value can not be changed after defined
   */
  constructor(compressorName) {
    if (compressorName?.constructor !== String) {
      throw new TypeError(`Compressor compressorName should be of type String, but instead ${compressorName?.constructor.name} was found`);
    }
    this.#name = compressorName;
    this.compressMethod = function(data) {
      return data;
    }
    this.decompressMethod = function(data) {
      return data;
    }
    Compressor.add(this);
  }
  /**
   * Getter for compressor name
   * @returns {String} The defined name of this Compressor when created
   */
  get name() {
    return this.#name;
  }
  /**
   * Setter for compression method
   * @param {Function} value The function that tells how the compression should be done
   */
  set compressMethod(value) {
    this.#compress = value;
  }
  /**
   * Setter for decompression method
   * @param {Function} value The function that tells how the decompression should be done
   */
  set decompressMethod(value) {
    this.#decompress = value;
  }
  /**
   * Compress the data
   * @param {*} data The data to be compressed
   * @returns {*} The compressed data
   */
  compress(data) { return this.#compress(data) }
  /**
   * Decompress the data
   * @param {*} data The data to be decompressed
   * @returns {*} The decompressed data
   */
  decompress(data) { return this.#decompress(data) }

  /**
   * Adds a compressor to the list
   * @param {Compressor} compressor The compressor to be added
   * @returns {Boolean} The success status of this operation
   */
  static add(compressor) {
    if (compressor.constructor !== Compressor) {
      throw new TypeError(`Trying to add invalid compressor to Compressor.add(compressor)`);
    }
    if (this.#list.includes(compressor)) {
      console.warn(`Compressor with name ${compressor.name} was not added due to already existing inside the list`);
      return false;
    }
    if (this.find(compressor.name)) {
      console.warn(`Compressor with name ${compressor.name} could not be added to the list due to the name being already in use`);
      return false;
    }
    this.#list.push(compressor);
    return true;
  }
  /**
   * Find a compressor in the list
   * @param {Compressor|String} value A Compressor instance or the name set to a Constructor
   * @returns {Compressor} The found compressor
   */
  static find(value = this.default) {
    const COMPRESSOR = value?.constructor === Compressor ? value : this.#list.find(x => new RegExp(value).test(x.name));

    return COMPRESSOR;
  }

  /**
   * The default compressor to be used
   */
  static #default;

  /**
   * Sets the default compressor to be used
   * @param {Compressor} value The compressor to be used
   */
  static set default(value) {
    if (value.constructor !== Compressor) {
      throw new TypeError(`Invalid compressor was set to Compressor.default`);
    }
    this.#default = value;
  }
  /**
   * Gets the default compressor
   * @returns {Compressor} The default compressor set
   */
  static get default() {
    return this.#default;
  }
}

// Creates a new compressor for uncompressed data and set it as default
const NO_COMPRESSION = new Compressor('none');
Compressor.default = NO_COMPRESSION;

/**
 * Used to set custom object notation libraries with DataStorage.
 * Default is JSON.
 *
 * Example:
 * NotationHandler.default = JSON5;
 */
export class NotationHandler {
  static #list = [];
  #name;
  #parse;
  #stringify;
  constructor(notationName) {
    if (notationName?.constructor !== String) {
      throw new TypeError(`The 'notationName' parameter of 'NotationHandler' should be of type String, but instead ${notationName?.constructor.name} was found`);
    }
    this.#name = notationName;
    this.parseMethod = function(data) {
      return data;
    }
    this.stringifyMethod = function(data) {
      return data;
    }
  }

  get name() {
    return this.#name;
  }

  set parseMethod(value) {
    this.#parse = value;
  }

  set stringifyMethod(value) {
    this.#stringify = value;
  }

  parse(...args) {
    return this.#parse(...args);
  }

  stringify(...args) {
    return this.#stringify(...args);
  }

  static add(notationHandler) {
    if (notationHandler.constructor !== Compressor) {
      throw new TypeError(`Trying to add invalid notation handler to Compressor.add(compressor)`);
    }
    if (this.#list.includes(notationHandler)) {
      console.warn(`NotationHandler with name ${compressor.name} was not added due to already existing inside the list`);
      return false;
    }
    if (this.find(notationHandler.name)) {
      console.warn(`NotationHandler with name ${compressor.name} could not be added to the list due to the name being already in use`);
      return false;
    }
    this.#list.push(notationHandler);
    return true;
  }

  static find(value = this.default) {
    const NOTATION_HANDLER = value?.constructor === NotationHandler ? value : this.#list.find(x => value === x.name);

    return NOTATION_HANDLER;
  }

  static #default;

  static set default(value) {
    if (value.constructor !== NotationHandler) {
      throw new TypeError(`Invalid notation handler was set as default`);
    }
    this.#default = value;
  }
  static get default() {
    return this.#default;
  }
}

const JSON_NOTATION = new NotationHandler('json');
JSON_NOTATION.parseMethod = JSON.parse;
JSON_NOTATION.stringifyMethod = JSON.stringify;
NotationHandler.default = JSON_NOTATION;

// The default safe length of a single property
const DEFAULT_SAFE_LENGTH = 500;

/**
 * Constructor that extends the in-built Map
 *
 * [Static properties]
 * - All properties from Map
 *
 * [Static methods]
 * - All methods from Map
 *
 * [Instance properties]
 * - All properties from Map.prototype
 *
 * [Instance methods]
 * - All methods from Map.prototype
 * - CloneableMap.prototype.clone(key)
 *   - Clones the value of a key
 */
class CloneableMap extends Map {
  /**
   * Deep clones the value associated with the specified key in the map.
   * @param {*} key - The key of the value to be cloned.
   * @returns {*} - The cloned value, or undefined if the key does not exist in the map.
   */
  clone(key) {
    const VALUE = this.get(key);
    if (VALUE) {
      return JSON.parse(JSON.stringify( VALUE ));
    }
  }
}

/**
 * Class for managing data storage and retrieval with optional compression and object notation definition.
 *
 * [Instance properties]
 * - DataStorage.prototype.target (read-only)
 *   - Gets the target of this DataStorage instance
 * - DataStorage.prototype.compressor
 *   - Get or set the compressor to be used
 * - DataStorage.prototype.notationHandler
 *   - Get or set the object notation to be used
 * - DataStorage.prototype.safeLength
 *   - Get or set the safe length of how many characters can be stored
 * [Instance methods]
 * - DataStorage.prototype.save()
 *   - Saves data to dynamic properties
 * - DataStorage.prototype.load()
 *   - Loads data from dynamic properties
 * - DataStorage.prototype.remove(key)
 *   - Removes data from a dynamic property
 * - DataStorage.prototype.clear()
 *   - Clears all dynamic properties
 * - DataStorage.prototype.length(key)
 *   - Get the length of a dynamic property
 * - DataStorage.prototype.totalSize()
 *   - Get the total size in bytes of dynamic properties
 */
export class DataStorage {
  #asynchronousSave = false;
  #synchronousSave = false;
  #target;
  #compressor;
  #notationHandler;
  #safeLength;
  #loaded = false;
  /**
   * Constructs a new DataStorage instance
   * @param {World|Entity|ItemStack} target The target where the properties should be modified
   */
  constructor(target) {
    if (!target.setDynamicProperty || !target.getDynamicProperty) {
      throw new TypeError(`DataStorage's target must have support for dynamic properties, but ${target.constructor.name} doesn't provide said support`);
    }
    this.#target = target;
    this.compressor = Compressor.default;
    this.notationHandler = NotationHandler.default;
    this.safeLength = DEFAULT_SAFE_LENGTH;
    Object.defineProperty(this, 'data', {
      value: new CloneableMap(),
    });
  }

  /**
   * Gets the target where the properties are being written/read
   * @returns {World|Entity|ItemStack} The target of the interactions
   */
  get target() {
    return this.#target;
  }

  /**
   * Sets a compressor to compress the data
   * @param {Compressor|String} value The compressor to be used
   */
  set compressor(value) {
    const COMPRESSOR = Compressor.find(value);
    if ( !COMPRESSOR ) {
      throw new TypeError(`No valid compressor was provided to 'DataStorage.prototype.compressor'`);
    }
    this.#compressor = COMPRESSOR;
  }
  /**
   * Get the current compressor in use
   * @returns {Compressor} The compressor currently in use
   */
  get compressor() {
    return this.#compressor;
  }

  /**
   * Sets an object notation to parse and stringify data
   * @param {Object} value The object notation object
   */
  set notationHandler(value) {
    const NOTATION_HANDLER = NotationHandler.find(value);
    if ( !NOTATION_HANDLER ) {
      throw new TypeError(`No valid notation handler was provided to 'DataStorage.prototype.notationHandler(value)'`);
    }
    this.#notationHandler = NOTATION_HANDLER;
  }
  /**
   * Get the current object notation in use
   * @returns {Object} The object notation currently in use
   */
  get notationHandler() {
    return this.#notationHandler;
  }

  /**
   * Sets the safe length that can be stored to dynamic properties
   * @param {Number} value The safe length of dynamic properties
   */
  set safeLength(value) {
    if (value?.constructor !== Number) {
      throw new TypeError(`${this.constructor.name}.prototype.safeLength should be of type Number, but instead ${value?.constructor.name} was found`);
    }
    this.#safeLength = value;
  }
  /**
   * Get the safe length of dynamic properties data
   * @returns {Number} The safe length of dynamic properties
   */
  get safeLength() {
    return this.#safeLength;
  }

  /**
   * Saves data from ClonableMap to dynamic properties
   */
  save() {
    if (this.#synchronousSave) return;

    this.#synchronousSave = true;
    for (const [KEY, VALUE] of this.data.entries()) {
      try {
        const DATA = this.compressor.compress(this.notationHandler.stringify(VALUE));
        this.#saveRaw(KEY, DATA);
      } catch (err) {
        console.error(err);
      }
    }
    this.#synchronousSave = false;
  }

  /**
   * Saves data from ClonableMap to dynamic properties asynchronously
   */
  saveAsync() {
    this.#asynchronousSave = true;
    smoothLoop((value, key) => {
      if (this.#synchronousSave) return new BreakLoop('Synchronous save process started', 2);
      const DATA = this.compressor.compress(this.notationHandler.stringify(value));
      this.#saveRaw(key, DATA);
    }, this.data)
      .catch(console.error)
      .finally(() => this.#asynchronousSave = false);
  }
  /**
   * Saves raw data to dynamic property
   * @param {String} key The key where the data should be assigned to
   * @param {String} value The value to assign to this property
   */
  #saveRaw(key, value) {
    try {
      if (value.length <= this.safeLength) {
        this.target.setDynamicProperty(key, value);
      } else {
        console.error('Data could not be assigned due to exceeding the safe limit defined');
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Loads all data to ClonableMap
   * @returns {ClonableMap} The ClonableMap assigned to this instance
   */
  load() {
    if (!this.#loaded) {
      const KEYS = this.target.getDynamicPropertyIds();

      for (let index = 0; index < KEYS.length; index++) {
        const KEY = KEYS[index];
        const VALUE = this.#loadRaw(KEY);
        try {
          const DATA = this.compressor.decompress(VALUE);

          this.data.set(KEY, this.notationHandler.parse(DATA));
        } catch(error) {
          console.error(error.stack);
        }
      }

      this.#loaded = true;
    }
    return this.data;
  }
  /**
   * Loads raw data from dynamic property
   * @param {String} key The key where the data is stored
   * @returns {String} The value inside the dynamic property
   */
  #loadRaw(key) {
    return this.target.getDynamicProperty(key);
  }

  /**
   * Removes data from a dynamic property and also from the ClonableMap
   * @param {String} key The key where the data should be deleted from
   * @returns {Boolean} The success status of this operation
   */
  remove(key) {
    if (this.data.has(key)) {
      this.data.delete(key);
      this.target.setDynamicProperty(key, null);
      return true;
    }
    return false;
  }

  /**
   * Clear all data from dynamic properties and ClonableMap
   */
  clear() {
    this.data.clear();
    this.target.clearDynamicProperties();
  }

  /**
   * Get the length of the string assigned to key
   * @param {String} key The key where to check the length
   * @returns {Number} A number with the size of the String assigned to the property
   */
  length(key) {
    return this.#loadRaw(key)?.length || 0;
  }

  /**
   * Get the total size of dynamic properties
   * @returns {Number} The total size of all dynamic properties combined
   */
  totalSize() {
    return this.target.getDynamicPropertyTotalByteCount();
  }
}

// Assign properties to world, Entity.prototype and ItemStack.prototype

const property = {
  get: function() {
    if (!this.__dataStorage__) {
      this.__dataStorage__ = new DataStorage(this);
    }
    return this.__dataStorage__;
  },
}

if (!World.prototype.dataStorage) {
  Object.defineProperty(World.prototype, 'dataStorage', property);
}

if (!Entity.prototype.dataStorage) {
  Object.defineProperty(Entity.prototype, 'dataStorage', property);
}

if (ItemStack.prototype.setDynamicProperty && ItemStack.prototype.getDynamicProperty && !ItemStack.prototype.dataStorage) {
  Object.defineProperty(ItemStack.prototype, 'dataStorage', property);
}
