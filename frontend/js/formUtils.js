function toggle_game_visiblity() {
    let game_selection_conatiner = document.querySelector('.game-section');
    let is_game_visible = document.querySelector('.game-section').style.display == 'none' ? true : false;
    let game_canvas = document.querySelector('canvas.webgl');

    if (is_game_visible) {
        game_selection_conatiner.style.display = 'block';
        game_canvas.style.display = 'none';
        return;
    }
    game_selection_conatiner.style.display = 'none';
    game_canvas.style.display = 'block';
}


function getCsrfToken() {
    
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    
    return null;
}

if (['#tournament-registration', '#game'].includes(location.hash))
    showForm('dashboard');

function showForm(formId) {
    const sections = ['login-form', 'signup', 'dashboard', 'game-selection', 'game', 'profile', 'settings', 'editprofile', 'friends', 'tournament-registration'];


    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });

    const targetForm = document.getElementById(formId);
    if (targetForm) {
        targetForm.style.display = 'flex';
        history.pushState({ section: formId }, '', `#${formId}`);
    }

    if (formId === 'login-form') {
        const overlay = document.getElementById('verify-2fa-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

window.addEventListener('popstate', (event) => {
    const state = event.state;
    const formId = state?.section || 'login-form';
    const targetForm = document.getElementById(formId);

    if (targetForm) {
        const sections = ['login-form', 'signup', 'dashboard', 'game-selection', 'profile', 'settings', 'editprofile', 'friends', 'tournament-registration'];
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });
        targetForm.style.display = 'flex';
    }
});


async function checkAuthenticationStatus() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/check_auth/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.isAuthenticated;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
        return false;
    }
}



async function check2FAStatus(context = 'login') {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/check_2fa_status/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            if (data.is_2fa_enabled) {
                showVerificationOverlay(context);
            }
        } else {
            console.error('Failed to check 2FA status.');
        }
    } catch (error) {
        console.error('Error checking 2FA status:', error);
    }
}



document.addEventListener('DOMContentLoaded', async () => {
    try {

        const hash = window.location.hash.substring(1);
        
        if (window.location.pathname.includes('/accounts/api/42/callback')) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const isLoggedIn = await checkAuthenticationStatus();

        if (!isLoggedIn) {
            showForm('login-form');
            const overlay = document.getElementById('verify-2fa-overlay');
            overlay.classList.add('hidden');
            return;
        }
   
        const initialForm = isLoggedIn ? (hash || 'dashboard') : 'login-form';

        showForm(initialForm);
        
        if (!hash) {
            history.replaceState({ section: initialForm }, '', `#${initialForm}`);
        }

        
        if (isLoggedIn) {
            await check2FAStatus();
        } 
    } catch (error) {
        console.error('Error during initialization:', error);
        showForm('login-form');
    }
});

function showMessage(containerId, message, isError = false) {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = message;
        container.style.color = isError ? 'red' : 'green';
        container.style.display = message ? 'block' : 'none';
        // container.style.display = 'block';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = document.cookie.includes('sessionid=');
    showForm(isAuthenticated ? 'dashboard' : 'login-form');

    
    document.querySelector('.toggle-form a').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('login-form');
    });

    document.querySelector('.signuplink').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('signup');
    });

});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.password.value !== form.confirm_password.value) {
        showMessage('signup-message-container', 'Passwords do not match', true);
        return;
    }

    try {
        // const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: form.username.value,
                email: form.email.value,
                password: form.password.value
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('signup-message-container', 'Sign up successful! Please login.');
            form.reset();
            setTimeout(() => showForm('login-form'), 2000);
        } else {
            showMessage('signup-message-container', data.message || 'Sign up failed', true);
        }
    } catch (error) {
        showMessage('signup-message-container', 'An error occurred. Please try again.', true);
    }
});

    
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
        // const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                email: form.email.value,
                password: form.password.value
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('jwtToken', data.access_token);

            showMessage('login-message-container', 'Login successful!');
            showForm('dashboard');
            await check2FAStatus();
        } else {
            showMessage('login-message-container', data.message || 'Login failed', true);
        }
    } catch (error) {
        showMessage('login-message-container', 'An error occurred. Please try again.', true);
    }
});


document.getElementById('42logo').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/auth/42/url/', {
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });
    
        const data = await response.json();
        if (data.auth_url) {
            window.location.href = data.auth_url;
        } else {
            console.error('Auth URL not provided in the response for 42 login.');
        }
    } catch (error) {
        console.error('Error initiating 42 authentication:', error);
    }
});

document.getElementById('googlelogo').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/auth/google/url/', {
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
            const data = await response.json();

        if (data.auth_url) {
            window.location.href = data.auth_url;
        } else {
            console.error('Auth URL not provided in the response for Google login.');
        }
    } catch (error) {
        console.error('Error initiating Google authentication:', error);
    }
});


