'use strict';

const MongoClient = require('mongodb').MongoClient;
const expect = require('chai').expect;
const Stream = require('stream');
const crypto = require('crypto');
const mongo = require('mongodb');
const figrid = require('../');
const path = require('path');
const fs = require('fs');

const paths = {
  fixtures: path.join(__dirname, 'fixtures')
};

const files = {
  buffer: new Buffer(crypto.randomBytes(64).toString('hex')),
  image: path.join(paths.fixtures, 'image.png'),
  text: path.join(paths.fixtures, 'text.txt')
};

const mimetypes = {
  txt: 'text/plain',
  png: 'images/png',
  bin: 'binary/octet-stream'
};

const saved = [];

var database;

function rint(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

describe('FiGrid (Callbacks)', function () {
  before(function (done) {
    var url = 'mongodb://localhost:27017/fi-grid-tests';

    MongoClient.connect(url, (err, db) => {
      if (err) {
        return done(err);
      }

      database = db;

      done();
    });
  });

  describe('object', function () {
    it('should be an object', function () {
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
      figrid.write(files.text, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write an image file from a read stream without options', function (done) {
      var stream = fs.createReadStream(files.image);

      figrid.write(stream, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id).to.be.an.instanceof(mongo.ObjectID);

        saved.push(fsfile._id);

        done();
      });
    });

    it('should write data from a buffer without options', function (done) {
      figrid.write(files.buffer, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
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
        contentType: mimetypes.txt
      };

      figrid.write(files.text, options, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
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
        contentType: mimetypes.png
      };

      figrid.write(stream, options, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
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
        contentType: mimetypes.bin
      };

      figrid.write(files.buffer, options, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
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

      figrid.read(id, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
        expect(fsfile).to.be.an('object');
        expect(fsfile._id.equals(id)).to.be.true;
        expect(fsfile.stream).to.be.an.instanceof(Stream.Readable);

        done();
      });
    });

    it('should read a file from GridFS by its file name', function (done) {
      var filename = path.basename(files.text);

      figrid.read(filename, (err, fsfile) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;
        expect(fsfile).to.be.an('object');
        expect(fsfile.filename).to.equal(filename);
        expect(fsfile.stream).to.be.an.instanceof(Stream.Readable);

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

      figrid.remove(id, (err) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;

        done();
      });
    });

    it('should remove a file from GridFS by its file name', function (done) {
      var filename = path.basename(files.text);

      figrid.remove(filename, (err) => {
        if (err) {
          return done(err);
        }

        expect(err).to.not.exist;

        done();
      });
    });
  });

  after(function (done) {
    database.dropDatabase(() => {
      database.close();
      done();
    });
  });
});
