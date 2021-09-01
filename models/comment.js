const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/node", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  topicID: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    require: true,
  },
  content: {
    type: String,
    require: true,
  },
  create_time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