document.getElementById('logout-icon').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (response.ok) {
            showForm('login-form');
            const overlay = document.getElementById('verify-2fa-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('An error occurred during logout:', error);
    }
});








document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#game-selection .sidebar #settings-icon');
    const userIconSettings = document.querySelector('#settings .sidebar #grid-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('settings');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('dashboard');
        });
    }

});




document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#profile .sidebar #settings-icon');
    const userIconSettings = document.querySelector('#settings .sidebar #user-icon');

    await fetchProfileData();
   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('settings');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', async () => {
            await fetchProfileData();
            showForm('profile');
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#editprofile .sidebar #settings-icon');
    const userIconSettings = document.querySelector('#editprofile .sidebar #user-icon');

    await fetchProfileData();
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('settings');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', async () => {
            await fetchProfileData();
            showForm('profile');
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#dashboard .sidebar #user-icon');
    const userIconSettings = document.querySelector('#dashboard .sidebar #settings-icon');

    await fetchProfileData();
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', async() => {
            await fetchProfileData();
            showForm('profile');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('settings');
        });
    }

});



document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#dashboard .sidebar #mode-game-icon');
    const userIconSettings = document.querySelector('#dashboard .sidebar #logout-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('game-selection');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('login-form');
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#game-selection .sidebar #grid-icon');
    const userIconSettings = document.querySelector('#dashboard .sidebar #logout-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('dashboard');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('login-form');
        });
    }

});




















document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#editprofile .sidebar #grid-icon');
    const userIconSettings = document.querySelector('#editprofile .sidebar #logout-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('dashboard');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('login-form');
        });
    }

});



document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#settings .sidebar #logout-icon');
    const userIconSettings = document.querySelector('#profile .sidebar #logout-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('login-form');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('login-form');
            
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#settings .sidebar #mode-game-icon');
    const userIconSettings = document.querySelector('#profile .sidebar #mode-game-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('game-selection');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('game-selection');
        });
    }

});

document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#dashboard .sidebar #mode-game-icon');
    const userIconSettings = document.querySelector('#editprofile .sidebar #mode-game-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('game-selection');
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('game-selection');
        });
    }

});



document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#game-selection .sidebar #logout-icon');
    const userIconSettings = document.querySelector('#editprofile .sidebar #mode-game-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('login-form');

        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('game-selection');
        });
    }

});




document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#settings .sidebar #friends-icon');
    const userIconSettings = document.querySelector('#profile .sidebar #friends-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('friends');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('friends');
            
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#game-selection .sidebar #friends-icon');
    const userIconSettings = document.querySelector('#dashboard .sidebar #friends-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('friends');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('friends');
            
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#friends .sidebar #user-icon');
    const userIconSettings = document.querySelector('#friends .sidebar #mode-game-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('profile');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('game-selection');
            
        });
    }

});

document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#friends .sidebar #settings-icon');
    const userIconSettings = document.querySelector('#friends .sidebar #logout-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('settings');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('login-form');
            
        });
    }

});

document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#friends .sidebar #grid-icon');
    const userIconSettings = document.querySelector('#friends .sidebar #logout-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('dashboard');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('login-form');
            
        });
    }

});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#friends .sidebar #grid-icon');
    const userIconSettings = document.querySelector('#friends .sidebar #mode-game-icon');

   
    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', () => {
            
            showForm('dashboard');
            
        });
    }

    if (userIconSettings) {
        userIconSettings.addEventListener('click', () => {
            showForm('game-selection');
            
        });
    }

});











document.querySelector('.edit-profile-btn').addEventListener('click', () => {
    document.getElementById('profile').style.display = 'none';
    document.getElementById('editprofile').style.display = 'flex';
});

document.querySelector('#editprofile .sidebar #user-icon').addEventListener('click', () => {
    document.getElementById('profile').style.display = 'flex';
    document.getElementById('editprofile').style.display = 'none';
});


document.addEventListener('DOMContentLoaded', () => {
    const editProfileButton = document.querySelector('.edit-profile-btn'); 
    const profileSection = document.getElementById('profile');
    const editProfileSection = document.getElementById('editprofile');

    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            
            profileSection.classList.remove('active');
            editProfileSection.classList.add('active');
        });
    }
    
    
    const userIconEditProfile = document.querySelector('#editprofile .sidebar #user-icon');
    if (userIconEditProfile) {
        userIconEditProfile.addEventListener('click', () => {
            
            profileSection.classList.add('active');
            editProfileSection.classList.remove('active');
        });
    }
});






