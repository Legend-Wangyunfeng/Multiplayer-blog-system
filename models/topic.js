const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/node", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const topicSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  area: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  create_time: {
    type: Date,
    default: Date.now,
  },
  commentNum: {
    type: Number,
    default: 0,
  },
  lastCommenter: {
    type: String,
    default: "没有人",
  },
  last_modified_time: {
    type: Date,
    default: Date.now,
  },
  avatar: {
    type: String,
    default: "/public/img/avatar/avatar-default.png",
  },
});

module.exports = mongoose.model("Topic", topicSchema);
