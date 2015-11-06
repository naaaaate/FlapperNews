var express = require('express');
var jwt = require('express-jwt');
var router = express.Router();
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

var mongoose = require('mongoose');
var passport = require('passport');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }

    return res.json({token: user.generateJWT()})
  });
});


router.post('/login', auth, function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});






// get posts route.. get all posts from database
router.get('/posts', function(req, res, next){
// here Post.find lets us go to the database from our router/server.. so before we show page go to DB get all posts..

  Post.find(function(err, posts){
    if(err){return next(err)}

    res.json(posts);
  });
});


// post posts route.. add to the database
router.post('/posts', function(req, res, next){
  // create new post object
  var post = new Post(req.body);

  // save the post object just created to the Database..
  post.save(function(err, post){
    if(err){return next(err);}

    res.json(post);
  });
});

// load a post object from the database.. this gets run when post is in the url..
// so this looks at the route, and if it specifies that it needs a post object, it will find the post first from database, using the PARAM function in Express.
router.param('post', function(req, res, next, id) {
  // if post in params url, find it in DB by id..
  var query = Post.findById(id);

  // now its in query box.. execute the box
  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    // and if the post is inside of it, set the post equal to the request.
    req.post = post;
    return next();
  });
});

// this grabs the comment just like the post..
router.param('comment', function(res, req, next, id){
  var query = Comment.findById(id);

  query.exec(function(err, comment) {
    if(err){return next(err);}
    if(!comment){return next(new Error('can\'t find comment'));}

    req.comment = comment;
    return next();
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



// define the get route for a post or route w an id on it..
router.get('/posts/:post', function(req, res, next){
  req.post.populate('comments', function(err,post){
    if(err) {return next(err);}

    // we are returning the post as json..
    res.json(post);
  })
})



// route to upvote a post and save to db.. when user clicks on upvote icon, it will run this route, hit our server, run the PostSchema.method.upvote method and give a response
router.put('/posts/:post/upvote', auth, function(req, res, next){
  // req.post is the :post .. so we upvote it and say if we get error return it , else convert the the post after upvote to json and return to client.
  // can test this function w curl: curl -X PUT http://localhost:3000/posts/<POST ID>/upvote

  req.post.upvote(function(err,post){
    if(err) {return next(err);}

    res.json(post);
  });
});



// create route for comments for a particular post:
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    // Note: req.post is the post from :post param..
    req.post.comments.push(comment);

    // here we save to actual db now..
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      // return the comment as json
      res.json(comment);
    });
  });
});

// upvote route for comments..
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next){
    req.comment.upvote(function(err, comment){
    if(err) {return next(err);}

    res.json(comment);
  });
});

module.exports = router;
