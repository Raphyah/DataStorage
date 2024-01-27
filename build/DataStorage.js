/**
 * DataStorage - Library for easy management of dynamic properties
 * Version: 1.1
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
 * Last updated: January 27, 2024
 */
'use strict';

/**
 * the `world` instance
 * - used to set dataStorage to it
 * the `World` constructor
 * - used to check if a certain value passed is instance of it
 * the `Entity` constructor
 * - used to append data directly to it's prototype
 * - used to check if a certain value passed is instance of it
 * the `ItemStack` constructor
 * - used to check if certain properties exist on it
 * - used to append data directly to it's prototype
 * - used to check if a certain value passed is instance of it
 */
import { system, world, Entity, ItemStack } from '@minecraft/server';

const smoothLoop = (callback, map) => new Promise(resolve => {
  let iterable = map.entries();
  
  function runLoop() {
    const response = [];
    const pair = iterable.next().value;
    if (pair) {
      response.push(pair[1], pair[0]);
    }
    
    let continueLoop;
    if (response.length > 0) {
      continueLoop = callback(...response);
    } else {
      continueLoop = false;
    }
    
    if (continueLoop !== false) {
      system.run(runLoop);
    } else {
      resolve();
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
    const compressor = value?.constructor === Compressor ? value : this.#list.find(x => new RegExp(value).test(x.name));
    
    return compressor;
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
 * ObjectNotation.default = JSON5;
 */
export const ObjectNotation = (function() {
  let defaultON;
  
  const obj = {};
  
  Object.defineProperty(obj, 'default', {
    get: function() {
      return defaultON;
    },
    set: function(value) {
      if (value?.constructor !== Object) {
        throw new TypeError(`Default ObjectNotation should be of type Object, but instead ${value?.constructor.name} was found`);
      }
      if (value.parse?.constructor !== Function || value.stringify?.constructor !== Function) {
        throw new SyntaxError(`Invalid ObjectNotation was found. parse/stringify functions are missing`);
      }
      defaultON = value;
    },
  });
  
  obj.default = JSON;
  
  return obj;
})();

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
   * Deep clones a property
   * @param {*} key The key where the data is stored
   */
  clone(key) {
    try {
      return JSON.parse(JSON.stringify( this.get(key) ));
    } catch (err) {
      console.error('Failed to deep clone a property');
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
 * - DataStorage.prototype.objectNotation
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
  #saving = false;
  #forcedSave = false;
  #target;
  #compressor;
  #objectNotation;
  #safeLength;
  #loaded = false;
  /**
   * Constructs a new DataStorage instance
   * @param {World|Entity|ItemStack} target The target where the properties should be modified
   */
  constructor(target) {
    this.#target = target;
    this.compressor = Compressor.default;
    this.objectNotation = ObjectNotation.default;
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
    const compressor = Compressor.find(value);
    if ( !compressor ) {
      throw new TypeError(`No valid compressor was provided to ${this.constructor.name}.prototype.compressor`);
    }
    this.#compressor = compressor;
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
  set objectNotation(value) {
    if (value?.constructor !== Object) {
      throw new TypeError(`'DataStorage.prototype.objectNotation' should be of type Object, but instead ${value?.constructor.name} was found`);
    }
    if (value.parse?.constructor !== Function || value.stringify?.constructor !== Function) {
      throw new SyntaxError(`Invalid ObjectNotation was found. parse/stringify functions are missing`);
    }
    this.#objectNotation = value;
  }
  /**
   * Get the current object notation in use
   * @returns {Object} The object notation currently in use
   */
  get objectNotation() {
    return this.#objectNotation;
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
   * @param {Boolean} force Forces the data to be saved synchronously, and ignores any non-forced save process already ongoing
   */
  save(force = false) {
    if (!force && this.#saving || this.#forcedSave) return;
    
    if (force) {
      this.#forcedSave = true;
      for (const [key, value] of this.data.entries()) {
        const data = this.compressor.compress(this.objectNotation.stringify(value));
        this.#saveRaw(key, data);
      }
      this.#forcedSave = false;
    } else {
      this.#saving = true;
      smoothLoop((value, key) => {
        if (this.#forcedSave) return false;
        const data = this.compressor.compress(this.objectNotation.stringify(value));
        this.#saveRaw(key, data);
      }, this.data).finally(() => this.#saving = false);
    }
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
      const keys = this.target.getDynamicPropertyIds();
      
      for (const key of keys) {
        const value = this.#loadRaw(key);
        try {
          const data = this.compressor.decompress(value);
          
          this.data.set(key, this.objectNotation.parse(data));
        } catch(error) {
          console.error(error);
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

if (!world.dataStorage) {
  Object.defineProperty(world, 'dataStorage', property);
}

if (!Entity.prototype.dataStorage) {
  Object.defineProperty(Entity.prototype, 'dataStorage', property);
}

if (ItemStack.prototype.setDynamicProperty && ItemStack.prototype.getDynamicProperty && !ItemStack.prototype.dataStorage) {
  Object.defineProperty(ItemStack.prototype, 'dataStorage', property);
}
