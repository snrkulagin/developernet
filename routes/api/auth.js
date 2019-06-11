const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

const {
    check,
    validationResult
} = require('express-validator/check');

const User = require('../../Models/User');

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            msg: 'Server error'
        })
    }
});

router.post("/", [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please is required').exists()
], async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        return res.status(400).json({
            errors: err.array()
        })
    }

    const {
        email,
        password
    } = req.body;

    try {
        let user = await User.findOne({
            email
        });

        if (!user) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invalid credentials'
                }]
            });
        }

        isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                errors: [{
                    msg: 'Invalid Credentials'
                }]
            });
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'), {
                expiresIn: 360000
            },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token
                });
            })

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error')
    }
});

module.exports = router;