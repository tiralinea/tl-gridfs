'use strict';

var GridFS = require('gridfs-stream');
var Stream = require('stream');

var type = require('type-of-is');
var fs = require('fs');

var BUFFER = 0;
var STRING = 1;
var STREAM = 2;

/**
 * FiGrid constructor.
 */
function FiGrid() {
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
FiGrid.prototype.init = function init(db, mongo) {
  GridFS.mongo = mongo;

  this.mongo = mongo;
  this.db = db;
};

/**
 * Write a new file to GridFS.
 *
 * @param {Stream.Readable|Buffer|String} source The input read stream.
 * @param {Object} options Any valid gridfs-stream options.
 * @param {Function} callback The callback function.
 */
FiGrid.prototype.write = function write() {
  var callback = arguments[arguments.length - 1];
  var options = {};

  if (!type.is(callback, Function)) {
    throw new TypeError("Must provide a callback function!");
  }

  if (type.is(arguments[1], Object)) {
    options = arguments[1];
  }

  var Grid = new GridFS(this.db);
  var source = arguments[0];
  var is = null;

  if (source instanceof Stream.Readable) {
    is = STREAM;
  } else if (type.is(source, String)) {
    is = STRING;
  } else if (type.is(source, Buffer)) {
    is = BUFFER;
  } else {
    callback(new Error("Source can only be a Readable Stream, Buffer or String!"));
  }

  options.mode = options.mode || 'w';
  options.filename = options.filename || 'unnamed_file';

  var wstream = Grid.createWriteStream(options);

  wstream.on('close', function (fsfile) {
    callback(null, fsfile);
  });

  wstream.on('error', function (err) {
    callback(err);
  });

  if (is === BUFFER) {
    wstream.write(source);
    wstream.end();
  } else if (is === STRING) {
    try {
      fs.createReadStream(source).pipe(wstream);
    } catch (ex) {
      callback(ex);
    }
  } else /* if (is === SOURCE) */ {
    source.pipe(wstream);
  }
};

/**
 * Read a file from GridFS.
 *
 * @param {String} filter Either a valid ObjectID string or a filename.
 * @param {Function} callback The callback function.
 */
FiGrid.prototype.read = function read(filter, callback) {
  var Grid = new GridFS(this.db);
  var query = {};
  var _id;

  if (!type.is(callback, Function)) {
    throw new TypeError("Must provide a callback function! E.g.: function (err, fsfile, stream) {...}");
  }

  /* Check if the filter is an ObjectID, filename or something else */
  _id = Grid.tryParseObjectId(filter);

  if (_id) {
    query._id = _id;
  } else if (type.is(filter, String)) {
    query.filename = filter;
  } else {
    throw new TypeError("Invalid query filter value! Must be either a valid ObjectID or a filename.");
  }

  /* Fetch the file information if any */
  Grid.collection().findOne(query, function (err, fsfile) {
    if (err) {
      return callback(err);
    }

    if (!fsfile) {
      return callback();
    }

    /* Check if the file data exists */
    Grid.exist(query, function (err, found) {
      if (err) {
        return callback(err);
      }

      if (!found) {
        return callback();
      }

      /* Return the file information and the read stream */
      callback(null, fsfile, Grid.createReadStream(query));
    });
  });
};

/**
 * Removes a file by passing any options, at least an _id or filename
 *
 * @param {Object} options
 * @param {Function} callback
 */
FiGrid.prototype.remove = function remove(param, callback) {
  var Grid = new GridFS(this.db);
  var options = {};
  var _id;

  if (!type.is(callback, Function)) {
    throw new TypeError("Must provide a callback function!");
  }

  /* Check if the filter is an ObjectID, filename or something else */
  _id = Grid.tryParseObjectId(param);

  if (_id) {
    options._id = _id;
  } else if (type.is(param, String)) {
    options.filename = param;
  } else {
    throw new TypeError("Invalid query filter value! Must be either a valid ObjectID or a filename.");
  }

  return Grid.remove(options, callback);
};

module.exports = exports = new FiGrid();
