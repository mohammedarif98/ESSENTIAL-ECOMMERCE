const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const nocache = require("nocache");
const dbConnect = require("./config/dbConnect");
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");
const homeRouter = require("./routes/homeRouter");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const dotenv = require("dotenv");
dotenv.config();

dbConnect();

//parse req to body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(nocache());

app.use(cookieParser());
app.use(express.static("public"));
app.use(logger("short")); // Log requests using the 'short' format

// ----- Set up session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY, // Secret key for session encryption
    resave: false,
    saveUninitialized: false,
    cookie: {
      // maxAge: 1000*5,   // session expry  after 5 sec
      maxAge: 1000 * 60 * 60 * 24, // Session expiry time (1 day)
      httpOnly: true,
    },
  })
);

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views/home"),
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/users"),
]);

app.use("/", homeRouter);
app.use("/", userRouter);
app.use("/admin", adminRouter);

// 404 error handler
app.use(notFoundHandler);
// internal server error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`server running in port ${PORT}`);
});


























/*  -------------------- follow this format ----------------------


Your code looks mostly correct, but I noticed a few areas where improvements or corrections can be made. Here are the changes:

Importing and Initializing MongoDB Session Store: Ensure that you import and configure the MongoDB session store correctly.
Use express.json() and express.urlencoded() Instead of body-parser: Since Express 4.16.0, express.json() and express.urlencoded() are available, and there's no need to use body-parser separately.
Order of Middleware: The express.static middleware should be placed before session handling.
connect-mongodb-session Initialization: Correct the initialization of connect-mongodb-session to use it correctly.
Here's the corrected code:

javascript
Copy code
const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const nocache = require("nocache");
const dbConnect = require("./config/dbConnect");
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");
const homeRouter = require("./routes/homeRouter");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const dotenv = require("dotenv");
dotenv.config();

dbConnect();

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(nocache());

app.use(cookieParser());
app.use(express.static("public")); // Serve static files
app.use(logger("short")); // Log requests using the 'short' format

// ----- Set up session store
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

store.on('error', function(error) {
  console.error(error);
});

// ----- Set up session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY, // Secret key for session encryption
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session expiry time (1 day)
      httpOnly: true,
    },
  })
);

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views/home"),
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/users"),
]);

app.use("/", homeRouter);
app.use("/", userRouter);
app.use("/admin", adminRouter);

// 404 error handler
app.use(notFoundHandler);
// internal server error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
Summary of Changes:
Switched from body-parser to express.json() and express.urlencoded().
Initialized MongoDB session store correctly with connect-mongodb-session.
Placed static file serving middleware before session handling.
Corrected session middleware to include the session store.
These changes should ensure that your application runs correctly with proper session handling and middleware configuration.

-------------------------------------------------------------   */