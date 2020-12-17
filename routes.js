const passport = require("passport");
const ObjectId = require("mongodb").ObjectID;
let name = "";
module.exports = function(app, db) {
    const ensureAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect("/");
    };
    app.route("/").get((req, res) => {
        db.collection("pinterestpictures")
            .find({})
            .toArray((err, results) => {
                if (err) throw err;
                let response = [];
                results.forEach((data) => {
                    response.push([
                        data.desc,
                        data.urllink,
                        data._id,
                        data.stars,
                        data.creator,
                        data.creatorPhoto,
                    ]);
                });
                res.render("index", {
                    name: req.session.username,
                    arrayResponse: response,
                    user_id: req.session.user_id,
                });
            });
    });
    app.route("/newpic").post((req, res) => {
        let { urllink, desc } = req.body;
        let data = {
            creator: req.session.user_id,
            urllink,
            desc,
            stars: [],
            creatorPhoto: req.session.photo,
        };
        console.log(req.session.photo);
        db.collection("pinterestpictures").insertOne(data, (err, data) => {
            if (err) console.log("cannot insert");
            else res.redirect("/");
        });
    });
    app.route("/mypics").get((req, res) => {
        db.collection("pinterestpictures")
            .find({ creator: req.session.user_id })
            .toArray((err, results) => {
                let response = [];
                results.forEach((data) => {
                    response.push([
                        data.desc,
                        data.urllink,
                        data._id,
                        data.stars,
                        data.creator,
                        data.creatorPhoto,
                    ]);
                });
                res.render("index", {
                    name: req.session.username,
                    arrayResponse: response,
                    user_id: req.session.user_id,
                });
            });
    });
    app.get("/delete", (req, res) => {
        let { id } = req.query;
        db.collection("pinterestpictures").findOneAndDelete({ _id: new ObjectId(id) },
            (err, data) => {
                if (err) console.log("couldn't delete");
                else console.log(id, " deleted successfully");
                res.redirect("/");
            }
        );
    });
    app.get("/star", (req, res) => {
        let { id, liker } = req.query;
        db.collection("pinterestpictures").findOneAndUpdate({ _id: new ObjectId(id) }, { $addToSet: { stars: liker } }, { upsert: true },
            (err, doc) => {
                if (err) {
                    throw err;
                } else {
                    console.log(id + "starred by:", liker);
                }
            }
        );
        res.redirect("/");
    });
    app.get("/unstar", (req, res) => {
        let { id, unliker } = req.query;
        db.collection("pinterestpictures").findOneAndUpdate({ _id: new ObjectId(id) }, { $pull: { stars: unliker } }, { upsert: true },
            (err, doc) => {
                if (err) {
                    throw err;
                } else {
                    console.log(id + "unstarred by:", unliker);
                }
            }
        );
        res.redirect("/");
    });
    app.route("/auth/github").get(passport.authenticate("github"));

    app
        .route("/auth/github/callback")
        .get(
            passport.authenticate("github", { failureRedirect: "/" }),
            (req, res) => {
                req.session.photo = req.user.photo;
                req.session.username = req.user.name;
                req.session.user_id = req.user.id;
                res.redirect("/");
            }
        );
    app.route("/logout").get((req, res) => {
        req.session.username = "";
        req.logout();
        res.redirect("/");
    });
};