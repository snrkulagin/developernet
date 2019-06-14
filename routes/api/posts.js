const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const { check, validationResult } = require("express-validator/check");

const Profile = require("../../Models/Profile");
const User = require("../../Models/User");
const Post = require("../../Models/Post");

//@route POST api/posts
//@desc Create a post
//@access Private

router.post(
  "/",
  [
    auth,
    check("text", "Text is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();

      res.json(post);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  }
);

//@route GET api/posts
//@desc Get all posts
//@access Private

router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

//@route GET api/posts/:id
//@desc Get post by id
//@access Private

router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    res.json(post);
  } catch (error) {
    console.error(error);
    if (error.kind == "ObjectId")
      return res.status(404).json({ msg: "Post not found" });
    res.status(500).send("Server error");
  }
});

//@route DELETE api/posts/:id
//@desc Delete post by id
//@access Private

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Unauthorized" });

    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (error) {
    console.error(error);
    if (error.kind == "ObjectId")
      return res.status(404).json({ msg: "Post not found" });
    res.status(500).send("Server error");
  }
});

//@route PUT api/posts/like/:id
//@desc Like post by id
//@access Private

router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.findIndex(like => like.user.toString() === req.user.id) != -1
    )
      return res.status(400).json({ msg: "Post already liked" });

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

//@route PUT api/posts/like/:id
//@desc Like post by id
//@access Private

router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const indexOfLike = post.likes.findIndex(
      like => like.user.toString() === req.user.id
    );

    if (indexOfLike == -1)
      return res.status(400).json({ msg: "Post hasn't been liked" });

    post.likes.splice(indexOfLike, 1);

    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

//@route  POST api/posts/comment/:id
//@desc Add a comment
//@access Private

router.post(
  "/comment/:id",
  [
    auth,
    check("text", "Text is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json(errors);

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      post.comments.unshift(newComment);

      await post.save();

      res.json(post);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  }
);

//@route  DELETE api/posts/comment/:id
//@desc Delete the comment
//@access Private

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = post.comments.find(
      comment => comment.id == req.params.comment_id
    );

    if (!comment)
      return res.status(404).json({ msg: "Comment does not exist" });

    if (comment.user.toString() != req.user.id)
      return res.status(401).send("Unauthorized");

    const indexOfComment = post.comments.findIndex(
      comment => comment.id.toString() === req.params.comment_id
    );

    post.comments.splice(indexOfComment, 1);

    await post.save();

    res.json(post.comments);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
