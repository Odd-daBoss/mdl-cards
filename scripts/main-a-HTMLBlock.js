'use strict';

function LiveCards() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.storyList = document.getElementById('story-list');
  this.submitButton = document.getElementById('submit');
  //this.imageUpload = document.getElementById('image-upload');
  this.titleStory = document.getElementById('title-story');
  this.contentStory = document.getElementById('content-story');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signOutButton = document.getElementById('sign-out');
  this.addCard = document.getElementById('add-card');
  //this.deleteCard = document.getElementById('del-card');
  this.inputBlock = document.getElementById('input-block');
  //this.storyForm = document.getElementById('story-form');

  // Toggle for the button.
  // var buttonTogglingHandler = this.toggleButton.bind(this);

  //this.storyForm.addEventListener('submit', this.saveStory.bind(this));
  this.addCard.addEventListener('click', this.addNewCard.bind(this));
  //this.deleteCard.addEventListener('click', this.deleteNewCard.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  //this.imageUpload.addEventListener('change', this.handleFileSelect.bind(this));

  this.initFirebase();
  this.loadBook();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
LiveCards.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

LiveCards.prototype.handleFileSelect = function(event) {
  event.preventDefault();
  var file = event.target.files[0];
  // Only process image files.
  if (file.type.match('image.*')) {

    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = function(e) {
      fileDisplay.innerHTML = "";

      var img = new Image();
      img.src = reader.result;
      img.id = "selected-image";

      fileDisplay.appendChild(img);
    }

    reader.readAsDataURL(file);
    return file;
  }
};

// Loads latest stories from the bookRef.
LiveCards.prototype.loadBook = function() {
  // Reference to the /messages/ database path.
  this.bookRef = this.database.ref('book-20170808165000');
  // Make sure we remove all previous listeners.
  this.bookRef.off();

  // Loads the last number of stories and listen for new ones.
  var setStory = function(data) {
    var val = data.val();
    this.displayStory(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl, val.date);
  }.bind(this);
  this.bookRef.limitToLast(15).on('child_added', setStory);
  this.bookRef.limitToLast(15).on('child_changed', setStory);
//  this.bookRef.on('child_removed', alert("deleted!"));
//  this.bookRef.limitToLast(15).on('child_removed', function(delete) {
//    alert(delete);
//  });
};

// Template for Stories: A Story Template
LiveCards.STORY_TEMPLATE =
  '<div class="section--center mdl-grid mdl-grid--no-spacing mdl-shadow--2dp">' +
    '<div class="mdl-card mdl-cell mdl-cell--12-col">' +
      '<figure class="storyImage mdl-card__media">' +
        '<div class="materialBar">' +
        '<div class="mdl-progress mdl-js-progress mdl-progress__indeterminate is-upgraded" data-upgraded=",MaterialProgress" style="width: 100%">' +
          '<div class="progressbar bar bar1" style="width: 0%;"></div>' +
          '<div class="bufferbar bar bar2" style="width: 100%;"></div>' +
          '<div class="auxbar bar bar3" style="width: 0%;"></div>' +
        '</div>' +
        '</div>' +
      '</figure>' +
      '<div class="mdl-card__title mdl-card--expand">' +
        '<h1 class="title mdl-card__title-text mdl-color-text--blue-grey-300"></h1>' +
      '</div>' +
      '<div class="mdl-card__supporting-text">' +
        '<p class="content"></p>' +
      '</div>' +
      '<div class="mdl-card__actions mdl-card--border">' +
        '<div class="mdl-card__title mdl-card--expand">' +
          '<div class="userPic"></div>' +
          '<span class="mdl-chip">' +
            '<span class="dateTime mdl-chip__text"></span>' +
          '</span>' +
        '</div>' +
        '<div class="mdl-layout-spacer"></div>' +
        '<button class="likeButton mdl-button mdl-button--icon mdl-button--colored"><i class="material-icons">favorite</i></button>' +
      '</div>' +
      '<div class="mdl-card__menu">' +
        '<button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">' +
          '<i class="material-icons">share</i>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';

