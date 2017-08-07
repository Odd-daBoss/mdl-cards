'use strict';

function handleFileSelect() {
    var file = document.getElementById('file-upload').files[0];;

    // Loop through the FileList and render image files as thumbnails.
    // for (var i = 0, f; f = files[i]; i++) {

      // Only process image files.
      if (file.type.match('image.*')) {

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(e) {
					fileDisplay.innerHTML = "";

					var img = new Image();
					img.src = reader.result;

					fileDisplay.appendChild(img);
				}

				reader.readAsDataURL(file);
      }
}

function LiveCards() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.submitButton = document.getElementById('submit');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signOutButton = document.getElementById('sign-out');
  this.addCard = document.getElementById('add-card');
  this.deleteCard = document.getElementById('del-card');
  this.inputBlock = document.getElementById('input-story');
  this.cardForm = document.getElementById('new-card-form');

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);

  this.addCard.addEventListener('click', this.addNewCard.bind(this));
  this.deleteCard.addEventListener('click', this.deleteNewCard.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));

  document.getElementById('file-upload').addEventListener('change', handleFileSelect, false);

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

//Delete the new card.
LiveCards.prototype.deleteNewCard = function() {
  if (this.auth.currentUser) {
    this.cardForm.reset();
    this.inputBlock.setAttribute('hidden', 'true');
  }
};

// Saves a new message on the Firebase DB.
LiveCards.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  // if (this.messageInput.value && this.checkSignedInWithMessage()) {
  if (this.messageInput.value) {
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.

    window.alert('DB Input');
    this.messagesRef = this.database.ref('messages');
    this.messagesRef.push({
      name: currentUser.displayName,
      text: this.messageInput.value,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function() {
      // Clear message text field and SEND button state.
      LiveCards.resetMaterialTextfield(this.messageInput);
      this.toggleButton();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
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
  this.cardForm.reset();
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
  if (this.messageInput.value) {
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
