const express = require("express");
const User = require("../models/user");
const Topic = require("../models/topic");
const Comment = require("../models/comment");
const md5 = require("blueimp-md5");
const multiparty = require("multiparty");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const OSS = require("ali-oss");

// 项目使用OSS云存储
const client = new OSS({
  // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: "oss-cn-hangzhou",
  // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
  accessKeyId: "",
  accessKeySecret: "",
  // 填写Bucket名称。
  bucket: "",
});

const ossPath = "";
async function put(filename, localPath) {
  try {
    // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
    // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    const result = await client.put(filename, path.normalize(localPath));
  } catch (e) {
    console.log(e);
  }
}

router.get("/settings/profile", function (req, res) {
  req.session.user.path = null;
  res.render("settings/profile.html", {
    user: req.session.user,
  });
});

router.post("/settings/profile", function (req, res) {
  const body = req.body;
  User.findOne({
    nicnickname: body.nickname,
  })
    .then((data) => {
      if (data) {
        return res.status(200).json({
          err_code: 1,
          message: "Nickname already in use",
        });
      }
      body.gender = parseInt(body.gender);
      body.birthday = new Date(body.birthday.replace(/-/, "/"));
    })
    .then(() => {
      return Topic.findOneAndUpdate(
        {
          name: req.session.user.nickname,
        },
        {
          name: body.nickname,
        },
        { new: true }
      );
    })
    .then((topic) => {
      return Topic.findOneAndUpdate(
        {
          lastCommenter: req.session.user.nickname,
        },
        {
          lastCommenter: body.nickname,
        },
        { new: true }
      );
    })
    .then((topic) => {
      return Comment.updateMany(
        {
          name: req.session.user.nickname,
        },
        {
          name: body.nickname,
        },
        { new: true }
      );
    })
    .then((comment) => {
      return User.findOneAndUpdate(
        {
          email: body.email,
        },
        body,
        { new: true }
      );
    })
    .then((user) => {
      req.session.user = user;
      res.status(200).json({
        err_code: 0,
        err_message: "success",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        err_code: 500,
        err_message: "server error",
      });
    });
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
    user,
    { new: true }
  )
    .then((user) => {
      req.session.user = user;
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

router.get("/settings/delete", function (req, res) {
  User.findOneAndDelete({
    email: req.session.user.email,
  })
    .then(() => {
      req.session.user = null;
      return res.json({
        err_code: 0,
      });
    })
    .catch(() => {
      return res.json({
        err_code: 500,
      });
    });
});

router.post("/settings/avatar", function (req, res) {
  let form = new multiparty.Form();
  form.uploadDir = path.resolve(__dirname, "../public/img/avatar");
  form.keepExtensions = true; //是否保留后缀
  form.autoFiels = true; //启用文件事件，并禁用部分文件事件，如果监听文件事件，则默认为true。
  form.parse(req, async function (err, fields, files) {
    //其中fields表示你提交的表单数据对象，files表示你提交的文件对象
    if (err) {
      return res.status(500).json({
        err_code: 500,
        err_message: "上传失败！" + err,
      });
    }
    const oldPath = files.avatar[0].path;

    if (
      oldPath.indexOf(".jpg") === -1 &&
      oldPath.indexOf(".png") === -1 &&
      oldPath.indexOf(".gif") === -1 &&
      oldPath.indexOf(".jfif") === -1
    ) {
      console.log("格式错误");
      return res.status(200).json({
        err_code: 1,
        err_message: "error file",
      });
    }

    await put(path.basename(oldPath), oldPath);
    const newPath = path.join(ossPath, path.basename(oldPath));

    return User.findOneAndUpdate(
      {
        email: req.session.user.email,
      },
      {
        avatar: newPath,
      }
    )
      .then((user) => {
        return Topic.findOneAndUpdate(
          {
            name: req.session.user.nickname,
          },
          {
            avatar: newPath,
          },
          { new: true }
        );
      })
      .then((topic) => {
        req.session.user.avatar = path.join(ossPath, path.basename(oldPath));
        fs.unlink(oldPath, (err) => {
          console.log(err);
        });

        res.status(200).json({
          err_code: 0,
          err_message: "Success!",
        });
      })
      .catch(() => {
        return res.status(500).json({
          err_code: 500,
          err_message: "error",
        });
      });
  });
});

module.exports = router;
