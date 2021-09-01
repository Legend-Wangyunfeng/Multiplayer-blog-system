const express = require("express");
const User = require("./models/user");
const Topic = require("./models/topic");
const Comment = require("./models/comment");
const md5 = require("blueimp-md5");

const router = express.Router();

router.get("/", function (req, res) {
  Topic.find({}, function (err, data) {
    if (err) {
      return res.json({
        err_code: 500,
        err_message: "server error",
      });
    }
    data.sort((a, b) => {
      return a.last_modified_time.toLocaleString() <
        b.last_modified_time.toLocaleString()
        ? 1
        : -1;
    });
    res.render("index.html", {
      user: req.session.user,
      topic: data,
    });
  });
});

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

router.get("/settings/profile", function (req, res) {
  res.render("settings/profile.html", {
    user: req.session.user,
  });
});

router.post("/settings/profile", function (req, res) {
  const body = req.body;

  User.findOne(
    {
      nickname: body.nickname,
    },
    function (err, data) {
      if (err) {
        return res.status(500).json({
          err_code: 500,
          message: err.message,
        });
      }
      if (data) {
        return res.status(200).json({
          err_code: 1,
          message: "Nickname already in use",
        });
      }
      body.gender = parseInt(body.gender);
      body.birthday = new Date(body.birthday.replace(/-/, "/"));
      User.findOneAndUpdate(
        {
          email: body.email,
        },
        body,
        function (err, user) {
          if (err) {
            return res.status(500).json({
              err_code: 500,
              message: err.message,
            });
          }
          req.session.user = user;
          res.status(200).json({
            err_code: 0,
            message: "OK",
          });
        }
      );
    }
  );
});

router.get("/settings/admin", function (req, res) {
  res.render("settings/admin.html", {
    user: req.session.user,
  });
});

router.post("/settings/admin", function (req, res) {
  const user = req.session.user;
  if (user.password !== md5(md5(req.body.password_now))) {
    return res.status(200).json({
      err_code: 1,
      message: "old password error",
    });
  }
  if (req.body.password_new1 !== req.body.password_new2) {
    return res.status(200).json({
      err_code: 2,
      message: "new password different",
    });
  }
  user.password = md5(md5(req.body.password_new1));

  User.findOneAndUpdate(
    {
      email: req.body.email,
    },
    user
  )
    .then(() => {
      return res.status(200).json({
        err_code: 0,
        message: "success",
      });
    })
    .catch(() => {
      return res.status(500).json({
        err_code: 500,
        message: "Server error",
      });
    });
});

router.get("/topics/new", function (req, res) {
  res.render("topic/new.html", {
    user: req.session.user,
  });
});

router.post("/topics/new", function (req, res) {
  new Topic(req.body)
    .save()
    .then(() => {
      return res.json({
        err_code: 0,
        err_message: "Success",
      });
    })
    .catch(() => {
      return res.json({
        err_code: 500,
        err_message: "Server error",
      });
    });
});

router.get("/topics/show", function (req, res) {
  let data = {};
  Topic.findById(req.query.id)
    .then((tmp) => {
      data.topic = tmp;
      return Comment.find({ topicID: tmp.id });
    })
    .then((tmp) => {
      tmp.reverse();
      data.comment = tmp;
      data.user = req.session.user;
      res.render("topic/show.html", data);
    })
    .catch(() => {
      return res.status(500).json({
        err_code: 500,
        message: "server error",
      });
    });
});

router.post("/topic/comment", function (req, res) {
  if (!req.session.user) {
    return res.json({
      err_code: 1,
      err_message: "请登录",
    });
  }
  req.body.name = req.session.user.nickname;
  new Comment(req.body)
    .save()
    .then((comment) => {
      return Topic.findByIdAndUpdate(req.body.topicID, {
        $inc: { commentNum: 1 },
        lastCommenter: req.body.name,
        last_modified_time: comment.create_time,
      });
    })
    .then(() => {
      return res.json({
        err_code: 0,
        err_message: "comment success",
      });
    })
    .catch(() => {
      return res.json({
        err_code: 500,
        err_message: "Server error",
      });
    });
});

module.exports = router;
