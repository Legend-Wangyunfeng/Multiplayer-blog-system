const express = require("express");
const Topic = require("../models/topic");
const Comment = require("../models/comment");
const user = require("../models/user");

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
    // User.find
    res.render("index.html", {
      user: req.session.user,
      topic: data,
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
    .catch((err) => {
      console.log(err.message);
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
    res.status(200).json({
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
      res.status(200).json({
        err_code: 0,
        err_message: "comment success",
      });
    })
    .catch(() => {
      return res.status(500).json({
        err_code: 500,
        err_message: "Server error",
      });
    });
});

router.get("/search", function (req, res) {
  Topic.find(
    {
      title: req.query.topic,
    },
    function (err, data) {
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
    }
  );
});

module.exports = router;
