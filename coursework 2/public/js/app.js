// ===== CONFIGURATION =====
const API = '/M01010322';

// ===== DOM ELEMENTS =====
// Auth elements
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginStatus = document.getElementById('loginStatus');
const registerForm = document.getElementById('registerForm');
const registerMsg = document.getElementById('registerMsg');
const loginForm = document.getElementById('loginForm');
const loginMsg = document. getElementById('LoginMsg');
const headerAuthBtn = document.getElementById('headerAuthBtn');

// Community/Feed elements
const postForm = document.getElementById('postForm');
const postMsg = document.getElementById('postMsg');
const userSearchForm = document.getElementById('userSearchForm');
const userResults = document.getElementById('userResults');
const refreshFeedBtn = document.getElementById('refreshFeedBtn');
const feedList = document.getElementById('feedList');
const uploadForm = document.getElementById('uploadForm');
const uploadMsg = document.getElementById('uploadMsg');
const uploadGallery = document.getElementById('uploadGallery');


// Navigation elements
const navNews = document.getElementById('navNews');
const navTeam = document.getElementById('navTeam');
const navMatches = document.getElementById('navMatches');
const navCommunity = document.getElementById('navCommunity');

// Section elements
const heroSection = document.getElementById('heroSection');
const mainContent = document.getElementById('mainContent');
const newsSection = document.getElementById('newsSection');
const teamSection = document.getElementById('teamSection');
const matchesSection = document.getElementById('matchesSection');

// Content containers
const newsGrid = document.getElementById('newsGrid');
const squadGrid = document.getElementById('squadGrid');
const coachCard = document.getElementById('coachCard');
const refreshNewsBtn = document.getElementById('refreshNews');
const refreshScoresBtn = document.getElementById('refreshScores');

// ===== HELPER FUNCTIONS =====
function setMsg(element, text, type) {
    element.textContent = text;
    element.className = `msg ${type}`;
}

function hideAllSections() {
    if (heroSection) heroSection.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';
    if (newsSection) {
        newsSection.classList.add('hidden');
        newsSection.style.display = 'none';
    }
    if (teamSection) {
        teamSection.classList.add('hidden');
        teamSection.style.display = 'none';
    }
    if (matchesSection) {
        matchesSection.classList.add('hidden');
        matchesSection.style.display = 'none';
    }
}

// ===== NAVIGATION HANDLERS =====

// NEWS Navigation
if (navNews) {
    navNews.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('NEWS clicked! ');
        
        hideAllSections();
        
        if (newsSection) {
            newsSection.classList.remove('hidden');
            newsSection.style.display = 'block';
        }
        
        loadNews();
    });
}

// TEAM Navigation
if (navTeam) {
    navTeam.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('TEAM clicked!');
        
        hideAllSections();
        
        if (teamSection) {
            teamSection.classList.remove('hidden');
            teamSection.style.display = 'block';
        }
        
        loadTeam();
    });
}

// MATCHES Navigation
if (navMatches) {
    navMatches.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('MATCHES clicked!');
        
        hideAllSections();
        
        if (matchesSection) {
            matchesSection.classList. remove('hidden');
            matchesSection.style.display = 'block';
        }
        
        loadLiveScores();
    });
}

// COMMUNITY Navigation
if (navCommunity) {
    navCommunity.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('COMMUNITY clicked!');
        
        hideAllSections();
        
        if (heroSection) heroSection.style.display = 'block';
        if (mainContent) mainContent.style.display = 'block';
    });
}

// ===== AUTH FUNCTIONS =====

async function checkLogin() {
    try {
        const res = await fetch(`${API}/login`);
        const data = await res.json();
        if (data.loggedIn) {
            showApp(data.user.username);
        } else {
            showAuth();
        }
    } catch (err) {
        console.error('Error checking login:', err);
        showAuth();
    }
}

function showApp(username) {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    if (loginStatus) loginStatus.textContent = `Welcome, ${username}`;
    
    headerAuthBtn.textContent = '🚪 Logout';
    headerAuthBtn.onclick = handleLogout;
    loadFeed();
}

function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    if (loginStatus) loginStatus.textContent = '';
    
    headerAuthBtn.textContent = '👤 Sign in';
    headerAuthBtn.onclick = () => {
        document.getElementById('authSection').scrollIntoView({ behavior: 'smooth' });
    };
}