document.getElementById('goback-btn').addEventListener('click', () => {
    document.getElementById('editprofile').style.display = 'none';
    document.getElementById('profile').style.display = 'flex';
});


document.addEventListener('DOMContentLoaded', async () => {
    const userIconGameMode = document.querySelector('#game-selection .sidebar #user-icon');
    const userIconProfile = document.querySelector('#profile .sidebar #grid-icon');

    await fetchProfileData();

    if (userIconGameMode) {
        userIconGameMode.addEventListener('click', async () => {
            await fetchProfileData();
            showForm('profile');
        });
    }

    if (userIconProfile) {
        userIconProfile.addEventListener('click', () => {
            showForm('dashboard');
        });
    }
});

document.getElementById('savechanges').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('edit-username').value.trim();
    const profilePicture = document.getElementById('change-image').files[0];
    
    const formData = new FormData();
    
    if (username) {
        formData.append('username', username);
    }
    
    if (profilePicture) {
        formData.append('profile_picture', profilePicture);
    }
    
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/update_profile/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: formData,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        const messageContainer = document.getElementById('editprofile-message-container');
        
        if (response.ok && data.status === 'success') {
            updateProfileUI(data);
            messageContainer.textContent = 'Profile updated successfully!';
            messageContainer.style.color = 'green';
            
            document.getElementById('editprofile').style.display = 'none';
            document.getElementById('profile').style.display = 'flex';
        } else {
            messageContainer.textContent = data.message || 'Failed to update profile.';
            messageContainer.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        
        const messageContainer = document.getElementById('editprofile-message-container');
        messageContainer.textContent = 'An error occurred. Please try again.';
        messageContainer.style.color = 'red';
    }
});


async function fetchProfileData() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/profile/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        


        if (data.status === 'success') {
            updateProfileUI(data);
        } else {
            throw new Error(data.message || 'Failed to load profile data');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        
        const messageContainer = document.getElementById('profile-message-container');
        if (messageContainer) {
            messageContainer.style.color = 'red';
        }
    }
}

function updateProfileUI(data) {
    const usernameElement = document.getElementById('display-username');
    if (usernameElement) {
        usernameElement.textContent = data.user.username || 'N/A';
    }

    const emailElement = document.getElementById('display-email');
    if (emailElement) {
        emailElement.textContent = data.user.email || 'N/A';
    }

    const profileAvatarImg = document.getElementById('profile-avatar-img');
    const editAvatarImg = document.getElementById('edit-avatar-img');

    const profilePictureUrl = data.profile_picture || '/static/accounts/img/avatar.png';

    if (profileAvatarImg) {
        const img = profileAvatarImg.querySelector('img') || profileAvatarImg;
        img.src = profilePictureUrl;
    }
    
    if (editAvatarImg) {
        editAvatarImg.src = profilePictureUrl;
    }

    const levelElement = document.getElementById('display-score');
    if (levelElement) {
        levelElement.textContent = data.level || 'N/A';
    }
}









document.getElementById('savedata').addEventListener('click', async (e) => {
    e.preventDefault();

    const overlay = document.getElementById('change-password-overlay');
    const inputs = overlay.querySelectorAll('input');
    const currentPassword = inputs[0].value.trim();
    const newPassword = inputs[1].value.trim();
    const confirmPassword = inputs[2].value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        // alert('All fields are required.');
        showMessage('change-password-message-container', 'All fields are required.', true);
        return;
    }

    if (newPassword !== confirmPassword) {
        // alert('New password and confirm password do not match.');
        showMessage('change-password-message-container', 'New password and confirm password do not match.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/change_password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
            credentials: 'include', 
        });

        const data = await response.json();

        if (response.ok) {
            // alert('Password changed successfully. Please log in with your new password.');
            showMessage('change-password-message-container', 'Password changed successfully. Please log in with your new password.');
            showForm('settings');
        } else {
            // alert(data.message || 'Failed to change password. Please check your current password and try again.');
            showMessage('change-password-message-container', data.message || 'Failed to change password. Please check your current password and try again.', true);
        }
    } catch (error) {
        console.error('Error changing password:', error);
        // alert('An error occurred while changing the password. Please try again.');
        showMessage('change-password-message-container', 'An error occurred while changing the password. Please try again.', true);
    }
});


function closeOverlay() {
    const overlay = document.getElementById('change-password-overlay');
    overlay.classList.add('hidden');
}




function showVerificationOverlay(context) {
    const overlay = document.getElementById('verify-2fa-overlay');
    overlay.classList.remove('hidden');
    overlay.dataset.context = context; 
}





