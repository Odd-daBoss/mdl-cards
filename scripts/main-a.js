'use strict';

function LiveCards() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.storyList0 = document.getElementById('story-list-0');
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
  this.nextButton = document.getElementById('next-button');
  this.prevButton = document.getElementById('prev-button');

  // Toggle for the button.
  // var buttonTogglingHandler = this.toggleButton.bind(this);

  this.storyForm.addEventListener('submit', this.saveStory.bind(this));
  this.addCard.addEventListener('click', this.addNewCard.bind(this));
  this.deleteCard.addEventListener('click', this.deleteNewCard.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.imageUpload.addEventListener('change', this.handleFileSelect.bind(this));
  this.nextButton.addEventListener('click', this.loopBook.bind(this));
  this.prevButton.addEventListener('click', this.gotoBook.bind(this));

  this.initFirebase();
  this.initBook();
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

LiveCards.prototype.gotoBook = function() {
  var newIcon = document.getElementById('new-badge');
  newIcon.setAttribute('data-badge', -1);
  var loadPrev = document.getElementById('load-prev');
  loadPrev.setAttribute('hidden', 'true');
};

//Loads the stories from the bookRef - n: Lot-Size, type: init or loop.
LiveCards.prototype.initBook = function() {
  this.bookRef = this.database.ref('book-20170808165000'); // Reference to the database path.
  this.bookRef.off(); // Make sure we remove all previous listeners.
  if (!this.auth.currentUser) { // Clear User Name - if not signing in!
    this.userName.textContent = 'Not signing in!';
  }
  // Initial loads the last number of stories and listen for new ones.
  var nextKey;
  var i = 0; // Set initial loop and initial story.
  var n = 1; // Set initial display lot.
  var keyTrk = document.getElementById('key'); // Get loop key-tracker.
  var iniStory = function(data, prevKey) {
    var val = data.val();
    console.log('iniStory INIed: ' + data.key + ' PrevKEY: ' + prevKey);
    if (!prevKey) {
      console.log('!prevKey | i: ' + i);
      var looperDiv = document.getElementsByClassName("loop-tracker")[0];
      looperDiv.setAttribute('id',i);
      var nxtkeyDiv = document.getElementsByClassName("key-tracker")[0];
      nxtkeyDiv.setAttribute('id','#'+data.key);
    }
    console.log('call initDisplay: ' + data.key);
    this.initDisplay(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl, val.date);
    var newStory = document.getElementById('new-badge').getAttribute("data-badge");
    newStory++;
    console.log('new story: ' + newStory);
    var newIcon = document.getElementById('new-badge');
    newIcon.setAttribute('data-badge', newStory);
    var loadPrev = document.getElementById('load-prev');
    if (newStory > 0) {
      loadPrev.removeAttribute('hidden');
    }
  }.bind(this);

  var chgStory = function(data, prevKey) {
    var val = data.val();
    console.log('chgStory CHGed: ' + data.key + ' PrevKEY: ' + prevKey);
    this.editDisplay(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl, val.date);
  }.bind(this);

  // Read the last (1) story and listen to: added * changed * removed.
  this.bookRef.limitToLast(n).on('child_added', iniStory);
  this.bookRef.on('child_changed', chgStory);
  this.bookRef.on('child_removed', function(data) {
    console.log('child_removed: ' + data.key);
    var child = document.getElementById(data.key);
    var parent = document.getElementById(data.key).parentNode; // Get the correct parent HERE!!
    console.log('parent: ' + parent);
    parent.removeChild(child);
  });

  if (keyTrk) {
    this.bookRef.once('value').then(function(snapshot) {
      var m = snapshot.numChildren();
      var alertStory = m - i*n - 1;
      if (alertStory <= 0) {
        var loadNext = document.getElementById('load-next');
        loadNext.setAttribute('hidden', 'true');
        console.log('alertStory <= 0');
      } else {
        console.log('Story: ' + alertStory);
        var prevIcon = document.getElementById('nxt-badge');
        prevIcon.setAttribute('data-badge', alertStory);
      }
    });
  }
};

LiveCards.prototype.loopBook = function() {
  var nextKey;
  // Reference to the /messages/ database path.
  this.bookRef = this.database.ref('book-20170808165000');
  // Make sure we remove all previous listeners.
  this.bookRef.off();
  // Clear User Name - if not signing in!
  if (!this.auth.currentUser) {
    this.userName.textContent = 'Not signing in!';
  }
  // Load stories when button click.
  var n = 6; // Loads story of (n) = lot-size +1
  var i = document.getElementsByClassName("loop-tracker")[0].id; // Get loop-tracker.
  var keyTracker = document.getElementsByClassName("key-tracker")[0].id; // Get key-tracker.
  var keyID = keyTracker.substr(1);
  console.log('keyID: ' + keyID);

  var setStory = function(data, prevKey) {
    var val = data.val();
    console.log('setStory Loaded: ' + data.key + ' PrevKEY: ' + prevKey);
    if (!prevKey) {
      console.log('!prevKey | i: ' + i);
      var looperDiv = document.getElementsByClassName("loop-tracker")[0];
      looperDiv.setAttribute('id',i);
      var nxtkeyDiv = document.getElementsByClassName("key-tracker")[0];
      nxtkeyDiv.setAttribute('id','#'+data.key);
    }
    console.log('call loadDisplay: ' + data.key);
    this.loadDisplay(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl, val.date);
  }.bind(this);

  var addStory = function(data, prevKey) {
    var val = data.val();
    console.log('newStory ADDed: ' + data.key + ' PrevKEY: ' + prevKey);
    this.liveDisplay(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl, val.date);
    var newStory = document.getElementById('new-badge').getAttribute("data-badge");
    newStory++;
    console.log('new story: ' + newStory);
    var newIcon = document.getElementById('new-badge');
    newIcon.setAttribute('data-badge', newStory);
    var loadPrev = document.getElementById('load-prev');
    if (newStory > 0) {
      loadPrev.removeAttribute('hidden');
    }
  }.bind(this);

  var chgStory = function(data, prevKey) {
    var val = data.val();
    console.log('chgStory CHGed: ' + data.key + ' PrevKEY: ' + prevKey);
    this.editDisplay(data.key, val.title, val.content, val.name, val.photoUrl, val.imageUrl, val.date);
  }.bind(this);

  i++; // Read block of (n) stories.
  this.bookRef.orderByKey().endAt(keyID).limitToLast(n).on('child_added', setStory);
  this.bookRef.once('value').then(function(snapshot) {
    var m = snapshot.numChildren();
    var alertStory = m - i*n;
    if (alertStory <= 0) {
      var loadNext = document.getElementById('load-next');
      loadNext.setAttribute('hidden', 'true');
        console.log('alertStory <= 0');
    } else {
      console.log('Story: ' + alertStory);

      var prevIcon = document.getElementById('nxt-badge');
      prevIcon.setAttribute('data-badge', alertStory);
    }
  });
  // Listen to: newly added * changed * removed.
  this.bookRef.limitToLast(1).on('child_added', addStory);
  this.bookRef.on('child_changed', chgStory);
  this.bookRef.on('child_removed', function(data) {
    console.log('child_removed: ' + data.key);
    var child = document.getElementById(data.key);
    var parent = document.getElementById(data.key).parentNode; // Get the correct parent HERE!!
    console.log('parent: ' + parent);
    parent.removeChild(child);
  });
  var newStory = document.getElementById('new-badge').getAttribute("data-badge");
  newStory--;
  console.log('new story(-): ' + newStory);
  var newIcon = document.getElementById('new-badge');
  newIcon.setAttribute('data-badge', newStory);
};

// Template for Stories: A Story Template
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
        '<div class="mdl-card__title mdl-card--expand">' +
          '<div class="userPic"></div>' +
          '<span class="mdl-chip">' +
            '<span class="dateTime mdl-chip__text"></span>' +
          '</span>' +
        '</div>' +
        '<div class="mdl-layout-spacer"></div>' +
        '<button class="likeButton mdl-button mdl-button--icon mdl-button--colored mdl-badge" data-badge="3"><i class="material-icons">favorite</i></button>' +
        '<button class="shareButton mdl-button mdl-button--icon mdl-button--colored"><i class="material-icons">share</i></button>' +
      '</div>' +
      '<div class="mdl-card__menu">' +
        '<button class="mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect">' +
          '<i class="material-icons">clear</i>' +
        '</button>' +
      '</div>' +
    '</div>' +
  '</div>';

LiveCards.IMAGE_PROGRESSBAR =
  '<div class="materialBar">' +
  '<div class="mdl-progress mdl-js-progress mdl-progress__indeterminate is-upgraded" data-upgraded=",MaterialProgress" style="width: 100%">' +
    '<div class="progressbar bar bar1" style="width: 0%;"></div>' +
    '<div class="bufferbar bar bar2" style="width: 100%;"></div>' +
    '<div class="auxbar bar bar3" style="width: 0%;"></div>' +
  '</div>' +
  '</div>';

// Displays a Story in the UI.
LiveCards.prototype.initDisplay = function(key, title, content, name, picUrl, imageUri, date) {
  console.log('key* :' + key);
  console.log('title* :' + title);
  var div = document.getElementById(key);
  var storyDate = date;
  // If an element for that story does not exists yet we create it.
  if (!div) { //Displaying new story.
    var fDate = document.getElementById("story-list-0").getElementsByClassName("dateTime")[0];
    if (fDate) {
      var firstDate = fDate.innerHTML;
    } else {
      firstDate = 0;
    }
    var container = document.createElement("DIV");
    container.innerHTML = LiveCards.STORY_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    div.getElementsByClassName("userPic")[0].style.backgroundImage = 'url(' + picUrl + ')';
    div.getElementsByClassName("dateTime")[0].innerHTML = date;
    var x = div.getElementsByClassName("likeButton")[0];
    x.setAttribute('id', key+'.like');
    if (storyDate > firstDate) {
      this.storyList0.insertBefore(div,this.storyList0.firstChild);
    } else {
      this.storyList0.appendChild(div);
    }
  }
  if (!imageUri) { // If the story has NO-image.
      div.getElementsByClassName("storyImage")[0].innerHTML = '';
  } else { // If the story has an image.
    div.getElementsByClassName("storyImage")[0].innerHTML = LiveCards.IMAGE_PROGRESSBAR;
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      // Remove MDL Progress Bar when done!
      div.getElementsByClassName("materialBar")[0].innerHTML = '';
    }.bind(this));
    this.setImageUrl(imageUri, image);
    div.getElementsByClassName("storyImage")[0].appendChild(image);
  }
  if (!title) { // If the story has NO-title.
    div.getElementsByClassName("title")[0].innerHTML = '';
  } else { // If the story has a title.
    var htmlTitle = title.replace(/\n/g, '<br>');
    div.getElementsByClassName("title")[0].innerHTML = htmlTitle;
  }
  if (!content) { // It the story has NO-content.
    div.getElementsByClassName("content")[0].innerHTML = '';
  } else { // It the story has a content.
    var htmlContent = content.replace(/\n/g, '<br>');
    div.getElementsByClassName("content")[0].innerHTML = htmlContent;
  }
};

