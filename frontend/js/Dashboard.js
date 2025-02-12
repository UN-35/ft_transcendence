
// function updateCircleProgress(circleId, rate) {
//     const circle = document.getElementById(circleId);
//     const percentageText = circle.querySelector(".percentage"); 


//     const filledDegree = rate * 3.6;


//     circle.style.background = `conic-gradient(
// rgb(164, 17, 63) ${filledDegree}deg, /* red for the filled part */
// rgb(9, 6, 16) ${filledDegree}deg /* gray for the unfilled part */
//     )`;

//     percentageText.textContent = `${rate}%`;
// }


// function initProgressCircles() {
//     const winRate = 75; 
//     const loseRate = 50; 

    
//     updateCircleProgress("winRateCircle", winRate);
//     updateCircleProgress("loseRateCircle", loseRate);
// }


// document.addEventListener("DOMContentLoaded", initProgressCircles);


function updateCircleProgress(circleId, rate) {
    const circle = document.getElementById(circleId); 
    const percentageText = circle.querySelector(".percentage"); 

    const filledDegree = rate * 3.6;

    circle.style.background = `conic-gradient(
        rgb(164, 17, 63) ${filledDegree}deg, /* red for the filled part */
        rgb(9, 6, 16) ${filledDegree}deg /* no color for the unfilled part */
    )`;

    percentageText.textContent = `${rate}%`;
}

function initProgressCircles(winRate, loseRate) {
    updateCircleProgress("winRateCircle", winRate);
    updateCircleProgress("loseRateCircle", loseRate);
}

async function fetchLeaderboardData() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/leaderboard/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        updateLeaderboard(data);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
}

function updateLeaderboard(data) {
    const leaderboardList = document.querySelector('.leaderboard-list');
    leaderboardList.innerHTML = ''; 

    data.forEach((user, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="info-user">
                <div class="rank">${index + 1}</div>
                <div class="user-img">
                    <img src="${user.avatar}" alt="User">
                </div>
                <div class="username">${user.username}</div>
            </div>
            <div class="xp">${user.xp} xp</div>
        `;
        leaderboardList.appendChild(listItem);
    });
}

async function fetchStatsData() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/stats/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch stats data');
        }
        const data = await response.json();
        updateStats(data);
    } catch (error) {
        console.error('Error fetching stats data:', error);
    }
}

function updateStats(data) {
    document.querySelector('.stats .level .value').textContent = data.level;
    initProgressCircles(data.winRate, data.loseRate);
}

// async function fetchGameHistoryData() {
//     try {
//         const response = await fetch('/accounts/api/game_history/');
//         if (!response.ok) {
//             throw new Error('Failed to fetch game history data');
//         }
//         const data = await response.json();
//         updateGameHistory(data);
//     } catch (error) {
//         console.error('Error fetching game history data:', error);
//     }
// }

// function updateGameHistory(data) {
//     const gameHistoryTable = document.querySelector('.game-history tbody');
//     gameHistoryTable.innerHTML = ''; 

//     data.forEach(game => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td><img src="${game.userAvatar}" alt="User"> ${game.username}</td>
//             <td>${game.time}</td>
//             <td>${game.type}</td>
//             <td>${game.status}</td>
//         `;
//         gameHistoryTable.appendChild(row);
//     });
// }

async function fetchMatchHistoryData() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/game_history/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch match history data');
        }
        const data = await response.json();
        updateMatchHistory(data);
    } catch (error) {
        console.error('Error fetching match history data:', error);
    }
}

function updateMatchHistory(data) {
    const matchHistoryTable = document.querySelector('.match-history tbody');
    matchHistoryTable.innerHTML = ''; 

    data.forEach(match => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${match.opponentAvatar}" alt="Opponent"> ${match.opponentUsername}</td>
            <td>${match.date}</td>
            <td>${match.type}</td>
            <td>${match.result}</td>
            <td>${match.score}</td>
        `;
        matchHistoryTable.appendChild(row);
    });
}

async function fetchProfileDataofDash() {
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch('/accounts/api/profile/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        updateProfileAvatar(data);
    } catch (error) {
        console.error('Error fetching profile data:', error);
    }
}

function updateProfileAvatar(data) {
    const profileAvatarImg = document.querySelector('.profile-avatar img');
    if (profileAvatarImg) {
        profileAvatarImg.src = data.profile_picture || '/img/avatar.png';
    }

    const dashboardProfileAvatarImg = document.querySelector('.stats .profile-avatar img');
    if (dashboardProfileAvatarImg) {
        dashboardProfileAvatarImg.src = data.profile_picture || '/img/avatar.png';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('dashboard');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                fetchLeaderboardData();
                fetchStatsData();
                fetchMatchHistoryData();
                fetchProfileDataofDash();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(dashboard);
});