function closeOverlay3() {
    const overlay = document.getElementById('verify-2fa-overlay');
    overlay.classList.add('hidden');
    
    const context = overlay.dataset.context;
    if (context === 'login') {
        showForm('login-form');
    } else if (context === 'settings') {
        
        showForm('settings');
        document.getElementById('change-password-overlay').classList.add('hidden');
    }
}








async function showEnable2FA() {
    const overlay = document.getElementById('enable-2fa-overlay');
    overlay.classList.remove('hidden');

    const qrImage = overlay.querySelector('img');

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/get_2fa_qr/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            qrImage.src = data.qr_code_url;
        } else {
            // alert('Failed to load QR code. Please try again.');
            showMessage('enable-2fa-message-container', 'Failed to load QR code. Please try again.', true);
        }
    } catch (error) {
        console.error('Error fetching QR code:', error);
        // alert('An error occurred while fetching the QR code.');
        showMessage('enable-2fa-message-container', 'An error occurred while fetching the QR code.', true);
    }
}


async function submitTwoFactorCode() {
    const overlay = document.getElementById('enable-2fa-overlay');
    const input = overlay.querySelector('input');
    const passcode = input.value.trim();

    if (!passcode) {
        // alert('Please enter the passcode.');
        showMessage('enable-2fa-message-container', 'Please enter the passcode.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/enable_2fa/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ passcode }),
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
            // alert('2FA enabled successfully.');
            showMessage('enable-2fa-message-container', '2FA enabled successfully.');
            closeOverlay1(); 
        } else {
            // alert(data.message || 'Failed to enable 2FA. Please try again.');
            showMessage('enable-2fa-message-container', data.message || 'Failed to enable 2FA. Please try again.', true);
        }
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        // alert('An error occurred. Please try again.');
        showMessage('enable-2fa-message-container', 'An error occurred. Please try again.', true);
    }
}


function closeOverlay1() {
    const overlay = document.getElementById('enable-2fa-overlay');
    overlay.classList.add('hidden');
}




















async function showDisable2FA() {
    const overlay = document.getElementById('disable-2fa-overlay');
    overlay.classList.remove('hidden');

    const confirmationText = overlay.querySelector('.confirmation-text');
    
}

async function submitDisable2FA() {
    const overlay = document.getElementById('disable-2fa-overlay');

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/disable_2fa/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
            // alert('2FA disabled successfully.');
            showMessage('disable-2fa-message-container', '2FA disabled successfully.');
            closeOverlay2();
        } else {
            // alert(data.message || 'Failed to disable 2FA. Please try again.');
            showMessage('disable-2fa-message-container', data.message || 'Failed to disable 2FA. Please try again.', true);
        }
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        // alert('An error occurred. Please try again.');
        showMessage('disable-2fa-message-container', 'An error occurred. Please try again.', true);
    }
}

function closeOverlay2() {
    const overlay = document.getElementById('disable-2fa-overlay');
    overlay.classList.add('hidden');
}




async function showDeleteAccount() {
    
    document.getElementById('enable-2fa-overlay').classList.add('hidden');
    document.getElementById('disable-2fa-overlay').classList.add('hidden');
    document.getElementById('change-password-overlay').classList.add('hidden');
    document.getElementById('delete-account-overlay').classList.add('hidden');

    await check2FAStatus('delete-account');
}


async function submitDeleteAccount(passcode) {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/delete_account/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ passcode }), 
            credentials: 'include',
        });

        
        


        if (response.ok) {
            // alert('Account deleted successfully.');
            localStorage.removeItem('jwtToken');
            showMessage('delete-account-message-container', 'Account deleted successfully.');
            showForm('login-form');
        } else {
            const data = await response.json();
            // alert(data.message || 'Failed to delete account. Please try again.');
            showMessage('delete-account-message-container', data.message || 'Failed to delete account. Please try again.', true);
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        // alert('An error occurred. Please try again.');
        showMessage('delete-account-message-container', 'An error occurred. Please try again.', true);
    }
}


function closeOverlay4() {
    const overlay = document.getElementById('delete-account-overlay');
    overlay.classList.add('hidden');
}


async function check2FAStatus(context = 'login') {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/check_2fa_status/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            if (data.is_2fa_enabled) {
                showVerificationOverlay(context);
            } else {
                if (context === 'delete-account') {
                    submitDeleteAccount();
                }
            }
        } else {
            console.error('Failed to check 2FA status.');
        }
    } catch (error) {
        console.error('Error checking 2FA status:', error);
    }
}


function showVerificationOverlay(context) {
    const overlay = document.getElementById('verify-2fa-overlay');
    overlay.classList.remove('hidden');
    overlay.dataset.context = context; 
}


