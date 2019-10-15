const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;

const ATTENDEE_COLLECTION = 'attendees';
const USER_COLLECTION = 'users';

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

// USER API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log('ERROR: ' + reason);
  res.status(code || 500).json({ error: message });
}

/*  "/api/user"
 *    ..."/signup" - POST: creates a new user
 *    ..."/login" - POST: validate user and return token
 *    ..."/change_pw" - POST: email validation link
 *    ..."/reset_pw" - PUT: update user password
 */

app.post('/api/user/signup', (req, res) => {
  // check if username and password both present
  if (!req.body.username || !req.body.password) {
    handleError(
      res,
      'username or password missing from req',
      'Must submit a valid username and password',
      400
    );
  } else {
    // check if username already exists
    db.collection(USER_COLLECTION).findOne(
      { username: req.body.username },
      (err, result) => {
        if (err) {
          handleError(res, err.message, 'Failed to create new user.');
        } else if (result) {
          console.log('FindOne Result:', result);
          handleError(
            res,
            'Duplicate username',
            'This username is already taken.',
            400
          );
        } else {
          // create new user and store to db
          const newUser = req.body;
          // TODO : encrypt pw
          db.collection(USER_COLLECTION).insertOne(newUser, (err, doc) => {
            if (err) {
              handleError(res, err.message, 'Failed to create new user.');
            } else {
              res.status(201).json(doc.ops[0]);
            }
          });
        }
      }
    );
  }
});

// ATTENDEE API ROUTES BELOW

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

app.get('/api/attendee/:id', function(req, res) {
  db.collection(ATTENDEE_COLLECTION).findOne(
    { _id: new ObjectID(req.params.id) },
    function(err, doc) {
      if (err) {
        handleError(res, err.message, 'Failed to get attendee');
      } else {
        res.status(200).json(doc);
      }
    }
  );
});

app.put('/api/attendee/:id', function(req, res) {
  const updateDoc = req.body;
  delete updateDoc._id;

  db.collection(ATTENDEE_COLLECTION).updateOne(
    { _id: new ObjectID(req.params.id) },
    updateDoc,
    function(err, doc) {
      if (err) {
        handleError(res, err.message, 'Failed to update attendee');
      } else {
        updateDoc._id = req.params.id;
        res.status(200).json(updateDoc);
      }
    }
  );
});

app.delete('/api/attendee/:id', function(req, res) {
  db.collection(ATTENDEE_COLLECTION).deleteOne(
    { _id: new ObjectID(req.params.id) },
    function(err, result) {
      if (err) {
        handleError(res, err.message, 'Failed to delete attendee');
      } else {
        res.status(200).json(req.params.id);
      }
    }
  );
});
