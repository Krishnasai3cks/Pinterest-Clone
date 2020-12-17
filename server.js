require("dotenv").config();
const auth = require("./auth.js");
const routes = require("./routes.js");
const express = require("express");
let app = express();
let pug = require("pug");
const port = process.env.PORT || 3000;

const session = require("express-session");
const passport = require("passport");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectId = require("mongodb").ObjectID;
const http = require("http").createServer(app);
const MongoStore = require("connect-mongo")(session);
const store = new MongoStore({ url: process.env.DB });

app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
MongoClient.connect(
    process.env.DB, { useUnifiedTopology: true },
    (err, client) => {
        if (err) return console.log(err);
        let db = client.db("cluster0");
        db ? console.log("no error") : console.log("error");

        app.use(
            session({
                secret: process.env.SESSION_SECRET,
                resave: true,
                saveUninitialized: true,
                cookie: { secure: false },
                key: "connect.sid",
                store: store,
            })
        );
        app.set("view engine", "pug");

        app.use(passport.initialize());
        app.use(passport.session());

        auth(app, db);
        routes(app, db);

        http.listen(port, () => {
            console.log("listening on port", port);
        });
    }
);