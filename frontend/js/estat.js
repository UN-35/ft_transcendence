
// Add all your other event listeners and functionality here...
// (Profile, settings, 2FA, etc. remain the same)




// // function getCsrfToken() {
// //     const name = 'csrftoken';
// //     let cookieValue = null;
// //     if (document.cookie && document.cookie !== '') {
// //         const cookies = document.cookie.split(';');
// //         for (let i = 0; i < cookies.length; i++) {
// //             const cookie = cookies[i].trim();
// //             if (cookie.startsWith(`${name}=`)) {
// //                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
// //                 break;
// //             }
// //         }
// //     }
// //     return cookieValue;
// // }

// function getCsrfToken() {
//     const name = 'csrftoken';
//     const cookies = document.cookie.split(';');
    
//     for (const cookie of cookies) {
//         const [key, value] = cookie.trim().split('=');
//         if (key === name) {
//             return decodeURIComponent(value);
//         }
//     }
    
//     return null;
// }



// function showForm(formId) {
//     const sections = ['login-form', 'signup', 'dashboard', 'game-mode', 'profile', 'settings', 'editprofile'];
//     sections.forEach(id => {
//         const section = document.getElementById(id);
//         if (section) section.style.display = 'none';
//     });

//     const targetForm = document.getElementById(formId);
//     if (targetForm) {
//         targetForm.style.display = 'flex';

       
//         history.pushState({ section: formId }, '', `#${formId}`);
//     }
// }


// window.addEventListener('popstate', (event) => {
//     const state = event.state;

    
//     const formId = state?.section || 'login-form';
//     const targetForm = document.getElementById(formId);

//     if (targetForm) {
//         const sections = ['login-form', 'signup', 'dashboard', 'game-mode', 'profile', 'settings', 'editprofile'];

//         sections.forEach(id => {
//             const section = document.getElementById(id);
//             if (section) section.style.display = 'none';
//         });

//         targetForm.style.display = 'flex';
//     }
// });

// document.addEventListener('DOMContentLoaded', async () => {
//     const isLoggedIn = await checkAuthenticationStatus();
//     const hash = window.location.hash.substring(1);
//     const initialForm = isLoggedIn ? (hash || 'dashboard') : 'login-form';
//     const targetForm = document.getElementById(initialForm);

//     if (targetForm) {
//         showForm(initialForm);
//         if (!hash) {
//             history.replaceState({ section: initialForm }, '', `#${initialForm}`);
//         }
//     }
// });



// async function checkAuthenticationStatus() {
//     try {
//         const response = await fetch('/accounts/api/check_auth/', {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCsrfToken()
//             },
//             credentials: 'include'
//         });

//         if (response.ok) {
//             const data = await response.json();
//             return data.isAuthenticated;
//         } else {
//             return false;
//         }
//     } catch (error) {
//         console.error('Error checking authentication status:', error);
//         return false;
//     }
// }
// document.addEventListener('DOMContentLoaded', async () => {
//     const isLoggedIn = await checkAuthenticationStatus();
//     if (isLoggedIn) {
//         // Show the dashboard
//         showForm('dashboard');
//     } else {
//         // Redirect to login form
//         showForm('login-form');
//     }
// });

// function showMessage(containerId, message, isError = false) {
//     const container = document.getElementById(containerId);
//     container.textContent = message;
//     container.style.color = isError ? 'red' : 'green';
// }

// document.addEventListener('DOMContentLoaded', () => {
//     const isAuthenticated = document.cookie.includes('sessionid=');
//     showForm(isAuthenticated ? 'dashboard' : 'login-form');

    
//     document.querySelector('.toggle-form a').addEventListener('click', (e) => {
//         e.preventDefault();
//         showForm('login-form');
//     });

//     document.querySelector('.signuplink').addEventListener('click', (e) => {
//         e.preventDefault();
//         showForm('signup');
//     });

// });



// document.getElementById('signupForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const form = e.target;

//     if (form.password.value !== form.confirm_password.value) {
//         showMessage('signup-message-container', 'Passwords do not match', true);
//         return;
//     }

//     try {
//         const response = await fetch('/accounts/api/signup/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCsrfToken(),
//             },
//             body: JSON.stringify({
//                 username: form.username.value,
//                 email: form.email.value,
//                 password: form.password.value
//             }),
//             credentials: 'include'
//         });

//         const data = await response.json();

//         if (response.ok) {
//             showMessage('signup-message-container', 'Sign up successful! Please login.');
//             form.reset();
//             setTimeout(() => showForm('login-form'), 2000);
//         } else {
//             showMessage('signup-message-container', data.message || 'Sign up failed', true);
//         }
//     } catch (error) {
//         showMessage('signup-message-container', 'An error occurred. Please try again.', true);
//     }
// });



