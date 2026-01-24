/**
 * 浏览器缓存操作工具脚本
 * 支持 Chrome Extension 和普通 HTML 页面两种环境
 * 提供统一的增删改查 API
 */

const StorageUtils = (() => {
  // 检测当前运行环境
  const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const storageType = isExtension ? 'extension' : 'localStorage';

  /**
   * 获取数据
   * @param {string|string[]} keys - 要获取的键名，可以是字符串或数组
   * @param {*} defaultValue - 默认值（可选）
   * @returns {Promise<any>} 返回获取的数据
   */
  async function get(keys, defaultValue = null) {
    if (isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            // 如果是单个键，直接返回值或默认值
            if (typeof keys === 'string') {
              resolve(result[keys] !== undefined ? result[keys] : defaultValue);
            } else {
              resolve(result);
            }
          }
        });
      });
    } else {
      // localStorage 环境
      try {
        if (typeof keys === 'string') {
          const value = localStorage.getItem(keys);
          return value !== null ? JSON.parse(value) : defaultValue;
        } else if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            const value = localStorage.getItem(key);
            result[key] = value !== null ? JSON.parse(value) : undefined;
          });
          return result;
        } else {
          throw new Error('keys must be a string or array');
        }
      } catch (error) {
        throw new Error(`Failed to get data: ${error.message}`);
      }
    }
  }

  /**
   * 设置数据
   * @param {string|object} keyOrData - 键名（字符串）或键值对对象
   * @param {*} value - 值（当第一个参数为字符串时使用）
   * @returns {Promise<void>}
   */
  async function set(keyOrData, value = undefined) {
    let data;
    
    // 统一转换为对象格式
    if (typeof keyOrData === 'string') {
      data = { [keyOrData]: value };
    } else if (typeof keyOrData === 'object' && keyOrData !== null) {
      data = keyOrData;
    } else {
      throw new Error('Invalid arguments for set method');
    }

    if (isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } else {
      // localStorage 环境
      try {
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });
        return Promise.resolve();
      } catch (error) {
        throw new Error(`Failed to set data: ${error.message}`);
      }
    }
  }

  /**
   * 删除数据
   * @param {string|string[]} keys - 要删除的键名，可以是字符串或数组
   * @returns {Promise<void>}
   */
  async function remove(keys) {
    if (isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } else {
      // localStorage 环境
      try {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => {
          localStorage.removeItem(key);
        });
        return Promise.resolve();
      } catch (error) {
        throw new Error(`Failed to remove data: ${error.message}`);
      }
    }
  }

  /**
   * 清空所有数据
   * @returns {Promise<void>}
   */
  async function clear() {
    if (isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } else {
      // localStorage 环境
      try {
        localStorage.clear();
        return Promise.resolve();
      } catch (error) {
        throw new Error(`Failed to clear data: ${error.message}`);
      }
    }
  }

  /**
   * 获取所有存储的键
   * @returns {Promise<string[]>}
   */
  async function getAllKeys() {
    if (isExtension) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (items) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(Object.keys(items));
          }
        });
      });
    } else {
      // localStorage 环境
      try {
        return Promise.resolve(Object.keys(localStorage));
      } catch (error) {
        throw new Error(`Failed to get all keys: ${error.message}`);
      }
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 要检查的键名
   * @returns {Promise<boolean>}
   */
  async function has(key) {
    if (isExtension) {
      const result = await get(key);
      return result !== null && result !== undefined;
    } else {
      return Promise.resolve(localStorage.getItem(key) !== null);
    }
  }

  /**
   * 获取存储使用情况（仅 Extension 环境支持）
   * @returns {Promise<object>} 返回 { bytesInUse: number } 或 { error: string }
   */
  async function getBytesInUse(keys = null) {
    if (isExtension && chrome.storage.local.getBytesInUse) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.getBytesInUse(keys, (bytesInUse) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve({ bytesInUse });
          }
        });
      });
    } else {
      return Promise.resolve({ 
        error: 'getBytesInUse is not supported in this environment' 
      });
    }
  }

  /**
   * 更新数据（类似于 Object.assign）
   * @param {string} key - 要更新的键名
   * @param {object} updates - 要合并的更新对象
   * @returns {Promise<void>}
   */
  async function update(key, updates) {
    const existingData = await get(key);
    
    if (existingData && typeof existingData === 'object' && !Array.isArray(existingData)) {
      const updatedData = { ...existingData, ...updates };
      return set(key, updatedData);
    } else {
      throw new Error(`Cannot update: key "${key}" does not contain an object`);
    }
  }

  /**
   * 批量操作：一次性设置多个键值对
   * @param {object} data - 键值对对象
   * @returns {Promise<void>}
   */
  async function setBatch(data) {
    return set(data);
  }

  /**
   * 批量操作：一次性获取多个键的值
   * @param {string[]} keys - 键名数组
   * @returns {Promise<object>}
   */
  async function getBatch(keys) {
    return get(keys);
  }

  /**
   * 批量操作：一次性删除多个键
   * @param {string[]} keys - 键名数组
   * @returns {Promise<void>}
   */
  async function removeBatch(keys) {
    return remove(keys);
  }

  /**
   * 监听存储变化（仅 Extension 环境支持）
   * @param {function} callback - 回调函数，接收 (changes, areaName) 参数
   * @returns {function} 返回取消监听的函数
   */
  function onChanged(callback) {
    if (isExtension && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(callback);
      // 返回取消监听的函数
      return () => {
        chrome.storage.onChanged.removeListener(callback);
      };
    } else {
      // localStorage 环境可以监听 storage 事件（仅跨标签页有效）
      const handler = (event) => {
        if (event.storageArea === localStorage) {
          const changes = {
            [event.key]: {
              oldValue: event.oldValue ? JSON.parse(event.oldValue) : undefined,
              newValue: event.newValue ? JSON.parse(event.newValue) : undefined
            }
          };
          callback(changes, 'local');
        }
      };
      window.addEventListener('storage', handler);
      // 返回取消监听的函数
      return () => {
        window.removeEventListener('storage', handler);
      };
    }
  }

  /**
   * 获取当前环境信息
   * @returns {object} 返回环境信息
   */
  function getEnvironmentInfo() {
    return {
      type: storageType,
      isExtension: isExtension,
      features: {
        getBytesInUse: isExtension && !!chrome.storage.local.getBytesInUse,
        onChanged: isExtension ? !!chrome.storage.onChanged : true,
        crossTab: !isExtension // localStorage 支持跨标签页通信
      }
    };
  }

  // 导出公共 API
  return {
    get,
    set,
    remove,
    clear,
    getAllKeys,
    has,
    getBytesInUse,
    update,
    setBatch,
    getBatch,
    removeBatch,
    onChanged,
    getEnvironmentInfo
  };
})();

// 支持多种导出方式
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageUtils;
}
if (typeof window !== 'undefined') {
  window.StorageUtils = StorageUtils;
}
