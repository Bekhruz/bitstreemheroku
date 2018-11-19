const mongoose = require("mongoose");
require('mongoose-type-url');
const Schema = mongoose.Schema;

//Create Schema
const LessonSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "courses"
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  videos: [{
    videoname: {
      type: String,
      required: true
    },
    urls: mongoose.SchemaTypes.Url
  }],

  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: mongoose.SchemaTypes.Url
  }],

  comments: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      },
      text: {
        type: String,
        required: true
      },
      name: {
        type: String
      },
      avatar: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  likes: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now()
  }

});

module.exports = Lesson = mongoose.model("lessons", LessonSchema);