// Displays a Story in the UI.
LiveCards.prototype.loadDisplay = function(key, title, content, name, picUrl, imageUri, date) {
  var showList = document.getElementById("show-list");
  var i = document.getElementsByClassName("loop-tracker")[0].id; // Get loop-tracker.
  var listName = "story-list-" + i;
  console.log('create name: ' + listName);
  var loopList = document.getElementById(listName); // Get "story-list-i"
  if (!loopList) { // If no story-list-i, create now!
    loopList = document.createElement("DIV");
    loopList.setAttribute('id', listName);
    showList.appendChild(loopList);
  }
  var div = document.getElementById(key); // Get story div.
  var storyDate = date; // Get story date.
  if (!div) { // If an element for that story does not exists yet we create it.
    var fDate = document.getElementById(listName).getElementsByClassName("dateTime")[0];
    if (fDate) {
      var firstDate = fDate.innerHTML;
    } else {
      firstDate = 0;
    }
    if (storyDate > firstDate) {
      var container = document.createElement("DIV");
      container.innerHTML = LiveCards.STORY_TEMPLATE;
      div = container.firstChild;
      div.setAttribute('id', key);
      div.getElementsByClassName("userPic")[0].style.backgroundImage = 'url(' + picUrl + ')';
      div.getElementsByClassName("dateTime")[0].innerHTML = date;
      var x = div.getElementsByClassName("likeButton")[0];
      x.setAttribute('id', key+'.like');
      loopList.insertBefore(div,loopList.firstChild);
      if (!imageUri) { // If the story has NO-image.
        div.getElementsByClassName("storyImage")[0].innerHTML = '';
      } else { // If the story has an image.
        div.getElementsByClassName("storyImage")[0].innerHTML = LiveCards.IMAGE_PROGRESSBAR;
        var image = document.createElement('img');
        image.addEventListener('load', function() {
          // Remove MDL Progress Bar when done!
          div.getElementsByClassName("materialBar")[0].innerHTML = '';
        }.bind(this));
        this.setImageUrl(imageUri, image);
        div.getElementsByClassName("storyImage")[0].appendChild(image);
      }
      if (!title) { // If the story has NO-title.
        div.getElementsByClassName("title")[0].innerHTML = '';
      } else { // If the story has a title.
        var htmlTitle = title.replace(/\n/g, '<br>');
        div.getElementsByClassName("title")[0].innerHTML = htmlTitle;
      }
      if (!content) { // It the story has NO-content.
        div.getElementsByClassName("content")[0].innerHTML = '';
      } else { // It the story has a content.
        var htmlContent = content.replace(/\n/g, '<br>');
        div.getElementsByClassName("content")[0].innerHTML = htmlContent;
      }
    }
  }
};

