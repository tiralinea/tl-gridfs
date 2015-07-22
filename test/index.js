'use strict';

var MongoClient = require('mongodb').MongoClient;
var expect = require('chai').expect;
var Stream = require('stream');
var crypto = require('crypto');
var mongo = require('mongodb');
var figrid = require('../');
var path = require('path');
var fs = require('fs');
var os = require('os');

var paths = {
  fixtures: path.join(__dirname, 'fixtures')
};

var files = {
  buffer: new Buffer(crypto.randomBytes(64).toString('hex')),
  image: path.join(paths.fixtures, 'image.png'),
  text: path.join(paths.fixtures, 'text.txt')
};

var mimetypes = {
  txt: 'text/plain',
  png: 'images/png',
  bin: 'binary/octet-stream'
};

var saved = [];

var server, database;

function rint(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

describe('FiGrid', function () {
  var id;

  before(function (done) {
    var url = 'mongodb://localhost:27017/fi-grid-tests';

    MongoClient.connect(url, function (err, db) {
      if (err) {
        return done(err);
      }

      database = db;

      done();
    });
  });

  describe('object', function () {
    it('should be and object', function () {
      expect(figrid).to.be.an.instanceof(Object);
    });

    it('should initialize the module and store the parameters', function () {
      figrid.init(database, mongo);

      expect(figrid.mongo).to.equal(mongo);
      expect(figrid.db).to.equal(database);
    });

    it('should return the same instance as before', function () {
      var grid = require('../');

      expect(grid).to.equal(figrid);
      expect(grid.mongo).to.equal(mongo);
      expect(grid.db).to.equal(database);
    });
  });

  describe('write', function () {
    it('should be a function', function () {
      expect(figrid.write).to.be.a('function');
    });

    it('should write a text file from a path string without options', function (done) {
      figrid.write(files.text, function (err, fsfile) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write an image file from a read stream without options', function (done) {
      var stream = fs.createReadStream(files.image);

      figrid.write(stream, function (err, fsfile) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write data from a buffer without options', function (done) {
      figrid.write(files.buffer, function (err, fsfile) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write a text file from a path string with options', function (done) {
      var filename = path.basename(files.text);
      var options = {
        filename: filename,
        content_type: mimetypes.txt
      };

      figrid.write(files.text, options, function (err, fsfile) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);
        expect(fsfile.filename).to.equal(filename);
        expect(fsfile.contentType).to.equal(mimetypes.txt);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write an image file from a read stream with options', function (done) {
      var stream = fs.createReadStream(files.image);
      var filename = path.basename(files.image);
      var options = {
        filename: filename,
        content_type: mimetypes.png
      };

      figrid.write(stream, options, function (err, fsfile) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);
        expect(fsfile.filename).to.equal(filename);
        expect(fsfile.contentType).to.equal(mimetypes.png);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write data from a buffer with options', function (done) {
      var filename = 'buffer.bin';
      var options = {
        filename: filename,
        content_type: mimetypes.bin
      };

      figrid.write(files.buffer, options, function (err, fsfile) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);
        expect(fsfile.filename).to.equal(filename);
        expect(fsfile.contentType).to.equal(mimetypes.bin);

        saved.push(fsfile._id);

        done();
      });
    });
  });

  describe('read', function () {
    it('should be a function', function () {
      expect(figrid.read).to.be.a('function');
    });

    it('should read a file from GridFS by its ID', function (done) {
      var id = saved[rint(0, saved.length - 1)];

      figrid.read(id, function (err, fsfile, read) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id.equals(id)).to.be.true;
        expect(read).to.be.an.instanceof(Stream.Readable);

        done();
      });
    });

    it('should read a file from GridFS by its file name', function (done) {
      var filename = path.basename(files.text);

      figrid.read(filename, function (err, fsfile, read) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;
        expect(fsfile).to.be.an('object');
        expect(fsfile.filename).to.equal(filename);
        expect(read).to.be.an.instanceof(Stream.Readable);

        done();
      });
    });
  });

  describe('remove', function () {
    it('should be a function', function () {
      expect(figrid.remove).to.be.a('function');
    });

    it('should remove a file from GridFS by its ID', function (done) {
      var id = saved[rint(0, saved.length - 1)];

      figrid.remove(id, function (err) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;

        done();
      });
    });

    it('should remove a file from GridFS by its file name', function (done) {
      var filename = path.basename(files.text);

      figrid.remove(filename, function (err) {
        if (err) {
          return done(err);
        }

        expect(err).to.be.null;

        done();
      });
    });
  });

  after(function (done) {
    database.dropDatabase(function () {
      database.close();
      done();
    });
  });
});