// Template for Stories: A Story Template
LiveCards.INPUT_TEMPLATE =
  '<div class="section--center mdl-grid mdl-grid--no-spacing mdl-shadow--2dp">' +
    '<div class="mdl-card mdl-cell mdl-cell--12-col">' +
      '<form id="story-form">' +
        '<div id="input-wrapper">' +
          '<div id="fileDisplay">' +
          '</div>' +
          '<div>' +
            '<label class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--primary">' +
              '<i class="material-icons">image_upload</i>' +
              '<input id="image-upload" class="none" type="file" accept="image/*,capture="camera" />' +
            '</lable>' +
          '</div>' +
          '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">' +
            '<input class="mdl-textfield__input" type="text" autocomplete="off" id="title-story"/>' +
            '<label class="mdl-textfield__label" for="title-story">Title</label>' +
          '</div><br />' +
          '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">' +
            '<textarea class="mdl-textfield__input" type="text" rows="10" id="content-story"></textarea>' +
            '<label class="mdl-textfield__label" for="content-story">Story</label>' +
          '</div><br />' +
        '</div>' +
        '<div class="mdl-card__actions mdl-card--border">' +
          '<div id="user-container" class="mdl-card__title mdl-card--expand">' +
            '<div id="user-pic"></div>' +
            '<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" href="https://plus.google.com/+UdomsakOdd">' +
            '<div id="user-name"></div></a>' +
          '</div>' +
          '<div class="mdl-layout-spacer"></div>' +
          '<button id="submit" type="submit" class="mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored mdl-color--accent">' +
            '<i class="material-icons" role="presentation">send</i>' +
          '</button>' +
        '</div>' +
      '</form>' +
      '<div class="mdl-card__menu">' +
        '<button id="del-card" class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">' +
          '<i class="material-icons">clear</i>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';

// Displays a Story in the UI.
LiveCards.prototype.displayStory = function(key, title, content, name, picUrl, imageUri, date) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement("DIV");
    container.innerHTML = LiveCards.STORY_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    if (!imageUri) {
      div.getElementsByClassName("storyImage")[0].innerHTML = '';
    }
  }
  if (imageUri) { // If the story has image.
    var image = document.createElement('img');
    image.src="//:0";
    image.addEventListener('load', function() {
      // Remove MDL Progress Bar when done!
      div.getElementsByClassName("materialBar")[0].innerHTML = '';
    }.bind(this));
    this.setImageUrl(imageUri, image);
    div.getElementsByClassName("storyImage")[0].appendChild(image);
  }
  if (title) { // If the story has a title.
    var htmlTitle = title.replace(/\n/g, '<br>');
    div.getElementsByClassName("title")[0].innerHTML = htmlTitle;
  }
  if (content) { // It the story has a content.
    var htmlContent = content.replace(/\n/g, '<br>');
    div.getElementsByClassName("content")[0].innerHTML = htmlContent;
  }
  div.getElementsByClassName("userPic")[0].style.backgroundImage = 'url(' + picUrl + ')';
  div.getElementsByClassName("dateTime")[0].innerHTML = date;
  var x = div.getElementsByClassName("likeButton")[0];
  x.setAttribute('id', key+'.like');
  this.storyList.insertBefore(div,this.storyList.firstChild);
};

//Show & Hide Input block.
LiveCards.prototype.inputBlockShow = function(show) {
  var div = document.getElementById("input-block");
  if (show) {
    div.innerHTML = LiveCards.INPUT_TEMPLATE;
    this.deleteCard = document.getElementById('del-card');
    this.imageUpload = document.getElementById('image-upload');
    this.storyForm = document.getElementById('story-form');

    this.imageUpload.addEventListener('change', this.handleFileSelect.bind(this));
    this.deleteCard.addEventListener('click', this.deleteNewCard.bind(this));
    this.storyForm.addEventListener('submit', this.saveStory.bind(this));
  } else {
    this.storyForm.removeEventListener('submit', this.saveStory.bind(this));
    this.deleteCard.removeEventListener('click', this.deleteNewCard.bind(this));
    this.storyForm.removeEventListener('submit', this.saveStory.bind(this));
    div.innerHTML = '';
  }
};