// Displays a Story in the UI.
LiveCards.prototype.liveDisplay = function(key, title, content, name, picUrl, imageUri, date) {
  var listOne = document.getElementById("story-list-1"); // Check existing of story-list-1.
  console.log('live key* :' + key);
  console.log('live title* :' + title);
  var div = document.getElementById(key);
  var storyDate = date; // If an element for that story does not exists yet we create it.
  if (!div) { //Displaying new story.
    var fDate = document.getElementById("story-list-0").getElementsByClassName("dateTime")[0];
    if (fDate) {
      var firstDate = fDate.innerHTML;
    } else {
      firstDate = 0;
    }
    var container = document.createElement("DIV");
    container.innerHTML = LiveCards.STORY_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    div.getElementsByClassName("userPic")[0].style.backgroundImage = 'url(' + picUrl + ')';
    div.getElementsByClassName("dateTime")[0].innerHTML = date;
    var x = div.getElementsByClassName("likeButton")[0];
    x.setAttribute('id', key+'.like');
    if (storyDate > firstDate) {
      this.storyList0.insertBefore(div,this.storyList0.firstChild);
    } else {
      if (!listOne) { // Continue only if there is -NO- story-list-1.
        this.storyList0.appendChild(div);
      }
    }
  }
  if (!imageUri) { // If the story has NO-image.
      div.getElementsByClassName("storyImage")[0].innerHTML = '';
  } else { // If the story has an image.
    div.getElementsByClassName("storyImage")[0].innerHTML = LiveCards.IMAGE_PROGRESSBAR;
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      // Remove MDL Progress Bar when done!
      div.getElementsByClassName("materialBar")[0].innerHTML = '';
    }.bind(this));
    this.setImageUrl(imageUri, image);
    div.getElementsByClassName("storyImage")[0].appendChild(image);
  }
  if (!title) { // If the story has NO-title.
    div.getElementsByClassName("title")[0].innerHTML = '';
  } else { // If the story has a title.
    var htmlTitle = title.replace(/\n/g, '<br>');
    div.getElementsByClassName("title")[0].innerHTML = htmlTitle;
  }
  if (!content) { // It the story has NO-content.
    div.getElementsByClassName("content")[0].innerHTML = '';
  } else { // It the story has a content.
    var htmlContent = content.replace(/\n/g, '<br>');
    div.getElementsByClassName("content")[0].innerHTML = htmlContent;
  }
};

