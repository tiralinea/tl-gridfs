# fi-seed-component-gridfs
Fi Seed's GridFS component

This compontent uses Aaron Heckmann's [gridfs-stream](https://github.com/aheckmann/gridfs-stream) module to stream data into GridFS.

## Usage
### Use on fi-seed

```js
var grid = component('gridfs');
```

### Use on Express app

```js
var grid = require('fi-seed-component-gridfs');
```

### Initialization
You must initialize it with your current mongo instance and db connection before using it:

```js
grid.init(db, mongo);
```

If you're using mongoose, just pass mongoose's `connection.db` and `mongoose.mongo`:

```js
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/your-db-name', options);

mongoose.connection.on('error', function (err) {
  throw err;
});

mongoose.connection.once('open', function () {
  grid.init(mongoose.connection.db, mongoose.mongo);
});
```

## Writing a file
You can write from a `String` pointing to a file in a path, a `Stream.Readable` object created from the `fs` module or a `Buffer`.

You can define your source as a `String`:
```js
var source = '/path/to/the/file.ext';
```

As a `Stream.Readable`:
```js
var source = fs.createReadStream('/path/to/the/file.ext');
```

Or as a `Buffer`:
```js
var source = new Buffer('important buffer data here');
```

And then save it to GridFS with:
```js
figrid.write(source, function (err, fsfile) {
  if (err) {
    throw err;
  }

  /* Do whatever you want with your fsfile */
  console.log("The file %s named %d has a length of %d", fsfile._id, fsfile.filename, fsfile.length);
});
```

A common _fsfile_ `Object` should look like this:

```js
{
  _id: ObjectId,
  filename: String,
  contentType: String,
  length: Number,
  chunkSize: Number,
  uploadDate: Date,
  aliases: Object,
  metadata: Object,
  md5: String
}
```

## Reading a file
To read a file you must provide a `String` than can be either a valid `ObjectId` or a file name.

You can define your file as an `ObjectId`:
```js
var file = '55a52e49a562f0bb2627f38e';
```

Or as a file name:
```js
var file = 'secret_document.docx';
```

And then get access to the file with:
```js
figrid.read(file, function (err, fsfile, rs) {
  if (err) {
    throw err;
  }

  /* Now you have your fsfile object and a nice read stream */
});
```

The `rs` parameter is a `Stream.Readable` object that can be piped, written or anything that `Stream.Readable`'s can do.

## Removing a file
To remove a file you must provide a `String` than can be either a valid `ObjectId` or a file name.

You can remove the file via it's `ObjectId`:
```js
var file = '55a52e49a562f0bb2627f38e';
```

Or it's file name:
```js
var file = 'secret_document.docx';
```

And then remove the file with:
```js
figrid.remove(file, function (err) {
  if (err) {
    throw err;
  }

  /* If no error, file has been removed */
});
```