async function submitVerificationCode() {
    const overlay = document.getElementById('verify-2fa-overlay');
    const input = overlay.querySelector('#verification-passcode');
    const passcode = input.value.trim();

    if (!passcode) {
        // alert('Please enter the verification code.');
        showMessage('verify-2fa-message-container', 'Please enter the verification code.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/verify_2fa/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ passcode }),
            credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
            // alert('2FA verification successful.');
            showMessage('verify-2fa-message-container', '2FA verification successful.');
            overlay.classList.add('hidden');

            const context = overlay.dataset.context;
            if (context === 'delete-account') {
                submitDeleteAccount(passcode);
            }
        } else {
            // alert(data.message || 'Invalid code. Please try again.');
            showMessage('verify-2fa-message-container', data.message || 'Invalid code. Please try again.', true);
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        // alert('An error occurred. Please try again.');
        showMessage('verify-2fa-message-container', 'An error occurred. Please try again.', true);
    }
}


















async function fetchFriendRequests() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/friend_requests/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Fetched friend requests:', data); 
            updateFriendRequests(data);
        } else {
            console.error('Failed to fetch friend requests');
        }
    } catch (error) {
        console.error('Error fetching friend requests:', error);
    }
}

function updateFriendRequests(data) {
    const requestsList = document.querySelector('.friend-requests-list');
    requestsList.innerHTML = ''; 

    if (data.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'No friend requests found.';
        requestsList.appendChild(emptyMessage);
        return;
    }

    data.forEach(request => {
        const requestItem = document.createElement('li');
        requestItem.classList.add('friend-request-item');
        requestItem.innerHTML = `
            <div class="friend-username">${request.username}</div>
            <div class="friend-request-actions">
                <button class="btn" onclick="acceptFriendRequest('${request.username}')">
                    <img src="/img/check1.png" alt="Accept">
                </button>
                <button class="btn" onclick="rejectFriendRequest('${request.username}')">
                    <img src="/img/cross.png" alt="Reject">
                </button>
            </div>
        `;
        requestsList.appendChild(requestItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const friendsIcon = document.querySelector('#friends-icon');
    if (friendsIcon) {
        friendsIcon.addEventListener('click', async () => {
            showForm('friends');
            await fetchFriendRequests();
        });
    }
});

function showFriendRequest() {
    const overlay = document.getElementById('friend-request-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    fetchFriendRequests();
}

function closeOverlay5() {
    const overlay = document.getElementById('friend-request-overlay');
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
}








// function showFriendRequest() {
//     const overlay = document.getElementById('friend-request-overlay');
//     overlay.classList.remove('hidden');
//     overlay.setAttribute('aria-hidden', 'false');
// }


async function acceptFriendRequest(username) {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/accept_friend_request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username }),
            credentials: 'include'
        });

        if (response.ok) {
            console.log(`Accepted friend request from ${username}`);
            removeFriendRequest(username);
            loadFriendsList();
        } else {
            const data = await response.json();
            console.error(data.message || 'Failed to accept friend request');
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}


async function rejectFriendRequest(username) {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/reject_friend_request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username }),
            credentials: 'include'
        });

        if (response.ok) {
            console.log(`Rejected friend request from ${username}`);
            removeFriendRequest(username);
        } else {
            const data = await response.json();
            console.error(data.message || 'Failed to reject friend request');
        }
    } catch (error) {
        console.error('Error rejecting friend request:', error);
    }
}


function removeFriendRequest(username) {
    const requestsList = document.querySelector('.friend-requests-list');
    const requestItem = [...requestsList.children].find(item =>
        item.querySelector('.friend-username').textContent === username
    );
    if (requestItem) {
        requestsList.removeChild(requestItem);
    }
}


// async function fetchFriendRequests() {
//     try {
//         const token = localStorage.getItem('jwtToken');
//         const response = await fetch('/accounts/api/friend_requests/', {
//             method: 'GET',
//             headers: {
//                 'X-CSRFToken': getCsrfToken(),
//                 'Authorization': `Bearer ${token}`
//             },
//             credentials: 'include'
//         });

//         if (response.ok) {
//             const data = await response.json();
//             updateFriendRequests(data);
//         } else {
//             console.error('Failed to fetch friend requests');
//         }
//     } catch (error) {
//         console.error('Error fetching friend requests:', error);
//     }
// }


// function updateFriendRequests(data) {
//     const requestsList = document.querySelector('.friend-requests-list');
//     requestsList.innerHTML = '';

//     data.forEach(request => {
//         const requestItem = document.createElement('div');
//         requestItem.classList.add('friend-request-item');
//         requestItem.innerHTML = `
//             <span class="friend-username">${request.username}</span>
//             <div class="friend-request-actions">
//                 <button class="accept-btn" onclick="acceptFriendRequest('${request.username}')">
//                     <img src="{% static 'accounts/img/accept.png' %}" alt="Accept">
//                 </button>
//                 <button class="reject-btn" onclick="rejectFriendRequest('${request.username}')">
//                     <img src="{% static 'accounts/img/decline.png' %}" alt="Reject">
//                 </button>
//             </div>
//         `;
//         requestsList.appendChild(requestItem);
//     });
// }


