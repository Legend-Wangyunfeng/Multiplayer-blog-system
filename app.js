const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const router_user = require("./routes/user");
const router_settings = require("./routes/settings");
const router_topic = require("./routes/topic");

const app = express();
app.use("/public", express.static(path.join(__dirname, "/public")));
app.use("/node_modules", express.static(path.join(__dirname, "/node_modules")));

app.engine("html", require("express-art-template"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(router_user);
app.use(router_settings);
app.use(router_topic);

app.use(function (req, res) {
  res.render("404.html");
});

app.listen(3000, function () {
  console.log("App running on 3000 port");
});
