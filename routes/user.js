const express = require("express");
const User = require("../models/user");
const md5 = require("blueimp-md5");

const router = express.Router();

router.get("/register", function (req, res) {
  res.render("register.html");
});

router.post("/register", function (req, res) {
  const body = req.body;
  User.findOne({
    email: body.email,
  })
    .then(function (data) {
      if (data) {
        return Promise.reject(1);
      } else {
        return User.findOne({
          nickname: body.nickname,
        });
      }
    })
    .then(function (data) {
      if (data) {
        return Promise.reject(2);
      } else {
        body.password = md5(md5(body.password));
        return new User(body).save();
      }
    })
    .then(function (user) {
      req.session.user = user;
      return res.status(200).json({
        err_code: 0,
        message: "OK",
      });
    })
    .catch(function (err_code) {
      if (err_code === 1) {
        return res.status(200).json({
          err_code: 1,
          message: "Email already exist",
        });
      } else if (err_code === 2) {
        return res.status(200).json({
          err_code: 2,
          message: "Nickname already exist",
        });
      } else {
        return res.status(500).json({
          err_code: 500,
          message: "Server error",
        });
      }
    });
});

router.get("/login", function (req, res) {
  res.render("login.html");
});

router.post("/login", function (req, res) {
  const body = req.body;

  User.findOne(
    {
      email: body.email,
      password: md5(md5(body.password)),
    },
    function (err, user) {
      if (err) {
        return res.status(500).json({
          err_code: 500,
          message: err.message,
        });
      }
      if (!user) {
        return res.status(200).json({
          err_code: 1,
          message: "Email or password is invalid.",
        });
      }
      req.session.user = user;
      res.status(200).json({
        err_code: 0,
        message: "OK",
      });
    }
  );
});

router.get("/logout", function (req, res) {
  req.session.user = null;
  res.redirect("/login");
});

module.exports = router;
