const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const User = require('../models/user-schema')
const Post = require('../models/post-schema')
const Sub = require('../models/sub-schema')
const Comment = require('../models/comment-schema')
const Report = require('../models/report-schema')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { Session } = require('express-session')
require('dotenv').config();


////////////////// register page requests ////////////////////////////////////////////
router.post("/register", async (req, res) => {
    console.log(req.body)
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const NewUser = new User({
                first: req.body.first,
                last: req.body.last,
                username: req.body.username,
                email: req.body.email,
                password: hash,
                age: req.body.age,
                contact: req.body.contact
            });
            console.log(NewUser)

            NewUser.save((error) => {
                if (error) {
                    res.send({ success: false, message: "Username already taken" })
                    console.log(error)
                }
                else {
                    console.log("User created successfully")
                    res.send({ success: true })
                }
            })
        });
});

////////////////////// login page requests /////////////////////////////////////////////
router.post("/signin", (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username: username })
        .then(user => {
            if (!user) {
                return res.status(400).json({ success: false, msg: 'User not found' })
            }
            console.log(user)
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.status(400).json({ success: false, msg: 'Incorrect password' });
                    }

                    //console.log("success")
                    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

                    try {
                        req.session.user = user;
                        res.json({
                            success: true,
                            msg: '',
                            token: `Bearer ${token}`
                        })
                        console.log("success")
                    }
                    catch (error) {
                        console.log("Error", error)
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ success: false, msg: 'Server error' });
                });
        });
})

////////////////////// profile page requests //////////////////////////////////////////
// get current user
router.post('/user', async (req, res) => {
    var user;
    if (req.session.user) {
        user = await User.findOne({ _id: req.session.user._id });
        res.send(user);
    }
});

// update the user details when modified in the session
router.put('/changeuser', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.session.user._id, req.body, { new: true })
    }
    catch (error) {
        console.log(error);
    }
})

// delete following and consequently the follower of the other user
router.delete('/deletefollowing', async (req, res) => {
    await User.updateOne(
        { _id: req.session.user._id },
        { $pull: { following: req.body.value } })
    await User.updateOne(
        { username: req.body.value },
        { $pull: { followers: req.session.user.username } }
    )
})

/////////////////////// mysubs page requests ////////////////////////////////////////
// get subs created by the user
router.get('/getusersubs', async (req, res) => {
    try {
        const subs = await Sub.find({ postedBy: req.session.user.username });
        res.json(subs);
    } catch (e) {
        console.log(e);
    }
})

// get a sub with the given name
router.get('/subs/:name', async (req, res) => {
    try {
        const sub = await Sub.findOne({ name: req.params.name });
        //console.log(sub);
        res.json(sub);
    } catch (e) {
        console.log(e);
    }
})

// create a new sub
router.post('/sub', async (req, res) => {
    const newSub = new Sub({
        name: req.body.name,
        description: req.body.description,
        tags: JSON.parse(req.body.tags),
        banned: JSON.parse(req.body.banned),
        postedBy: req.session.user.username
    })
    const result = await newSub.save();
    console.log('New Sub Created');
    await User.updateOne(
        { _id: req.session.user._id },
        { $push: { joinedsubs: result._id.toString() } }
    )
})

// delete a sub and all its related posts and comments
router.patch('/deletesub', async (req, res) => {
    const result = await Sub.findOne({ name: req.body.subName })
    const subId = result._id.toString();
    console.log(subId)
    await Sub.deleteOne({ name: req.body.subName })
    await User.updateMany({}, { $pull: { joinedsubs: { $in: subId }, leftsubs: { $in: subId } } })
    await User.updateMany({}, { $pull: { saved: { $nin: await Post.distinct('_id', { postedIn: { $ne: req.body.subName } }) } } })
    await Post.deleteMany({ postedIn: req.body.subName })
    await Comment.deleteMany({ subName: req.body.subName })
})

/////////////////////// mysubs inside page requests /////////////////////////////////
// accept requests into a sub
router.patch('/accept', async (req, res) => {
    const sub = await Sub.findOne({ name: req.body.sub });
    const newmember = { members: req.body.user, date: new Date() };

    await Sub.findOneAndUpdate(
        { name: req.body.sub },
        {
            $pull: { requests: req.body.user },
            $push: { people: newmember },
        }
    )
    await User.findOneAndUpdate({ username: req.body.user }, { $push: { joinedsubs: sub._id } })
})

// reject requests into a sub
router.patch('/reject', async (req, res) => {
    await Sub.updateOne({ name: req.body.sub.name }, { $pull: { requests: req.body.user } })
})

// get users
router.post('/getusers', async (req, res) => {
    const sub = await Sub.findOne({ name: req.body.sub });
    if (!sub) {
        return res.send("error")
    }

    const blockedUsernames = sub.blocked || [];

    const users = await User.find({
        username: {
            $in: sub.people.map((person) => person.members),
            $nin: blockedUsernames,
        },
    });
    res.json(users);
})

