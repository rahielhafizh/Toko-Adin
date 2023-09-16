// Firebase configuration
const firebaseConfig = {
  apiKey: "<KEY>",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the sign-in form
const signinForm = document.getElementById("signinForm");

// Add an event listener for form submission
document.addEventListener("DOMContentLoaded", function () {
  signinForm.addEventListener("submit", handleSignin);
});

// Function to handle form submission
function handleSignin(event) {
  event.preventDefault();

  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  // Sign in with email and password
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(handleSigninSuccess)
    .catch(handleSigninError);
}

// Function to handle successful signin
function handleSigninSuccess() {
  window.location.href = "dashboard.html";
}

// Function to handle signin error
function handleSigninError(error) {
  console.log(error.message);
  alert("Sign in failed. Please check your email and password.");
}

// Add an event listener for signupButton
const signupButton = document.getElementById("signupButton");
signupButton.addEventListener("click", redirectToSignup);

// Function to redirect to the signup page
function redirectToSignup() {
  window.location.href = "signup.html";
}