// document.addEventListener('DOMContentLoaded', () => {
//     const friendsIcon = document.querySelector('#friends-icon');
//     if (friendsIcon) {
//         friendsIcon.addEventListener('click', async () => {
//             showForm('friends');
//             await fetchFriendRequests();
//         });
//     }
// });

// function closeOverlay5() {
//     const overlay = document.getElementById('friend-request-overlay');
//     overlay.classList.add('hidden');
//     overlay.setAttribute('aria-hidden', 'true');
// }


function showAddFriend() {
    const overlay = document.getElementById('add-friend-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
}


function closeOverlay6() {
    const overlay = document.getElementById('add-friend-overlay');
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
}


async function submitAddFriend() {
    const input = document.getElementById('add-friend-username');
    const username = input.value.trim();

    showMessage('add-friend-message-container', '');

    if (!username) {
        // alert('Please enter a username.');
        showMessage('add-friend-message-container', 'Please enter a username.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/add_friend/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            // alert('Friend request sent successfully.');
            showMessage('add-friend-message-container', 'Friend request sent successfully.');
            closeOverlay6();
        } else {
            // alert(data.message || 'Failed to send friend request. Please try again.');
            showMessage('add-friend-message-container', data.message || 'Failed to send friend request. Please try again.', true);
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
        // alert('An error occurred. Please try again.');
        showMessage('add-friend-message-container', 'An error occurred. Please try again.', true);
    }
}


function showRemoveFriend() {
    const overlay = document.getElementById('remove-friend-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
}

function closeOverlay7() {
    const overlay = document.getElementById('remove-friend-overlay');
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
}


async function submitRemoveFriend() {
    const input = document.getElementById('remove-friend-username');
    const username = input.value.trim();

    showMessage('remove-friend-message-container', '');

    if (!username) {
        // alert('Please enter a username.');
        showMessage('remove-friend-message-container', 'Please enter a username.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/remove_friend/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            // alert('Friend removed successfully.');
            showMessage('remove-friend-message-container', 'Friend removed successfully.');
            closeOverlay7();
        } else {
            // alert(data.message || 'Failed to remove friend. Please try again.');
            showMessage('remove-friend-message-container', data.message || 'Failed to remove friend. Please try again.', true);
        }
    } catch (error) {
        console.error('Error removing friend:', error);
        // alert('An error occurred. Please try again.');
        showMessage('remove-friend-message-container', 'An error occurred. Please try again.', true);
    }
}


function showMyFriends() {
    const overlay = document.getElementById('my-friends-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    loadFriendsList();
}


function closeOverlay8() {
    const overlay = document.getElementById('my-friends-overlay');
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
}


async function loadFriendsList() {

    showMessage('my-friends-message-container', '');

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/get_friends/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            const friendList = document.querySelector('#my-friends-overlay .friend-list');
            friendList.innerHTML = ''; 

            data.friends.forEach(friend => {
                const listItem = document.createElement('li');
                const statusClass = friend.is_online ? 'online' : 'offline';
                const statusText = friend.is_online ? 'Online' : 'Offline';
                listItem.innerHTML = `
                    <div class="friend-item">
                        <div class="friend-username">${friend.username}</div>
                        <div class="friend-status ${statusClass}">${statusText}</div>
                    </div>
                `;
                friendList.appendChild(listItem);
            });
        } else {
            // alert(data.message || 'Failed to load friends list. Please try again.');
            showMessage('my-friends-message-container', data.message || 'Failed to load friends list. Please try again.', true);
        }
    } catch (error) {
        console.error('Error loading friends list:', error);
        // alert('An error occurred. Please try again.');
        showMessage('my-friends-message-container', 'An error occurred. Please try again.', true);
    }
}


async function removeFriend(username) {
    if (!confirm(`Are you sure you want to remove ${username} from your friends?`)) {
        return;
    }

    showMessage('my-friends-message-container', '');

    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/remove_friend/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            // alert('Friend removed successfully.');
            showMessage('my-friends-message-container', 'Friend removed successfully.');
            loadFriendsList(); 
        } else {
            // alert(data.message || 'Failed to remove friend. Please try again.');
            showMessage('my-friends-message-container', data.message || 'Failed to remove friend. Please try again.', true);
        }
    } catch (error) {
        console.error('Error removing friend:', error);
        // alert('An error occurred. Please try again.');
        showMessage('my-friends-message-container', 'An error occurred. Please try again.', true);
    }
}