// get blocked users
router.post('/getblockedusers', async (req, res) => {
    const sub = await Sub.findOne({ name: req.body.sub });
    if (!sub) {
        return res.send("error")
    }

    const blockedUsernames = sub.blocked || [];


    const users = await User.find({
        username: {
            $in: sub.people.map((person) => person.members),
            $in: blockedUsernames,
        },
    });
    res.json(users);

})

// create a new report
router.post('/report', async (req, res) => {
    const post = await Post.findOne({ _id: req.body.post });
    const postedBy = post.postedBy;
    const text = post.text;
    console.log(post)
    const report = new Report({
        reportedBy: req.session.user.username,
        reportedIn: req.body.sub,
        reported: postedBy,
        concern: req.body.report,
        text: text,
        ignore: false
    })
    if (report.reportedBy === postedBy) {
        res.json({ success: false })
    }
    else {
        await report.save();
        res.json({ success: true })
        const sub = await Sub.findOne({ name: req.body.sub });
        sub.numReported += 1;
        await sub.save();
    }
})

// get reports in a sub
router.post('/getreported', async (req, res) => {
    const reports = await Report.find({ reportedIn: req.body.subname });
    res.json(reports);
})

// ignore a report
router.patch('/ignore', async (req, res) => {
    await Report.findOneAndUpdate({ _id: req.body.id }, { ignore: true });
})

// block a user in the sub
router.patch('/block', async (req, res) => {
    await Sub.findOneAndUpdate({ _id: req.body.id }, { $push: { blocked: req.body.block } });
    await Report.findByIdAndDelete({ _id: req.body.reportId });
});

// delete a report
router.patch('/deletereport', async (req, res) => {
    const report = await Report.findByIdAndDelete({ _id: req.body.id });
    if (report) {
        const sub = await Sub.findOne({ name: report.reportedIn });
        sub.numDeleted += 1;
        await sub.save();
        res.json({ success: true });
    }
    else {
        res.json({ success: false });
    }
});

