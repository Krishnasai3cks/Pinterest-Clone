const passport = require("passport");
const auth = require("./auth.js");
const session = require("passport-session");
const GithubStrategy = require("passport-github").Strategy;
const { ObjectId } = require("mongodb");

require("dotenv").config();

module.exports = function(app, db) {
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
        db.collection("pinterest").find({ _id: new ObjectId(id) }, (err, doc) => {
            done(null, doc);
        });
    });
    passport.use(
        new GithubStrategy({
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: "http://127.0.0.1:3000/auth/github/callback",
            },
            (accessToken, refreshToken, profile, cb) => {
                db.collection("pinterest").findOneAndUpdate({ id: profile.id }, {
                        $setOnInsert: {
                            id: profile.id,
                            name: profile.displayName || "John doe",
                            photo: profile.photos[0].value || "",
                            email: Array.isArray(profile.emails) ?
                                profile.emails[0].value :
                                "No public email",
                            created_on: new Date(),
                            provider: profile.provider || "",
                        },
                        $set: {
                            last_login: new Date(),
                        },
                        $inc: {
                            login_count: 1,
                        },
                    }, { upsert: true, new: true },
                    (err, doc) => {
                        return cb(null, doc.value);
                    }
                );
            }
        )
    );
};