document.addEventListener('DOMContentLoaded', function () {
    const leaderboardList = document.querySelector('.leaderboard-list');

    if (leaderboardList) {
        leaderboardList.addEventListener('click', async function (event) {
            const clickedItem = event.target.closest('li');
            if (clickedItem) {
                const username = clickedItem.querySelector('.username').textContent.trim();

                console.log('Fetching profile data for:', username);

                showMessage('user-profile-message-container', '');

                try {
                    const token = localStorage.getItem('jwtToken');
                    const response = await fetch(`/api/profile/${username}/`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                    });

                    console.log('API Response:', response);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Parsed Response Data:', data);

                    if (data.status === 'success') {
                        const overlay = document.getElementById('user-profile-overlay');
                        const profileAvatarImg = document.querySelector('#profile-useravatar-img img');
                        const displayUsername = document.getElementById('display-userusername');
                        const displayEmail = document.getElementById('display-useremail');
                        const displayScore = document.getElementById('display-userscore');
                        const addFriendButton = document.getElementById('addfrnd');

                        profileAvatarImg.src = data.profile_picture || '/img/default-avatar.jpg';
                        displayUsername.textContent = data.user.username;
                        displayEmail.textContent = data.user.email;
                        displayScore.textContent = data.level;

                        overlay.classList.remove('hidden');
                        overlay.setAttribute('aria-hidden', 'false');

                        if (data.is_self) {
                            addFriendButton.style.display = 'none';
                        } else if (data.is_friend) {
                            addFriendButton.textContent = 'Already Friends';
                            addFriendButton.disabled = true;
                            addFriendButton.style.display = 'block';
                        } else {
                            addFriendButton.textContent = 'Add Friend';
                            addFriendButton.disabled = false;
                            addFriendButton.style.display = 'block';
                        }

                        console.log('API Response Data:', data);
                        console.log('is_self:', data.is_self, 'is_friend:', data.is_friend);

                        console.log('Overlay displayed successfully.');
                    } else {
                        console.error('Error fetching profile:', data.message);
                        // alert('Error fetching profile data. Please try again later.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    // alert('An unexpected error occurred. Please try again.');
                }
            }
        });
    } else {
        console.log('Leaderboard list not found.');
    }

    console.log('DOM Loaded: Checking for addfrnd button.');
    const addFriendButton = document.getElementById('addfrnd');

    console.log('Add Friend Button:', addFriendButton);

    if (addFriendButton) {
        addFriendButton.addEventListener('click', async function () {
            const username = document.getElementById('display-userusername').textContent.trim();
            console.log('Revealing overlay for user profile:', username);
            console.log('Add Friend Button after overlay shown:', addFriendButton);

            showMessage('user-profile-message-container', '');

            try {
                const csrfToken = getCsrfToken();
                const token = localStorage.getItem('jwtToken');
                console.log('Using CSRF Token:', csrfToken);

                const response = await fetch(`/api/add-friend/${username}/`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({}),
                });

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    console.log('Response data:', data);

                    if (response.ok) {
                        showMessage('user-profile-message-container', data.message || 'Friend request sent successfully!');
                        addFriendButton.textContent = 'Friend Request Sent';
                        addFriendButton.disabled = true;
                    } else {
                        showMessage('user-profile-message-container', data.error || 'Failed to send friend request.', true);
                    }
                } else {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    showMessage('user-profile-message-container', 'Server returned an invalid response. Please try again.', true);
                }
            } catch (error) {
                console.error('Error sending friend request:', error);
                showMessage('user-profile-message-container', 'An unexpected error occurred. Please try again.', true);
            }
        });
    }
});




// document.addEventListener('DOMContentLoaded', function () {
//     const leaderboardList = document.querySelector('.leaderboard-list');

//     if (leaderboardList) {
//         leaderboardList.addEventListener('click', async function (event) {
//             const clickedItem = event.target.closest('li');
//             if (clickedItem) {
//                 const username = clickedItem.querySelector('.username').textContent.trim();

//                 console.log('Fetching profile data for:', username);

//                 try {
//                     const response = await fetch(`/api/profile/${username}/`, {
//                         method: 'GET',
//                         headers: {
//                             'Content-Type': 'application/json',
//                         },
//                     });

//                     console.log('API Response:', response);

//                     if (!response.ok) {
//                         throw new Error(`HTTP error! status: ${response.status}`);
//                     }

//                     const data = await response.json();
//                     console.log('Parsed Response Data:', data);