// Correcting Displayed Story in the UI.
LiveCards.prototype.editDisplay = function(key, title, content, name, picUrl, imageUri, date) {
  var div = document.getElementById(key);
  if (div) {
    if (!imageUri) { // If the story has NO-image.
      div.getElementsByClassName("storyImage")[0].innerHTML = '';
    } else { // If the story has an image.
      div.getElementsByClassName("storyImage")[0].innerHTML = LiveCards.IMAGE_PROGRESSBAR;
      var image = document.createElement('img');
      image.addEventListener('load', function() {
        // Remove MDL Progress Bar when done!
        div.getElementsByClassName("materialBar")[0].innerHTML = '';
      }.bind(this));
      this.setImageUrl(imageUri, image);
      div.getElementsByClassName("storyImage")[0].appendChild(image);
    }
    if (!title) { // If the story has NO-title.
      div.getElementsByClassName("title")[0].innerHTML = '';
    } else { // If the story has a title.
      var htmlTitle = title.replace(/\n/g, '<br>');
      div.getElementsByClassName("title")[0].innerHTML = htmlTitle;
    }
    if (!content) { // It the story has NO-content.
      div.getElementsByClassName("content")[0].innerHTML = '';
    } else { // It the story has a content.
      var htmlContent = content.replace(/\n/g, '<br>');
      div.getElementsByClassName("content")[0].innerHTML = htmlContent;
    }
  }
};

