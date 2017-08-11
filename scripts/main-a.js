'use strict';

function LiveCards() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.storyList = document.getElementById('story-list');
  this.submitButton = document.getElementById('submit');
  this.imageUpload = document.getElementById('image-upload');
  this.titleStory = document.getElementById('title-story');
  this.contentStory = document.getElementById('content-story');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signOutButton = document.getElementById('sign-out');
  this.addCard = document.getElementById('add-card');
  this.deleteCard = document.getElementById('del-card');
  this.inputBlock = document.getElementById('input-block');
  this.storyForm = document.getElementById('story-form');

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);

  this.storyForm.addEventListener('submit', this.saveStory.bind(this));
  this.addCard.addEventListener('click', this.addNewCard.bind(this));
  this.deleteCard.addEventListener('click', this.deleteNewCard.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.imageUpload.addEventListener('change', this.handleFileSelect.bind(this));

  this.initFirebase();
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
    this.displayStory(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl);
  }.bind(this);
  this.bookRef.limitToLast(15).on('child_added', setStory);
  this.bookRef.limitToLast(15).on('child_changed', setStory);
};

// Template for messages.
LiveCards.STORY_TEMPLATE =
  '<div class="section--center mdl-grid mdl-grid--no-spacing mdl-shadow--2dp">' +
    '<div class="mdl-card mdl-cell mdl-cell--12-col">' +
      '<figure class="storyImage mdl-card__media">' +
      '</figure>' +
      '<div class="mdl-card__title mdl-card--expand">' +
        '<h1 class="title mdl-card__title-text mdl-color-text--blue-grey-300"></h1>' +
      '</div>' +
      '<div class="mdl-card__supporting-text">' +
        '<p class="content"></p>' +
      '</div>' +
      '<div class="mdl-card__actions mdl-card--border">' +
        '<div class="userContainer mdl-card__title mdl-card--expand">' +
          '<div class="userPic"></div>' +
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

// Displays a Story in the UI.
LiveCards.prototype.displayStory = function(key, title, content, name, picUrl, imageUri) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement("DIV");
    container.innerHTML = LiveCards.STORY_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
/*
    if (imageUri) { // If the story has an image.
      var image = document.createElement('img');
      image.addEventListener('load', function() {
        this.storyList.scrollTop = this.storyList.scrollHeight;
      }.bind(this));
      this.setImageUrl(imageUri, image);
      div.getElementsByClassName("storyImage")[0].innerHTML = '';
      div.getElementsByClassName("storyImage")[0].appendChild(image);
    }
*/
    if (title) { // If the story has a title.
      var htmlTitle = title.replace(/\n/g, '<br>');
      div.getElementsByClassName("title")[0].innerHTML = htmlTitle;
    }
    if (content) { // It the story has a content.
      var htmlContent = content.replace(/\n/g, '<br>');
      div.getElementsByClassName("content")[0].innerHTML = htmlContent;
    }
    div.getElementsByClassName("userPic")[0].style.backgroundImage = 'url(' + picUrl + ')';
    var x = div.getElementsByClassName("likeButton")[0];
    x.setAttribute('id', key+'.like');
    this.storyList.appendChild(div);
  }
/*
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (content) { // If the message is text.
    messageElement.textContent = content;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.storyList.scrollTop = this.storyList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.storyList.scrollTop = this.storyList.scrollHeight;
  this.contentStory.focus
*/
};

//Add a new card.
LiveCards.prototype.addNewCard = function() {
  if (this.auth.currentUser) {
    this.inputBlock.removeAttribute('hidden');
  } else {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
  }
};

//Delete the new card -
//Clear image and form!!
LiveCards.prototype.deleteNewCard = function() {
  if (this.auth.currentUser) {
    fileDisplay.innerHTML = "";
    this.storyForm.reset();
    this.inputBlock.setAttribute('hidden', 'true');
  }
};

// Saves a new story on the Firebase DB.
LiveCards.prototype.saveStory = function(event) {
  event.preventDefault();
  var file = document.getElementById('selected-image').files[0];
  // Check that the user entered a story and is signed in.
  if (this.imageUpload.value || this.titleStory.value || this.contentStory.value) {
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.
    this.bookRef = this.database.ref('book-20170808165000');
    this.bookRef.push({

      name: currentUser.displayName,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
      imageUrl: this.imageUpload.name,
      title: this.titleStory.value,
      content: this.contentStory.value

    }).then(function(data) {

      // Upload the image to Cloud Storage.
      var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
      console.log(filePath);
      return this.storage.ref(filePath).put(file).then(function(snapshot) {

        // Get the file's Storage URI and update the chat message placeholder.
        var fullPath = snapshot.metadata.fullPath;
        return data.update({imageUrl: this.storage.ref(fullPath).toString()});
      }.bind(this));
    }.bind(this)).catch(function(error) {
      console.error('There was an error uploading a file to Cloud Storage:', error);
    });

    // Clear input new story card.
    this.deleteNewCard();
  }
};
/*
}).then(function(data) {
  // Clear message text field and SEND button state.
  this.deleteNewCard();
  // LiveCards.resetMaterialTextfield(this.contentStory);
  // this.toggleButton();
}.bind(this)).catch(function(error) {
  console.error('Error writing new message to Firebase Database', error);
});
*/
// Signs-in Live Cards.
LiveCards.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Live Cards.
LiveCards.prototype.signOut = function() {
  // Clear form and Sign out of Firebase.
  this.deleteNewCard();
  this.auth.signOut();
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
    this.inputBlock.removeAttribute('hidden');

    // We load currently existing chant messages.
    this.loadBook();

  } else { // User is signed out!
    // Hide sign-out button and input form.
    this.signOutButton.setAttribute('hidden', 'true');
    this.inputBlock.setAttribute('hidden', 'true');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
LiveCards.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Enables or disables the submit button depending on the values of the input
// fields.
LiveCards.prototype.toggleButton = function() {
  if (this.contentStory.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
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