//Add a new card.
LiveCards.prototype.addNewCard = function() {
  scroll(0,0);
  if (this.auth.currentUser) {
    //this.inputBlock.removeAttribute('hidden');
    this.inputBlockShow(1);
  } else {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
  }
};

//Delete the new card and Clear image and form!!
LiveCards.prototype.deleteNewCard = function() {
    fileDisplay.innerHTML = "";
    this.storyForm.reset();
    // this.inputBlock.setAttribute('hidden', 'true');
    this.inputBlockShow(0);
};

// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
LiveCards.prototype.setImageUrl = function(imageUri, imgElement) {
  // If the image is a Cloud Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new story on the Firebase DB.
LiveCards.prototype.saveStory = function(event) {
    event.preventDefault();
    var file = document.getElementById('image-upload').files[0];
    if (file) {
    // Check that the user uploaded image or entered a title or any content.
    if (this.imageUpload.value || this.titleStory.value || this.contentStory.value) {
      var currentUser = this.auth.currentUser;
      var d = new Date();
      // Add a new message entry to the Firebase Database.
      this.bookRef = this.database.ref('book-20170808165000');
      this.bookRef.push({

        name: currentUser.displayName,
        photoUrl: currentUser.photoURL || '/images/profile_placeholder.svg',
        title: this.titleStory.value,
        content: this.contentStory.value,
        date: d.toJSON()

      }).then(function(data) {
        // Clear input new story card.
        this.deleteNewCard();

        // Upload the image to Cloud Storage.
        var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
        return this.storage.ref(filePath).put(file).then(function(snapshot) {

          // Get the file's Storage URI and update the chat message placeholder.
          var fullPath = snapshot.metadata.fullPath;
          return data.update({imageUrl: this.storage.ref(fullPath).toString()});
        }.bind(this));
      }.bind(this)).catch(function(error) {
        console.error('There was an error uploading a file to Cloud Storage:', error);
      });
    }
  } else {
  // Check that the user uploaded image or entered a title or any content.
  if (this.titleStory.value || this.contentStory.value) {
    var currentUser = this.auth.currentUser;
    var d = new Date();
    // Add a new message entry to the Firebase Database.
    this.bookRef = this.database.ref('book-20170808165000');
    this.bookRef.push({

      name: currentUser.displayName,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.svg',
      title: this.titleStory.value,
      content: this.contentStory.value,
      date: d.toJSON()

    }).then(function() {
    // Clear input new story card.
    this.deleteNewCard();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
  }
};

// Signs-in Live Cards.
LiveCards.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Live Cards.
LiveCards.prototype.signOut = function() {
  // Clear form and Sign out of Firebase.
  this.auth.signOut();
  this.userPic.style.backgroundImage = "url('/images/profile_placeholder.svg')";
  this.userName.textContent = 'Not signing in!';
  this.deleteNewCard();
  scroll(0,0);
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
LiveCards.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL; // Only change these two lines!
    var userName = user.displayName;   // Only change these two lines!

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show sign-out button and input new card form.
    this.signOutButton.removeAttribute('hidden');
    //this.inputBlock.removeAttribute('hidden');
    this.inputBlockShow(1);

  } else { // User is signed out!
    // Hide sign-out button and input form.
    this.signOutButton.setAttribute('hidden', 'true');
    //this.inputBlock.setAttribute('hidden', 'true');
    this.inputBlockShow(0);
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
LiveCards.prototype.checkSetup = function () {

  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  } else {
    // window.alert('All Good! - ' + firebase.app().name);
  }
};

window.onload = function() {
  window.livecards = new LiveCards();
};
