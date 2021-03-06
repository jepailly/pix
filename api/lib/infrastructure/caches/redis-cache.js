const redis = require('redis');

class RedisCache {

  constructor(redis_url) {
    this._client = redis.createClient(redis_url);
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this._client.get(key, (error, value) => {
        if (error) return reject(error);
        return resolve(JSON.parse(value));
      });
    });
  }

  set(key, object) {
    return new Promise((resolve, reject) => {
      this._client.set(key, JSON.stringify(object), (error) => {
        if (error) return reject(error);
        return resolve(object);
      });
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      this._client.del(key, (error, numberOfDeletedKeys) => {
        if (error) return reject(error);
        return resolve(numberOfDeletedKeys);
      });
    });
  }

  flushAll() {
    return new Promise((resolve, reject) => {
      this._client.flushall((error) => {
        if (error) return reject(error);
        return resolve();
      });
    });
  }
}

module.exports = RedisCache;
