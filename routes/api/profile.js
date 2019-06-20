const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const request = require("request");
const config = require("config");
const { check, validationResult } = require("express-validator/check");

const Profile = require("../../Models/Profile");
const User = require("../../Models/User");
const Post = require("../../Models/Post");

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({
        msg: "There is no profile for this user"
      });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route POST api/profile
// @desc Create or update user profile
// @access Private

router.post("/", [
  auth,
  [
    check("status", "Status is required")
      .not()
      .isEmpty(),
    check("skills", "Skills are required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(400).json({ errors: err.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(item => item.trim());
    }

    console.log(profileFields.skills);

    profileFields.social = {};
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (youtube) profileFields.social.youtube = youtube;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({
        user: req.user.id
      });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          {
            user: req.user.id
          },
          {
            $set: profileFields
          },
          {
            new: true
          }
        );
        return res.json(profile);
      }
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).json(err);
    }
  }
]);

// @route GET api/profile
// @desc Get all profiles
// @access Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET api/profile/user/:user_id
// @desc Get profile by user id
// @access Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);

    if (!profile)
      return res.status(400).json({
        msg: "There is no profile for this user"
      });

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({
        msg: "Profile not found"
      });
    }
    res.status(500).send("Server Error");
  }
});

// @route Delete api/profile/
// @desc Delte profile by user id
// @access Public

router.delete("/", auth, async (req, res) => {
  try {
    await Post.deleteMany({ user: req.user.id });
    await Profile.findOneAndRemove({
      user: req.user.id
    });
    await User.findOneAndRemove({
      _id: req.user.id
    });
    res.json("User deleted");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route PUT api/profile/experience
// @desc Add profile exp by user id
// @access Private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required")
        .not()
        .isEmpty(),
      check("company", "Company is required")
        .not()
        .isEmpty(),
      check("from", "From date is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const {
      title,
      company,
      from,
      to,
      description,
      location,
      current
    } = req.body;

    const newExp = {
      title,
      company,
      from,
      to,
      description,
      location,
      current
    };

    try {
      const profile = await Profile.findOne({
        user: req.user.id
      });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route Delete api/profile/experience/:exp_id
// @desc Delete profile exp by its id
// @access Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const exp_id = req.params.exp_id;
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const removeIndex = profile.experience.findIndex(item => item.id == exp_id);
    if (removeIndex == -1) throw new Error("There is no such experience");
    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json("Deletion hasn't been completed");
  }
});

// @route PUT api/profile/education
// @desc Add profile education by user id
// @access Private

router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required")
        .not()
        .isEmpty(),
      check("degree", "Degree is required")
        .not()
        .isEmpty(),
      check("from", "From date is required")
        .not()
        .isEmpty(),
      check("fieldofstudy", "Field of study is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { school, degree, fieldofstudy, to, from, description } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      description
    };

    try {
      const profile = await Profile.findOne({
        user: req.user.id
      });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route Delete api/profile/experience/:exp_id
// @desc Delete profile exp by its id
// @access Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const edu_id = req.params.edu_id;
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const removeIndex = profile.education.findIndex(item => item.id == edu_id);
    if (removeIndex == -1) throw new Error("There is no such education");
    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json("Deletion hasn't been completed");
  }
});

router.get("/github/:username", (req, res) => {
  try {
    const url = `https://api.github.com/users/${
      req.params.username
    }/repos?per_page=5&sort=created:asc&client_id=${config.get(
      "githubClientId"
    )}&client_secret=${config.get("githubClientSecret")}`;
    const options = {
      url,
      method: "GET",
      headers: {
        "user-agent": "node.js"
      }
    };

    request(options, (error, response, body) => {
      if (error) throw error;
      if (response.statusCode != 200) return res.status(404).send("Not found");

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
