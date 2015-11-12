var app = angular.module('flapperNews', ['ui.router'])


app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

  auth.saveToken = function(token){
    $window.localStorage['flapper-news-token'] = token;
  }

  auth.getToken = function(){
    return $window.localStorage['flapper-news-token'];
  }

  auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now()/1000;
    } else {
      return false;
    }
  }

  auth.currentUser = function(){
  if(auth.isLoggedIn()){
    var token = auth.getToken();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.username;
  }
};

  auth.register = function(user){
  return $http.post('/register', user).success(function(data){
    auth.saveToken(data.token);
  });
};

  auth.logIn = function(user){
  return $http.post('/login', user).success(function(data){
    auth.saveToken(data.token);
  });
};

  auth.logOut = function(){
  $window.localStorage.removeItem('flapper-news-token');
};

  return auth;
}])

.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])



.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);



app.factory('posts', ['$http', 'auth', function($http, auth){
  var o = {
    posts: []
  };

// return all the posts
  o.getAll = function() {
    return $http.get('/posts').success(function(data){
      // angular.copy creates copy of data into the posts array.
      angular.copy(data, o.posts);
    });
  };

// return one post
o.get = function(id){
  return $http.get('/posts/' + id).then(function(res){
    return res.data;
  });
};


// create a new post
//   o.create = function(post) {
//     return $http.post('/posts', post, {
//       headers: {Authorization: 'Bearer' + auth.getToken()}
//     }).success(function(data){
//       o.posts.push(data);
//     });
//   };

// //upvote a post
// // NOTE: this post comes from the main page when u cycle thru the array of posts.. also, upvote is when u click the icon like button and incrementUpvotes fires off this method..
// o.upvote = function(post) {
//   return $http.put('/posts/' + post._id + '/upvote')
//     .success(function(data){
//       post.upvotes += 1;
//   });
// };

// o.addComment = function(id, comment){
//   return $http.post('/posts/' + id + '/comments', comment);
// };


// // o.upvoteComment = function(post, comment){
// //   return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data){
// //       comment.upvotes += 1;
// //   })
// // };

//   o.upvoteComment = function(post, comment) {
//     return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data){
//         comment.upvotes += 1;
//       });
//   };

o.create = function(post) {
  return $http.post('/posts', post, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    o.posts.push(data);
  });
};

o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    post.upvotes += 1;
  });
};

o.addComment = function(id, comment) {
  return $http.post('/posts/' + id + '/comments', comment, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  });
};

o.upvoteComment = function(post, comment) {
  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    comment.upvotes += 1;
  });
};
  return o;
}]);



app.controller('MainCtrl', ['$scope', 'posts', function($scope, posts){
  // $scope.test = 'Hello World';
  // turn our posts array into a factory(like a service) that we inject...
    // $scope.posts = [
    //   {title: 'post 1', upvotes: 5},
    //   {title: 'post 2', upvotes: 2},
    //   {title: 'post 3', upvotes: 15},
    //   {title: 'post 4', upvotes: 9},
    //   {title: 'post 5', upvotes: 4}
    // ];
  //here is our posts array from the factory...
  $scope.posts = posts.posts;


// ng-submit has this addPost() method on it when submit btn is clicked
  $scope.addPost = function(){
    // first check if title exists and is not empty..
    if(!$scope.title || $scope.title === '') {return;}

    // next run the create method in our 'posts' factory..
    posts.create({
      // pass to it.. the input box w ng-model="title" and ng-model="link"
      title: $scope.title,
      link: $scope.link

      // modifiying our addPost method by sending it posts.create function..
      //we comment the rest of this out:
         // upvotes: 0,
        // comments: [
        //   {author: 'Joe', body: 'Cool Post!', upvotes: 0},
          //   {author: 'Bob', body: 'Great idea, but everything is wrong!', upvotes: 0}
        // ]
    });

    // then we clear the title and link inputs..
    $scope.title = '';
    $scope.link = '';
  };

  $scope.incrementUpvotes = function(post){
    posts.upvote(post);
      // post.upvotes += 1;
  }

}]); //ends MainCtrol Controller

app.controller('PostsCtrl', [ '$scope', 'posts', 'post', function($scope, posts, post ){
  // $scope.post = posts.posts[$stateParams.id] replace with...
  $scope.post = post;
  $scope.addComment = function(){
    if($scope.body === '') {return;}
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user'
    }).success(function(comment){
      $scope.post.comments.push(comment);
    });
    $scope.body = '';
  };

  $scope.incrementUpvotes = function(comment){
    // console.log(post)
    // console.log(comment)
    posts.upvoteComment(post, comment);
  }

}]); //ends posts controller


// this is creating a new state using the ui.router module we injected into our app..
app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url:'/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      // resolve will load all this before page loads up.. shows all posts before page loads up.. so resolve postPromise before page loads..
      resolve: {
        postPromise: ['posts', function(posts){
          return posts.getAll();
        }]
      }
    });

    // NOTE: when we declare new state, dont forget to create new template and new controller for it.. and inject the right services to the controller

    $stateProvider
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts){
           // here we call .get method that takes a post id.. to return one post for a page..
          return posts.get($stateParams.id)
        }]
      }
    });

    $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });
    $stateProvider
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

  $urlRouterProvider.otherwise('home');
}]);