//                     if (data.status === 'success') {
//                         const overlay = document.getElementById('user-profile-overlay');
//                         const profileAvatarImg = document.querySelector('#profile-useravatar-img img');
//                         const displayUsername = document.getElementById('display-userusername');
//                         const displayEmail = document.getElementById('display-useremail');
//                         const displayScore = document.getElementById('display-userscore');
//                         const addFriendButton = document.getElementById('addfrnd');

                        
//                         addFriendButton.style.display = 'none'; 
//                         addFriendButton.disabled = false;
//                         addFriendButton.textContent = ''; 

//                         profileAvatarImg.src = data.profile_picture || '/img/default-avatar.jpg';
//                         displayUsername.textContent = data.user.username;
//                         displayEmail.textContent = data.user.email;
//                         displayScore.textContent = data.level;

//                         overlay.classList.remove('hidden');
//                         overlay.setAttribute('aria-hidden', 'false');

            
//                         if (data.is_self) {
//                             addFriendButton.style.display = 'none';
//                         } else if (data.is_friend) {
//                             addFriendButton.textContent = 'Already Friend';
//                             addFriendButton.disabled = true;
//                             addFriendButton.style.display = 'block';
//                         } else {
//                             addFriendButton.textContent = 'Add Friend';
//                             addFriendButton.disabled = false;
//                             addFriendButton.style.display = 'block';
//                         }
                        
//                         console.log('API Response Data:', data);
//                         console.log('is_self:', data.is_self, 'is_friend:', data.is_friend);

//                         console.log('Overlay displayed successfully.');
//                     } else {
//                         console.error('Error fetching profile:', data.message);
//                         // alert('Error fetching profile data. Please try again later.');
        
//                     }
//                 } catch (error) {
//                     console.error('Error:', error);
//                     // alert('An unexpected error occurred. Please try again.');
//                 }
//             }
//         });
//     } else {
//         console.log('Leaderboard list not found.');
//     }
//     console.log('DOM Loaded: Checking for addfrnd button.');
//     const addFriendButton = document.getElementById('addfrnd');

//     console.log('Add Friend Button:', addFriendButton);
    


//     if (addFriendButton) {
//         addFriendButton.addEventListener('click', async function () {
//             const username = document.getElementById('display-userusername').textContent.trim();
//             console.log('Revealing overlay for user profile:', username);
//             console.log('Add Friend Button after overlay shown:', addFriendButton);

           

//             try {
//                 const csrfToken = getCsrfToken();
//                 console.log('Using CSRF Token:', csrfToken); 
                
//                 const response = await fetch(`/api/add-friend/${username}/`, {
//                     method: 'POST',
//                     headers: {
//                         'Accept': 'application/json',
//                         'Content-Type': 'application/json',
//                         'X-CSRFToken': csrfToken,
//                     },
//                     credentials: 'same-origin', 
//                     body: JSON.stringify({}), 
//                 });
                
                
//                 const contentType = response.headers.get('content-type');
//                 if (contentType && contentType.includes('application/json')) {
//                     const data = await response.json();
//                     console.log('Response data:', data);
                    
//                     if (response.ok) {
//                         // alert(data.message || 'Friend request sent successfully!');
//                         showMessage('user-profile-message-container', data.message || 'Friend request sent successfully!');
//                         addFriendButton.textContent = 'Already Friends';
//                         addFriendButton.disabled = true;
//                     } else {
//                         // alert(data.error || 'Failed to send friend request.');
//                         showMessage('user-profile-message-container', data.error || 'Failed to send friend request.', true);
//                     }
//                 } else {
//                     const text = await response.text();
//                     console.error('Non-JSON response:', text);
//                     // alert('Server returned an invalid response. Please try again.');
//                     showMessage('user-profile-message-container', 'Server returned an invalid response. Please try again.', true);
//                 }
//             } catch (error) {
//                 console.error('Error sending friend request:', error);
//                 // alert('An unexpected error occurred. Please try again.');
//                 showMessage('user-profile-message-container', 'An unexpected error occurred. Please try again.', true);
//             }
//         });
//     }
// });

function closeOverlay9() {
    const overlay = document.getElementById('user-profile-overlay');
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
}





document.addEventListener('DOMContentLoaded', function () {
    const joinTournamentButton = document.getElementById('jointrnmt');

    if (joinTournamentButton) {
        joinTournamentButton.addEventListener('click', function () {
            
            const gameModeSection = document.getElementById('game-selection');
            if (gameModeSection) {
                gameModeSection.style.display = 'none';
            }

            
            const tournamentRegistrationSection = document.getElementById('tournament-registration');
            if (tournamentRegistrationSection) {
                tournamentRegistrationSection.style.display = 'flex'; 
            }

            
            history.pushState(
                { section: 'tournament-registration' },
                '',
                '#tournament-registration'
            );
        });
    }
});


