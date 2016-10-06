'use strict';

const GridFS = require('gridfs-stream');
const Stream = require('stream');
const is = require('fi-is');
const fs = require('fs');

const ERR_INVALID_SELECTOR = 'Invalid query selector! It must be either a valid ObjectID or a filename.';
const ERR_WRONG_SOURCE = 'Source can only be a Readable Stream, Buffer or String!';
const ERR_NOT_FOUND = 'Not Found!';
const ERR_NO_MATCH = 'No match!';

/**
 * FiGrid constructor.
 */
class FiGrid {
  constructor() {
    this.mongo = null;
    this.db = null;
  }

  /**
   * FiGrid initialization method.
   *
   * @param {mongo.Db} db An open mongo.Db instance.
   * @param {mongo} mongo The native driver you are using.
   * @throws {Error} If any of this arguments is invalid.
   */
  init(db, mongo) {
    GridFS.mongo = mongo;

    this.mongo = mongo;
    this.db = db;
  }

  /**
   * Write a new file to GridFS.
   *
   * @param {Stream.Readable|Buffer|String} source The input read stream.
   * @param {Object} options Any valid gridfs-stream options.
   * @param {Function} callback The callback function.
   *
   * @returns {Promise}
   */
  write() {
    /* Last argument should be a callback function */
    var callback = arguments[arguments.length - 1];

    /* Set empty object as initial options */
    var options = {};

    /* Check for callback function or behave as promise */
    if (is.not.function(callback)) {
      callback = function () {};
    }

    /* Check if options where passed */
    if (is.object(arguments[1])) {
      options = arguments[1];
    }

    var source = arguments[0];

    options.content_type = options.contentType || options.content_type || null;
    options.filename = options.filename || 'unnamed_file';
    options.mode = options.mode || 'w';

    return new Promise((resolve, reject) => {
      var ws = (new GridFS(this.db)).createWriteStream(options);

      ws.once('close', (fsfile) => {
        callback(null, fsfile);
        resolve(fsfile);
      });

      ws.once('error', (err) => {
        callback(err);
        reject(err);
      });

      if (source instanceof Stream.Readable) {
        source.pipe(ws);
      } else if (is.string(source)) {
        try {
          fs.createReadStream(source).pipe(ws);
        } catch (ex) {
          callback(ex);
          reject(err);
        }
      } else if (source instanceof Buffer) {
        ws.write(source);
        ws.end();
      } else {
        var err = new Error(ERR_WRONG_SOURCE);

        callback(err);
        reject(err);
      }
    });
  }

  /**
   * Read a file from GridFS.
   *
   * @param {String} filter Either a valid ObjectID string or a filename.
   * @param {Function} callback The callback function.
   */
  read(selector, callback) {
    /* Check for callback function */
    if (is.not.function(callback)) {
      callback = function () {};
    }

    return new Promise((resolve, reject) => {
      var grid = new GridFS(this.db);
      var query = {};
      var _id;

      /* Check if the filter is an ObjectID, filename or something else */
      _id = grid.tryParseObjectId(selector);

      if (_id) {
        query._id = _id;
      } else if (is.string(selector)) {
        query.filename = selector;
      } else {
        var err = new TypeError(ERR_INVALID_SELECTOR);

        callback(err);
        reject(err);
      }

      /* Fetch the file information if any */
      grid.collection().findOne(query, (err, fsfile) => {
        if (err) {
          callback(err);
          reject(err);

          return;
        }

        if (!fsfile) {
          err = new Error(ERR_NO_MATCH);

          callback(err);
          reject(err);

          return;
        }

        /* Check if the file data exists */
        grid.exist(query, (err, found) => {
          if (err) {
            callback(err);
            reject(err);

            return;
          }

          if (!found) {
            err = new Error(ERR_NOT_FOUND);

            callback(err);
            reject(err);

            return;
          }

          /* Return the file information and the read stream */
          fsfile.stream = grid.createReadStream(query);

          callback(null, fsfile, fsfile.stream);
          resolve(fsfile);
        });
      });
    });
  }

  /**
   * Removes a file by passing any options, at least an _id or filename
   *
   * @param {Object} options
   * @param {Function} callback
   */
  remove(param, callback) {
    /* Check for callback function */
    if (is.not.function(callback)) {
      callback = function () {};
    }

    return new Promise((resolve, reject) => {
      var options = {};
      var _id, err;

      if (is.not.string(param) && is.not.object(param)) {
        err = new Error(ERR_INVALID_SELECTOR);

        callback(err);
        reject(err);

        return;
      }

      var grid = new GridFS(this.db);

      /* Check if the filter is an ObjectID, filename or something else */
      _id = grid.tryParseObjectId(param);

      if (_id) {
        options._id = _id;
      } else if (is.string(param)) {
        options.filename = param;
      } else {
        err = new Error(ERR_INVALID_SELECTOR);

        callback(err);
        reject(err);

        return;
      }

      grid.remove(options, (err) => {
        if (err) {
          callback(err);
          reject(err);

          return;
        }

        callback();
        resolve();
      });
    });
  }
}

module.exports = exports = new FiGrid();
