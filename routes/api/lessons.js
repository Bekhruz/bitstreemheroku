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
const validateLessonInput = require('../../validation/lesson');

// @route   GET api/lessons/test
// @desc    Tests Lesson route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'Lesson Works' }));

// @route   GET api/lessons
// @desc    Get Lesson
// @access  Public
router.get('/', (req, res) => {
  Lesson.find()
    .sort({ date: -1 })
    .then(lessons => res.json(lessons))
    .catch(err => res.status(404).json({ nopostsfound: 'No posts found' }));
});

// @route   GET api/lessons/:id
// @desc    Get lesson by id
// @access  Public
router.get('/:id', (req, res) => {
  Lesson.findById(req.params.id)
    .then(lesson => res.json(lesson))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with that ID' })
    );
});

// @route   POST api/lessons/
// @desc    Create lesson
// @access  Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateLessonInput(req.body);

    // // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      console.log("could not create lesson")
      return res.status(400).json(errors);
    }

    const newLesson = new Lesson({
      title: req.body.title,
      description: req.body.description,
      user: req.user.id
    });
    console.log("Sup");
    newLesson.save().then(lesson => res.json(lesson));
  }
);

// @route   DELETE api/lessons/:id
// @desc    Delete lesson with given ID
// @access  Private
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Lesson.findById(req.params.id)
          .then(lesson => {
            // Check for lesson owner
            if (lesson.user.toString() !== req.user.id) {
              return res
                .status(401)
                .json({ notauthorized: 'User not authorized' });
            }

            // Delete
            lesson.remove().then(() => res.json({ success: true }));
          })
          .catch(err => res.status(404).json({ lessonnotfound: 'No lesson found' }));
      });
  }
);

// @route   POST api/lessons/like/:id
// @desc    Like lesson
// @access  Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {

    Profile.findOne({ user: req.user.id }).then(profile => {

      Lesson.findById(req.params.id)
        .then(lesson => {
          if (
            lesson.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this Lesson' });
          }

          // Add user id to likes array
          lesson.likes.unshift({ user: req.user.id });

          lesson.save().then(lesson => res.json(lesson));
        })
        .catch(err => res.status(404).json({ lessonnotfound: 'No lesson found' }));
    });
  }
);

// @route   POST api/lessons/unlike/:id
// @desc    Unlike lesson
// @access  Private
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Lesson.findById(req.params.id)
        .then(lesson => {
          if (
            lesson.likes.filter(like => like.user.toString() === req.user.id)
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
          lesson.likes.splice(removeIndex, 1);

          // Save
          lesson.save().then(lesson => res.json(lesson));
        })
        .catch(err => res.status(404).json({ lessonnotfound: 'No lesson found' }));
    });
  }
);

// @route   POST api/lessons/comment/:id
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

    Lesson.findById(req.params.id)
      .then(lesson => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add to comments array
        lesson.comments.unshift(newComment);

        // Save
        lesson.save().then(lesson => res.json(lesson));
      })
      .catch(err => res.status(404).json({ lesssonnotfound: 'No lesson found' }));
  }
);

// @route   DELETE api/lessons/comment/:id/:comment_id
// @desc    Remove comment from lesson
// @access  Private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Lesson.findById(req.params.id)
      .then(lesson => {
        // Check to see if comment exists
        if (
          lesson.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exist' });
        }

        // Get remove index
        const removeIndex = lesson.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        lesson.comments.splice(removeIndex, 1);

        lesson.save().then(lesson => res.json(lesson));
      })
      .catch(err => res.status(404).json({ lessonnotfound: 'No lesson found' }));
  }
);

module.exports = router;