// stats:
// 1. growth of subreddit in terms of members over time
// 2. no. daily posts vs date
// 3. no. daily visitors vs date
// 4. no. reported posts vs actually deleted posts
router.post('/getstats/:subName', async (req, res) => {
    const subName = req.params.subName;
    try {
        const members = await Sub.aggregate([
            { $match: { name: subName } },
            { $project: { members: { $size: "$people" }, date: 1 } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, members: { $sum: "$members" } } },
            { $sort: { _id: 1 } }
        ]).exec();

        const posts = await Sub.aggregate([
            { $match: { name: subName } },
            { $unwind: "$posts" },
            { $project: { date: { $dateToString: { format: "%Y-%m-%d", date: "$posts.date" } } } },
            { $group: { _id: "$date", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).exec();

        const visitors = await Sub.aggregate([
            { $match: { name: subName } },
            { $unwind: "$visitors" },
            { $project: { date: { $dateToString: { format: "%Y-%m-%d", date: "$visitors.date" } } } },
            { $group: { _id: "$date", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).exec();

        const sub = await Sub.findOne({ name: subName });
        const reported = sub.numReported;
        const deleted = sub.numDeleted;

        const reports = await Sub.aggregate([
            { $match: { name: subName } },
            { $project: { numReported: { $size: "$reported" }, numDeleted: { $size: "$blocked" } } },
            { $group: { _id: null, numReported: { $sum: "$numReported" }, numDeleted: { $sum: "$numDeleted" } } }
        ]).exec();

        res.json({
            members,
            posts,
            visitors,
            reported,
            deleted
        });
        console.log(subName)
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
})

/////////////////////// sub page requests ///////////////////////////////////////////

// show all subs
router.get('/getsubs', async (req, res) => {
    try {
        const subs = await Sub.find({});
        res.json(subs);
    } catch (e) {
        console.log(e);
    }
})

// show a given sub
router.post('/getsub', async (req, res) => {
    try {
        const sub = await Sub.findOne({ name: req.body.subname });
        res.json(sub);
    } catch (e) {
        console.log(e);
    }
})

// show posts under a given sub
router.get('/getposts/:name', async (req, res) => {
    try {
        const name = req.params.name;
        //console.log(name)
        const posts = await Post.find({ postedIn: name });
        res.json(posts);
    } catch (e) {
        console.log(e);
    }
})

// get joined subs of a user
router.get('/joinedsubs', async (req, res) => {
    const user = await User.findOne({ _id: req.session.user._id });
    const subIds = user.joinedsubs.map(subId => mongoose.Types.ObjectId(subId));
    var matchingSubs = await Sub.find({ _id: { $in: subIds } });
    res.json(matchingSubs);
})

// get unjoined subs of a user
router.get('/unjoinedsubs', async (req, res) => {
    const user = await User.findOne({ _id: req.session.user._id });
    const subIds = user.joinedsubs.map(subId => mongoose.Types.ObjectId(subId));
    const matchingSubs = await Sub.find({ _id: { $in: subIds } });
    const matchingSubIds = matchingSubs.map(sub => sub._id);
    const unmatchingSubs = await Sub.find({ _id: { $nin: matchingSubIds } });
    res.json(unmatchingSubs);
})

// join a sub
router.patch('/joinsub', async (req, res) => {
    const id = req.body.subId.toString();
    const user = await User.findOne({ _id: req.session.user._id, leftsubs: { $in: [id] } });
    const requests = await Sub.findOne({ _id: req.body.subId, requests: { $in: [id] } });
    if (!user && !requests) {
        await Sub.updateOne(
            { _id: req.body.subId },
            { $push: { requests: req.session.user.username } }
        );
        res.json({ success: "true" });
    }
    else if (!user && requests) {
        res.json({ success: "requested" });
    }
    else {
        res.json({ success: "false" });
    }
})

// leave a sub
router.patch('/leavesub', async (req, res) => {
    const id = req.body.subId.toString();
    await User.updateOne(
        { _id: req.session.user._id },
        { $pull: { joinedsubs: id }, $push: { leftsubs: id } }
    );
})

// create a new post
router.post('/post', async (req, res) => {
    const newPost = new Post({
        text: req.body.text,
        postedBy: req.session.user.username,
        postedIn: req.body.postedIn,
        upvotes: req.body.upvotes,
        downvotes: req.body.downvotes
    })
    const result = await newPost.save();
    console.log('New Post Created');

    const sub = await Sub.findOne({ name: newPost.postedIn });
    if (!sub) {
        console.log(`Sub ${newPost.postedIn} not found`);
        return res.status(404).send(`Sub ${newPost.postedIn} not found`);
    }

    if (!sub.people.map((person) => person.members).includes(newPost.postedBy)) {
        sub.people.push({ members: newPost.postedBy, date: new Date() });
        await sub.save();
        console.log(`Person ${newPost.postedBy} added to Sub ${sub.name}`);
    }

    const post = { post: result._id, date: new Date() };
    sub.posts.push(post);
    await sub.save();
    console.log(`Post ${result._id} added to Sub ${sub.name}`);

    res.send(result);
})

// update upvotes
router.patch('/posts/:postId/upvote', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        post.upvotes += 1;
        const updatedPost = await post.save();
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// update downvotes
router.patch('/posts/:postId/downvote', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        post.downvotes += 1;
        const updatedPost = await post.save();
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// create a new comment
router.post('/newcomment', async (req, res) => {
    const newComment = new Comment({
        text: req.body.text,
        postedIn: req.body.postedIn,
        postedBy: req.session.user.username,
        subName: req.body.subName
    });
    console.log(newComment)
    newComment.save((error) => {
        if (error) {
            console.log("Can't create new comment");
        }
        else {
            console.log("New Comment Created");
        }
    })
});

// show comments under a given post
router.get('/posts/:name/comments', async (req, res) => {
    const comments = await Comment.find({ postedIn: req.params.name })
    res.send(comments);
})

// show a given post
router.get('/posts/:name', async (req, res) => {
    const post = await Post.findOne({ _id: req.params.name })
    res.send(post);
})


// show people the user is following
router.get('/following', async (req, res) => {
    const query = { following: req.query.following };
    try {
        const result = await User.find(query);
        res.json(result);
    } catch (err) {
        res.json(null);
    }
});

// update followers and following when a user follows someone
router.patch('/newfollowing', async (req, res) => {
    const result = await User.updateOne(
        { _id: req.session.user._id },
        { $push: { following: req.body.following } }
    );
    const r2 = await User.updateOne(
        { username: req.body.following },
        { $push: { followers: req.session.user.username } }
    );
})

// save a given post in the user's saved posts
router.patch('/save', async (req, res) => {
    const query = { _id: req.session.user._id, saved: req.body.saved };
    const result = await User.find(query)
    if (result.length <= 0) {
        await User.updateOne(
            { _id: req.session.user._id },
            { $push: { saved: req.body.saved } }
        )
        res.send({ success: true })
    }
    else {
        res.send({ success: false });
    }
})

// add a visitor when an unjoined member views stats of a sub
router.post('/visit', async (req, res) => {
    const subName = req.body.sub;
    const now = new Date();
    const sub = await Sub.findOneAndUpdate(
        { name: subName },
        { $push: { visitor: req.session.user.username, visitors: { date: now } } },
        { new: true }
    ).exec();
})

///////////////////// saved posts page requests
// show all saved posts of the user
router.get('/savedposts', async (req, res) => {
    var savedPostIds = await User.findOne({ _id: req.session.user._id })
    savedPostIds = savedPostIds.saved.map(id => mongoose.Types.ObjectId(id));
    const result = await Post.find({ _id: { $in: savedPostIds } });
    console.log(result)
    res.json(result);
})

// delete a saved post of a user
router.patch('/removesavedposts', async (req, res) => {
    await User.updateOne(
        { _id: req.session.user._id },
        { $pull: { saved: req.body.value } }
    )
})

//////////////// logout page requests
router.post('/logout', async (req, res) => {
    req.session.destroy(() => {
        console.log("Session destroyed");
        res.send({ message: 'Logout successful' });
    });
});



module.exports = router