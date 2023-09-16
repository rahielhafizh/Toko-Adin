// Firebase configuration
const firebaseConfig = {
  apiKey: "<KEY>",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the signup form
const signupForm = document.querySelector("form");

// Add an event listener for form submission
signupForm.addEventListener("submit", handleSignup);

// Function to handle form submission
function handleSignup(event) {
  event.preventDefault();

  // Retrieve user input values
  const email = document.getElementById("userEmailInput").value;
  const password = document.getElementById("userPasswordInput").value;

  // Create a new user account with email and password
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(handleSignupSuccess)
    .catch(handleSignupError);
}

// Function to handle successful signup
function handleSignupSuccess(userCredential) {
  const user = userCredential.user;
  redirectToDashboard();
}

// Function to handle signup error
function handleSignupError(error) {
  console.log(error.message);
  alert("Sign up failed. Please try again.");
}

// Function to redirect to the dashboard page
function redirectToDashboard() {
  window.location.href = "dashboard.html";
}

// Add an event listener for Sign In button
const signInBtn = document.getElementById("signInBtn");
signInBtn.addEventListener("click", redirectToSignin);

// Function to redirect to the signin page
function redirectToSignin() {
  window.location.href = "index.html";
}