// document.getElementById('loginForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const form = e.target;

//     try {
//         const response = await fetch('/accounts/api/login/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCsrfToken(),
//             },
//             body: JSON.stringify({
//                 email: form.email.value,
//                 password: form.password.value
//             }),
//             credentials: 'include'
//         });

//         const data = await response.json();

//         if (response.ok) {
//             showMessage('login-message-container', 'Login successful!');
//             showForm('dashboard');
//         } else {
//             showMessage('login-message-container', data.message || 'Login failed', true);
//         }
//     } catch (error) {
//         showMessage('login-message-container', 'An error occurred. Please try again.', true);
//     }
// });



// // Check user authentication status asynchronously
// // async function checkAuthenticationStatus() {
// //     try {
// //         const response = await fetch('/accounts/api/check_auth/', {
// //             method: 'GET',
// //             headers: {
// //                 'Content-Type': 'application/json',
// //                 'X-CSRFToken': getCsrfToken()
// //             },
// //             credentials: 'include'
// //         });

// //         if (response.ok) {
// //             const data = await response.json();
// //             return data.isAuthenticated;
// //         } else {
// //             return false;
// //         }
// //     } catch (error) {
// //         console.error('Error checking authentication status:', error);
// //         return false;
// //     }
// // }

// // Handle page load and show appropriate form
// // important----------------------------------------------------------------------
// // document.addEventListener('DOMContentLoaded', async () => {
// //     const isLoggedIn = await checkAuthenticationStatus().catch((error) => {
// //         console.error('Error checking authentication status:', error);
// //         return false; // Default to not logged in on error
// //     });

// //     const hash = window.location.hash.substring(1);
// //     const initialForm = isLoggedIn ? (hash || 'dashboard') : 'login-form';
// //     const targetForm = document.getElementById(initialForm);

// //     if (targetForm) {
// //         showForm(initialForm);
// //         if (!hash) {
// //             history.replaceState({ section: initialForm }, '', `#${initialForm}`);
// //         }
// //     } else {
// //         console.error(`No form found with ID: ${initialForm}`);
// //         showMessage('login-message-container', 'An error occurred. Please try again.', true);
// //         showForm('login-form'); // Fall back to login form
// //     }
// // });



// document.getElementById('42logo').addEventListener('click', async (e) => {
//     e.preventDefault();
//     try {
//         const response = await fetch('/accounts/api/auth/42/url/', {
//             headers: {
//                 'X-CSRFToken': getCsrfToken(),
//             },
//             credentials: 'include',
//         });

//         const data = await response.json();
//         if (data.auth_url) {
//             // Redirect the user to the 42 login page
//             window.location.href = data.auth_url;
//         } else {
//             console.error('Auth URL not provided in the response for 42 login.');
//         }
//     } catch (error) {
//         console.error('Error initiating 42 authentication:', error);
//     }
// });




// async function handle42Callback() {
//     try {
//         const response = await fetch('/accounts/api/42/callback', {
//             credentials: 'include', // Ensure cookies are sent
//         });

//         const data = await response.json();
//         if (data.status === 'success') {
//             showMessage('login-message-container', 'Login successful!');
//             showForm('dashboard'); // Display the dashboard section
//         } else {
//             console.error('Login failed:', data.message);
//             showMessage('login-message-container', data.message || 'Login failed', true);
//             showForm('login-form'); // Redirect to login form on failure
//         }
//     } catch (error) {
//         console.error('Error during 42 callback:', error);
//         showMessage('login-message-container', 'An error occurred. Please try again.', true);
//     }
// }

// // Trigger the callback handling if on the callback page
// if (window.location.href.includes('/accounts/api/42/callback')) {
//     handle42Callback();
// // Trigger this function if on the callback page
// }

// document.getElementById('googlelogo').addEventListener('click', async (e) => {
//     e.preventDefault();
//     try {
//         const response = await fetch('/accounts/api/auth/google/url/', {
//             headers: {
//                 'X-CSRFToken': getCsrfToken(),
//             },
//             credentials: 'include'
//         });
//         const data = await response.json();

//         if (data.auth_url) {
           
//             window.location.href = data.auth_url;
//         } else {
//             console.error('Auth URL not provided in the response for Google login.');
//         }
//     } catch (error) {
//         console.error('Error initiating Google authentication:', error);
//     }
// });



// document.getElementById('logout-icon').addEventListener('click', async () => {
//     try {
//         const response = await fetch('/accounts/api/logout/', {
//             method: 'POST',
//             headers: {
//                 'X-CSRFToken': getCsrfToken(),
//             },
//             credentials: 'include'
//         });

//         if (response.ok) {
//             showForm('login-form');
//         } else {
//             console.error('Logout failed');
//         }
//     } catch (error) {
//         console.error('An error occurred during logout:', error);
//     }
// });
