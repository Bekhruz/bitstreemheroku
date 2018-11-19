const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Course model
const Course = require('../../models/Course');
// Profile model
const Profile = require('../../models/Profile');
// Lesson Model
const Lesson = require('../../models/Lesson');
// User model
const Users = require('../../models/User');

// Validation
const validateCourseInput = require('../../validation/course');
const validatePostInput = require('../../validation/post');
// @route   GET api/courses/test
// @desc    Tests Lesson route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Course Works' }));

// @route   GET api/courses
// @desc    Get Lesson
// @access  Public
router.get('/', (req, res) => {
  Course.find()
    .sort({ date: -1 })
    .then(courses => res.json(courses))
    .catch(err => res.status(404).json({ nocoursefound: 'No Course found' }));
});

// @route   GET api/courses/:id
// @desc    Get lesson by id
// @access  Public
router.get('/:id', (req, res) => {
  Course.findById(req.params.id)
    .then(course => res.json(course))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No course found with that ID' })
    );
});

// @route   POST api/courses/
// @desc    Create course
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateCourseInput(req.body);

    // // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      console.log("could not create course")
      return res.status(400).json(errors);
    }

    const newCourse = new Course({
      title: req.body.title,
      description: req.body.description,
      user: req.user.id
    });
    console.log("Sup");
    newCourse.save().then(course => res.json(course));
  }
);

// @route   DELETE api/courses/:id
// @desc    Delete Course with given ID
// @access  Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Course.findById(req.params.id)
          .then(course => {
            // Check for course owner
            if (course.user.toString() !== req.user.id) {
              return res
                .status(401)
                .json({ notauthorized: 'User not authorized' });
            }

            Lesson.find(course._id)
              .then(lessontodelete => {
                res.json(lessontodelete);
              }).catch({ mg: "couldnot find any" });
            // delete each lesson

            course.lessons.forEach(lesson => {
              Lesson.findById(lesson)
                .then(lesson => {
                  // Delete lesson 
                  lesson.remove().then(() => res.json({ success: true }));
                })
                .catch(err => res.status(404).json({ lessonnotfound: 'No lesson found' }));
            });

            // Delete
            course.remove().then(() => res.json({ success: true }));
          })
          .catch(err => res.status(404).json({ coursenotfound: 'No course found' }));
      });
  }
);

// @route   POST api/courses/like/:id
// @desc    Like course
// @access  Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    Profile.findOne({ user: req.user.id }).then(profile => {

      Course.findById(req.params.id)
        .then(course => {
          if (
            course.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this course' });
          }

          // Add user id to likes array
          course.likes.unshift({ user: req.user.id });

          course.save().then(course => res.json(course));
        })
        .catch(err => res.status(404).json({ coursenotfound: 'No course found' }));
    });
  }
);

// @route   POST api/courses/unlike/:id
// @desc    Unlike course
// @access  Private
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Course.findById(req.params.id)
        .then(course => {
          if (
            course.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: 'You have not yet liked this post' });
          }

          // Get remove index
          const removeIndex = lesson.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          course.likes.splice(removeIndex, 1);

          // Save
          course.save().then(course => res.json(course));
        })
        .catch(err => res.status(404).json({ coursenotfound: 'No course found' }));
    });
  }
);

// @route   POST api/courses/comment/:id
// @desc    Add comment to lesson
// @access  Private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }

    Course.findById(req.params.id)
      .then(course => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add to comments array
        course.comments.unshift(newComment);

        // Save
        course.save().then(course => res.json(course));
      })
      .catch(err => res.status(404).json({ coursenotfound: 'No course found' }));
  }
);

// @route   DELETE api/courses/comment/:id/:comment_id
// @desc    Remove comment from course
// @access  Private

router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Course.findById(req.params.id)
      .then(lesson => {
        // Check to see if comment exists
        if (
          course.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exist' });
        }

        // Get remove index
        const removeIndex = course.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        course.comments.splice(removeIndex, 1);

        course.save().then(course => res.json(course));
      })
      .catch(err => res.status(404).json({ coursenotfound: 'No course found' }));
  }
);

module.exports = router;