async function handleLogout() {
    try {
        await fetch(`${API}/login`, { method: 'DELETE' });
        showAuth();
    } catch (err) {
        console.error('Logout error:', err);
    }
}

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const res = await fetch(`${API}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:  JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.ok) {
            setMsg(registerMsg, 'Account created!  Login now.', 'success');
            registerForm.reset();
        } else {
            setMsg(registerMsg, data.error, 'error');
        }
    } catch (err) {
        setMsg(registerMsg, 'Network error', 'error');
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.ok) {
            loginForm.reset();
            loginMsg.textContent = '';
            loginMsg.className = 'msg';
            checkLogin();
        } else {
            setMsg(loginMsg, data.error, 'error');
        }
    } catch (err) {
        setMsg(loginMsg, 'Network error', 'error');
    }
});

// ===== COMMUNITY FEATURES =====

// Post
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(postForm);
    const content = formData.get('text');
    
    try {
        const res = await fetch(`${API}/contents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:  JSON.stringify({ content })
        });
        const data = await res.json();
        if (data.ok) {
            setMsg(postMsg, 'Posted!', 'success');
            postForm.reset();
            loadFeed();
        } else {
            setMsg(postMsg, data.error, 'error');
        }
    } catch (err) {
        setMsg(postMsg, 'Network error', 'error');
    }
});