//Add a new card.
LiveCards.prototype.addNewCard = function() {
  scroll(0,0);
  if (this.auth.currentUser) {
    this.inputBlock.removeAttribute('hidden');
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
    this.inputBlock.setAttribute('hidden', 'true');
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
  if (this.auth.currentUser) {
    event.preventDefault();
    var file = document.getElementById('image-upload').files[0];
    if (file) {
      // Check that the user uploaded image or entered a title or any content.
      if (this.imageUpload.value || this.titleStory.value || this.contentStory.value) {
        var currentUser = this.auth.currentUser;
        var d = Date.now();
        // Add a new message entry to the Firebase Database.
        this.bookRef = this.database.ref('book-20170808165000');
        this.bookRef.push({
          name: currentUser.displayName,
          photoUrl: currentUser.photoURL || '/images/profile_placeholder.svg',
          title: this.titleStory.value,
          content: this.contentStory.value,
          date: d
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
        var d = Date.now();
        // Add a new message entry to the Firebase Database.
        this.bookRef = this.database.ref('book-20170808165000');
        this.bookRef.push({
          name: currentUser.displayName,
          photoUrl: currentUser.photoURL || '/images/profile_placeholder.svg',
          title: this.titleStory.value,
          content: this.contentStory.value,
          date: d
        }).then(function() {
            // Clear input new story card.
            this.deleteNewCard();
          }.bind(this)).catch(function(error) {
              console.error('Error writing new message to Firebase Database', error);
            });
      }
    }
  } else {
    alert("You must sign-in first!");
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
    // this.inputBlock.removeAttribute('hidden');

  } else { // User is signed out!
    // Hide sign-out button and input form.
    this.signOutButton.setAttribute('hidden', 'true');
    this.inputBlock.setAttribute('hidden', 'true');
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
