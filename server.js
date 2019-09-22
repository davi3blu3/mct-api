const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;

const ATTENDEE_COLLECTION = 'attendees';

const app = express();
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
  function(err, client) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = client.db();
    console.log('Database connection ready');

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function() {
      var port = server.address().port;
      console.log('App now running on port', port);
    });
  }
);

// ATTENDEE API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log('ERROR: ' + reason);
  res.status(code || 500).json({ error: message });
}

/*  "/api/attendee"
 *    GET: finds all attendees
 *    POST: creates a new attendee
 */

app.get('/api/attendee', function(req, res) {
  db.collection(ATTENDEE_COLLECTION)
    .find({})
    .toArray((err, docs) => {
      if (err) {
        handleError(res, err.message, 'Failed to get contacts.');
      } else {
        res.status(200).json(docs);
      }
    });
});

app.post('/api/attendee', function(req, res) {
  const newAttendee = req.body;
  newAttendee.createDate = new Date();

  if (!req.body.name) {
    handleError(res, 'Invalid user input', 'Must provide a name.', 400);
  } else {
    db.collection(ATTENDEE_COLLECTION).insertOne(newAttendee, function(
      err,
      doc
    ) {
      if (err) {
        handleError(res, err.message, 'Failed to create new attendee.');
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
  }
});

/*  "/api/attendee/:id"
 *    GET: find attendee by id
 *    PUT: update attendee by id
 *    DELETE: deletes attendee by id
 */

app.get('/api/attendee/:id', function(req, res) {});

app.put('/api/attendee/:id', function(req, res) {});

app.delete('/api/attendee/:id', function(req, res) {});