// Upload
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = uploadForm.querySelector('input[type="file"]');
    const captionInput = uploadForm.querySelector('#imageCaption');  
    const file = fileInput.files[0];
    
    if (!file) {
        setMsg(uploadMsg, 'No file selected', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        const base64Data = event.target.result;
        
        try {
            const res = await fetch(`${API}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body:  JSON.stringify({
                    filename: file.name,
                    data: base64Data,
                    caption: captionInput.value || ''  
                })
            });
            const data = await res.json();
            
            if (data.ok) {
                setMsg(uploadMsg, 'Image uploaded and shared!  ', 'success');
                uploadForm.reset();
                
                
                loadFeed();
            } else {
                setMsg(uploadMsg, data.error, 'error');
            }
        } catch (err) {
            console.error(err);
            setMsg(uploadMsg, 'Upload failed', 'error');
        }
    };
    
    reader.readAsDataURL(file);
});

// Load feed
async function loadFeed() {
    try {
        const res = await fetch(`${API}/feed`);
        const data = await res.json();
        if (data.ok) {
            feedList.innerHTML = '';
            if (data.posts.length === 0) {
                feedList.innerHTML = '<li>No posts yet.   Follow users to see their posts!</li>';
                return;
            }
            data.posts.forEach(post => {
                const li = document.createElement('li');
                
                
                const imageHTML = post.imageUrl ? 
                    `<div class="post-image">
                        <img src="${post.imageUrl}" alt="Post image" />
                    </div>` : '';
                
                li.innerHTML = `
                    <div class="post-header">
                        <strong class="post-author">@${post.username}</strong>
                        <span class="post-time">${new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="post-content">${post.content}</p>
                    ${imageHTML}
                `;
                feedList.appendChild(li);
            });
        }
    } catch (err) {
        console.error('Error loading feed:', err);
    }
}

// Search users
if (userSearchForm) {
    userSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(userSearchForm);
        const q = formData.get('q');
        
        if (!q || q.trim() === '') {
            userResults.innerHTML = '<li>Please enter a search term</li>';
            return;
        }
    try {
        const res = await fetch(`${API}/users?q=${encodeURIComponent(q)}`);
        console.log('Search response:', res.status);

        const data = await res.json();
        console.log('Search data:', data);

        userResults.innerHTML = '';

        if (! data.results || data.results.length === 0) {
            userResults.innerHTML = '<li>No users found</li>';
            return;
        }

        data.results.forEach(user => {
            const li = document.createElement('li');

            const userSpan = document.createElement('span');
                userSpan.textContent = `@${user.username}`;
                
                const followBtn = document.createElement('button');
                followBtn.className = 'rm-btn-secondary';
                followBtn.textContent = 'Follow';
                
                
                followBtn.addEventListener('click', () => {
                    followUser(user. username);
                });
                
                li.appendChild(userSpan);
                li.appendChild(followBtn);
                userResults.appendChild(li);
            });
        } catch (err) {
            console.error('Error searching users:', err);
            userResults.innerHTML = '<li style="color: red;">Error searching users</li>';
        }
    });
} else {
    console.error('userSearchForm not found! ');
}

// ===== FOLLOW USER =====
async function followUser(username) {
    console.log('Following', username);

    if (!username) {
        console.error('No username provided');
        return;
    }

    try {
        const res = await fetch(`${API}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await res.json();
        console.log('Follow response:', data);

        if (res. status === 401) {
            console.log('Not logged in');
            return;
        }
        
        if (data.ok) {
            console.log(`Now following @${username}`);

            // Update button state
            const buttons = document.querySelectorAll(`button`);
            buttons.forEach(btn => {
                if (btn.textContent.trim() === 'Follow') {
                    const parent = btn.parentElement;
                    const userSpan = parent.querySelector('span');
                    if (userSpan && userSpan.textContent === `@${username}`) {
                        btn.textContent = '✓ Following';
                        btn.disabled = true;
                        btn.style.opacity = '0.6';
                    }
                }
            });
            
            // Reload feed silently
            if (typeof loadFeed === 'function') {
                loadFeed();
            }
        } else {
            console.error('Follow failed:', data.error);
        }
    } catch (err) {
        console.error('Follow error:', err);
    }
}

// ===== LIVE SCORES =====

async function loadLiveScores() {
    const scoresContainer = document.getElementById('liveScores');
    
    if (!scoresContainer) {
        console.error('liveScores container not found');
        return;
    }
    
    scoresContainer.innerHTML = '<p class="loading">Loading matches...</p>';
    
    try {
        console.log('Fetching Real Madrid matches from backend...');
        
        const response = await fetch(`${API}/matches`);
        console.log('Response status:', response.status);
        
        if (! response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Matches data:', data);
        
        if (data.ok && data.matches && data.matches.length > 0) {
            scoresContainer.innerHTML = data.matches.map(match => {
                const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
                const homeTeam = match.homeTeam.name;
                const awayTeam = match.awayTeam.name;
                const homeScore = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? '-';
                const awayScore = match.score?.fullTime?.away ?? match.score?.halfTime?.away ??  '-';
                
                let statusText = '';
                if (match.status === 'FINISHED') statusText = 'Full Time';
                else if (match.status === 'IN_PLAY') statusText = '🔴 LIVE';
                else if (match.status === 'PAUSED') statusText = 'Half Time';
                else if (match.status === 'SCHEDULED' || match.status === 'TIMED') {
                    const matchDate = new Date(match.utcDate);
                    statusText = matchDate.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    statusText = match.status;
                }
                
                return `
                    <div class="match-item ${isLive ? 'live' : ''}">
                        <div class="match-teams">
                            <div class="team-row">
                                <img src="${match.homeTeam.crest || ''}" class="team-logo" alt="${homeTeam}" onerror="this.style.display='none'">
                                <span class="team-name">${homeTeam}</span>
                            </div>
                            <div class="team-row">
                                <img src="${match.awayTeam.crest || ''}" class="team-logo" alt="${awayTeam}" onerror="this.style.display='none'">
                                <span class="team-name">${awayTeam}</span>
                            </div>
                            <div class="match-status ${isLive ? 'live' : ''}">${statusText}</div>
                        </div>
                        <div class="match-score">
                            ${homeScore} - ${awayScore}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            scoresContainer.innerHTML = '<p class="loading">📅 No upcoming matches scheduled</p>';
        }
    } catch (error) {
        console.error('Detailed error loading scores:', error);
        
        let errorMsg = 'Unable to load scores. ';
        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Backend server may not be running. ';
        } else {
            errorMsg += 'Please try again later.';
        }
        
        scoresContainer.innerHTML = `<p class="loading">${errorMsg}</p>`;
    }
}

if (refreshScoresBtn) {
    refreshScoresBtn.addEventListener('click', loadLiveScores);
}

// ===== TEAM/SQUAD =====

async function loadTeam() {
    if (! squadGrid) return;
    
    squadGrid.innerHTML = '<p class="loading">Loading squad...</p>';
    if (coachCard) coachCard.innerHTML = '';
    
    try {
        console.log('Fetching Real Madrid squad from backend...');
        
        const response = await fetch(`${API}/team`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Squad data:', data);
        
        // Display Coach
        if (data.ok && data.coach && coachCard) {
            coachCard.innerHTML = `
                <div class="coach-icon">👨‍💼</div>
                <div class="coach-info">
                    <h3>Head Coach</h3>
                    <p><strong>${data.coach.name || 'Unknown'}</strong></p>
                    <p>${data.coach.nationality || ''}</p>
                </div>
            `;
        }
        
        // Display Players
        if (data.ok && data.squad && data.squad.length > 0) {
            const positions = {
                'Goalkeeper': [],
                'Defence': [],
                'Midfield': [],
                'Offence': []
            };
            
            data.squad.forEach(player => {
                const pos = player.position || 'Unknown';
                if (positions[pos]) {
                    positions[pos].push(player);
                } else {
                    if (pos.includes('Back') || pos.includes('Defender')) {
                        positions['Defence'].push(player);
                    } else if (pos.includes('Midfield')) {
                        positions['Midfield'].push(player);
                    } else if (pos.includes('Forward') || pos.includes('Winger')) {
                        positions['Offence'].push(player);
                    } else {
                        positions['Midfield'].push(player);
                    }
                }
            });
            
            let html = '';
            
            Object.keys(positions).forEach(position => {
                if (positions[position].length > 0) {
                    html += `<div class="position-group" style="grid-column: 1 / -1;">
                        <h3 style="color: var(--rm-blue); margin:  20px 0 16px; font-size: 1.3rem;">
                            ${getPositionIcon(position)} ${position}
                        </h3>
                    </div>`;
                    
                    positions[position].forEach(player => {
                        html += createPlayerCard(player);
                    });
                }
            });
            
            squadGrid.innerHTML = html;
        } else {
            squadGrid.innerHTML = '<p class="loading">No squad data available</p>';
        }
    } catch (error) {
        console.error('Error loading team:', error);
        squadGrid.innerHTML = '<p class="loading">Unable to load squad. Please try again later.</p>';
    }
}

function createPlayerCard(player) {
    const name = player.name || 'Unknown';
    const position = player.position || 'Unknown';
    const number = player.shirtNumber || '? ';
    const nationality = player.nationality || '';
    const dateOfBirth = player.dateOfBirth ? new Date(player.dateOfBirth).getFullYear() : '';
    const age = dateOfBirth ? new Date().getFullYear() - dateOfBirth :  '';
    
    return `
        <div class="player-card">
            <div class="player-image">
                <span class="player-placeholder">⚽</span>
                <div class="player-number">${number}</div>
            </div>
            <div class="player-info">
                <h4 class="player-name">${name}</h4>
                <p class="player-position">${position}</p>
                <p class="player-nationality">🌍 ${nationality}</p>
                ${age ?  `<div class="player-meta"><span>Age: ${age}</span></div>` : ''}
            </div>
        </div>
    `;
}

function getPositionIcon(position) {
    const icons = {
        'Goalkeeper':  '🧤',
        'Defence': '🛡️',
        'Midfield': '⚙️',
        'Offence': '⚡'
    };
    return icons[position] || '⚽';
}

// ===== NEWS =====

async function loadNews() {
    if (!newsGrid) return;
    
    newsGrid.innerHTML = '<p class="loading">Loading news...</p>';
    
    try {
        console.log('Fetching Real Madrid news from backend...');
        
        const response = await fetch(`${API}/news`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('News data:', data);
        
        if (data.ok && data.articles && data.articles.length > 0) {
            newsGrid.innerHTML = data.articles.map(article => {
                const title = article.title || 'No title';
                const description = article.description || 'No description available';
                const image = article.urlToImage || null;
                const source = article.source?.name || 'Unknown Source';
                const publishedAt = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : '';
                const url = article.url || '#';
                
                return `
                    <article class="news-card">
                        <div class="news-image">
                            ${image ? 
                                `<img src="${image}" alt="${title}" onerror="this.parentElement.innerHTML='<div class=\\'news-placeholder\\'>📰</div>'">` :
                                '<div class="news-placeholder">📰</div>'
                            }
                        </div>
                        <div class="news-content">
                            <div class="news-source">${source}</div>
                            <h3 class="news-title">${title}</h3>
                            <p class="news-description">${description.substring(0, 150)}${description.length > 150 ?  '...' : ''}</p>
                            <div class="news-meta">
                                <span class="news-date">${publishedAt}</span>
                                <a href="${url}" target="_blank" class="news-link">Read More →</a>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        } else {
            newsGrid.innerHTML = '<p class="loading">No news articles available</p>';
        }
    } catch (error) {
        console.error('Error loading news:', error);
        newsGrid.innerHTML = '<p class="loading">Unable to load news. Please try again later.</p>';
    }
}

if (refreshNewsBtn) {
    refreshNewsBtn.addEventListener('click', loadNews);
}

// ===== INITIALIZE =====
checkLogin();