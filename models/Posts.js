var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  link: String,
  upvotes: {type: Number, default: 0},
  comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
});


PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
}


// this is where we define our Post model and gave it attributes of the data we want to store..
mongoose.model('Post', PostSchema);
  // now we register the model with our global mongoose object that we imported w require(), so it can be used to interact w the database whenever we import mongoose global object.

// mongoose lets u create relationships like cupid bt different models.
// it does by using one of its arrows called: ObjectId
  // ObjectId is a 12byte MongoDB ObjectId that is actually stored in the database.
// the ref property tells mongoose, what type of Object the ID references..and here's the kicker: it lets us retrieve BOTH ITEMS SIMULTANEOUSLY!!!

