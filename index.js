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
