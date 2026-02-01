
// ===================================
// State Management
// ===================================

const AppState = {
    currentUser: null,
    currentPage: 'home',
    contests: JSON.parse(localStorage.getItem('contests')) || [],
    leaderboard: [],
    theme: localStorage.getItem('theme') || 'light',

    setUser(user) {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        this.updateUI();
    },

    setPage(page) {
        this.currentPage = page;
        this.updateUI();
    },

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateThemeIcon();
    },

    addContest(contest) {
        contest.id = Date.now();
        contest.createdAt = new Date().toISOString();
        contest.participants = 0;
        contest.status = this.getContestStatus(contest.startDate, contest.endDate);
        this.contests.push(contest);
        this.saveContests();
        return contest;
    },

    updateContest(contestId, updates) {
        const index = this.contests.findIndex(c => c.id === contestId);
        if (index !== -1) {
            this.contests[index] = { ...this.contests[index], ...updates };
            this.saveContests();
        }
    },

    deleteContest(contestId) {
        this.contests = this.contests.filter(c => c.id !== contestId);
        this.saveContests();
    },

    getContestStatus(startDate, endDate) {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (now < start) return 'upcoming';
        if (now > end) return 'completed';
        return 'ongoing';
    },

    saveContests() {
        localStorage.setItem('contests', JSON.stringify(this.contests));
        this.refreshContestDisplays();
    },

    refreshContestDisplays() {
        // Refresh contests page
        if (document.getElementById('contests')) {
            loadContests();
        }
        // Refresh home page upcoming contests
        if (document.getElementById('upcomingContests')) {
            loadUpcomingContests();
        }
    },

    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('i');
        if (!icon) return; // ✅ prevents crash

        icon.setAttribute(
            'data-lucide',
            this.theme === 'dark' ? 'sun' : 'moon'
        );

        lucide.createIcons();
    },

   
    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            if (this.currentUser) {
                // Replace login button with user dropdown
                loginBtn.outerHTML = `
                    <div class="user-dropdown" id="userDropdown">
                        <button class="user-dropdown-btn" id="userDropdownBtn">
                            <i data-lucide="user"></i>
                            <span>${this.currentUser.name}</span>
                            <i data-lucide="chevron-down"></i>
                        </button>
                        <div class="user-dropdown-menu">
                            <div class="dropdown-header">
                                <div class="dropdown-user-info">
                                    <div class="dropdown-user-avatar">
                                        ${this.currentUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="dropdown-user-details">
                                        <h4>${this.currentUser.name}</h4>
                                        <p>${this.currentUser.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="dropdown-menu-items">
                                <button class="dropdown-menu-item" onclick="AppState.viewProfile()">
                                    <i data-lucide="user"></i>
                                    <span>Profile</span>
                                </button>
                                <button class="dropdown-menu-item logout" onclick="AppState.logout()">
                                    <i data-lucide="log-out"></i>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                lucide.createIcons();
                this.updateThemeIcon();

                // Add dropdown toggle functionality
                const userDropdown = document.getElementById('userDropdown');
                const userDropdownBtn = document.getElementById('userDropdownBtn');

                if (userDropdownBtn && userDropdown) {
                    userDropdownBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        userDropdown.classList.toggle('active');
                    });

                    // Close dropdown when clicking outside
                    document.addEventListener('click', (e) => {
                        if (!userDropdown.contains(e.target)) {
                            userDropdown.classList.remove('active');
                        }
                    });
                }
            } else {
                // Show login button
                const userDropdown = document.getElementById('userDropdown');
                if (userDropdown) {
                    userDropdown.outerHTML = `
                        <button class="btn btn-primary" id="loginBtn">
                            <i data-lucide="log-in"></i>
                            <span>Login</span>
                        </button>
                    `;
                    lucide.createIcons();
                    this.updateThemeIcon();
                    // Re-attach login event listener
                    const newLoginBtn = document.getElementById('loginBtn');
                    if (newLoginBtn) {
                        newLoginBtn.addEventListener('click', () => {
                            if (AppState.currentUser) {
                                // Show user menu or profile
                                showNotification('Profile page coming soon!', 'info');
                            } else {
                                navigateTo('login');
                            }
                        });
                    }
                }
            }
        }
    },
    logout() {
        // Clear user data
        this.currentUser = null;
        localStorage.removeItem('user');

        // Update UI
        this.updateUI();

        // Show notification
        showNotification('Logged out successfully!', 'success');

        // Navigate to home page
        window.location.reload();
        navigateTo('home');
    },

    viewProfile() {
        showNotification('Profile page coming soon!', 'info');
        // In the future, navigate to profile page
    }
};

// ===================================
// Mock Data
// ===================================

const mockContests = [
    {
        id: 1,
        title: "Deburging Challenge #01",
        description: "Solve coding problems focusing on deburging programming and graph theory. Test your skills against the best!",
        difficulty: "medium",
        status: "upcoming",
        startDate: "2026-02-10T14:00:00",
        endDate: "2026-02-10T16:00:00",
        participants: 1247,
        problems: [
            {
                title: "Maximum Subarray Sum",
                description: "Given an array of integers, find the contiguous subarray with the largest sum.",
                inputFormat: "First line contains n (size of array). Second line contains n space-separated integers.",
                outputFormat: "Print the maximum sum.",
                sampleInput: "5\n-2 1 -3 4 -1",
                sampleOutput: "4",
                explanation: "The subarray [4] has the largest sum of 4."
            }
        ]
    },
    {
        id: 2,
        title: "Beginner's Cup 2025",
        description: "Perfect for newcomers! Learn fundamental programming concepts through fun challenges.",
        difficulty: "easy",
        status: "ongoing",
        startDate: "2025-12-06T10:00:00",
        endDate: "2025-12-06T18:00:00",
        participants: 3421,
        problems: [
            {
                title: "Sum of Two Numbers",
                description: "Write a program to add two numbers and print the result.",
                inputFormat: "Two space-separated integers a and b.",
                outputFormat: "Print the sum of a and b.",
                sampleInput: "5 10",
                sampleOutput: "15",
                explanation: "5 + 10 = 15"
            }
        ]
    },
    {
        id: 3,
        title: "Advanced Algorithms Marathon",
        description: "Challenge yourself with complex algorithmic problems. Only for experienced programmers!",
        difficulty: "hard",
        status: "upcoming",
        startDate: "2025-12-15T09:00:00",
        endDate: "2025-12-15T21:00:00",
        participants: 892,
        problems: [
            {
                title: "Shortest Path in Weighted Graph",
                description: "Find the shortest path between two nodes in a weighted directed graph using Dijkstra's algorithm.",
                inputFormat: "First line: n (nodes) and m (edges). Next m lines: u v w (edge from u to v with weight w). Last line: source and destination nodes.",
                outputFormat: "Print the shortest distance. If no path exists, print -1.",
                sampleInput: "4 5\n1 2 1\n1 3 4\n2 3 2\n2 4 5\n3 4 1\n1 4",
                sampleOutput: "4",
                explanation: "Path: 1 -> 2 -> 3 -> 4 with total weight 4"
            }
        ]
    },
    {
        id: 4,
        title: "Data Structures Showdown",
        description: "Master trees, graphs, heaps, and more in this comprehensive data structures contest.",
        difficulty: "medium",
        status: "upcoming",
        startDate: "2025-12-12T15:00:00",
        endDate: "2025-12-12T18:00:00",
        participants: 2156,
        problems: [
            {
                title: "Binary Tree Traversal",
                description: "Implement inorder, preorder, and postorder traversal of a binary tree.",
                inputFormat: "First line: n (number of nodes). Next n lines: node value, left child, right child (-1 if null).",
                outputFormat: "Three lines: inorder, preorder, and postorder traversals.",
                sampleInput: "3\n1 2 3\n2 -1 -1\n3 -1 -1",
                sampleOutput: "2 1 3\n1 2 3\n2 3 1",
                explanation: "Tree structure with root 1, left child 2, right child 3"
            }
        ]
    },
    {
        id: 5,
        title: "String Manipulation Masters",
        description: "Dive deep into string algorithms, pattern matching, and text processing challenges.",
        difficulty: "easy",
        status: "completed",
        startDate: "2025-12-01T10:00:00",
        endDate: "2025-12-01T14:00:00",
        participants: 4521,
        problems: [
            {
                title: "Palindrome Check",
                description: "Check if a given string is a palindrome (reads the same forwards and backwards).",
                inputFormat: "A single string s.",
                outputFormat: "Print 'YES' if palindrome, 'NO' otherwise.",
                sampleInput: "racecar",
                sampleOutput: "YES",
                explanation: "racecar reads the same forwards and backwards"
            }
        ]
    },
    {
        id: 6,
        title: "Math & Logic Challenge",
        description: "Solve mathematical puzzles and logical problems that require creative thinking.",
        difficulty: "medium",
        status: "upcoming",
        startDate: "2025-12-20T12:00:00",
        endDate: "2025-12-20T15:00:00",
        participants: 1834,
        problems: [
            {
                title: "Prime Number Generator",
                description: "Generate all prime numbers up to n using the Sieve of Eratosthenes.",
                inputFormat: "A single integer n.",
                outputFormat: "Print all prime numbers up to n, space-separated.",
                sampleInput: "20",
                sampleOutput: "2 3 5 7 11 13 17 19",
                explanation: "All prime numbers from 2 to 20"
            }
        ]
    }
];

const mockLeaderboard = [
    { rank: 1, name: "Adam", score: 9850, contests: 45, solved: 342, accuracy: 94.2 },
    { rank: 2, name: "Sarah Johnson", score: 9720, contests: 42, solved: 328, accuracy: 92.8 },
    { rank: 3, name: "Michael Park", score: 9580, contests: 48, solved: 315, accuracy: 91.5 },
    { rank: 4, name: "Emily Rodriguez", score: 9420, contests: 40, solved: 298, accuracy: 90.3 },
    { rank: 5, name: "David Kim", score: 9280, contests: 38, solved: 285, accuracy: 89.7 },
    { rank: 6, name: "Jessica Lee", score: 9150, contests: 44, solved: 276, accuracy: 88.9 },
    { rank: 7, name: "Ryan Martinez", score: 9020, contests: 36, solved: 264, accuracy: 87.6 },
    { rank: 8, name: "Amanda Taylor", score: 8890, contests: 41, solved: 251, accuracy: 86.4 },
    { rank: 9, name: "Chris Anderson", score: 8760, contests: 39, solved: 242, accuracy: 85.2 },
    { rank: 10, name: "Nicole White", score: 8630, contests: 37, solved: 235, accuracy: 84.1 }
];

// ===================================
// Routing System
// ===================================

function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });

        // Update state
        AppState.setPage(page);

        // Update URL hash
        window.location.hash = page;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile menu if open
        const navMenu = document.getElementById('navMenu');
        navMenu.classList.remove('active');
    }
}

// ===================================
// CONTEST ROUNDS & PASSWORD PROTECTION
// ===================================

let currentRoundNumber = null;

function initContestRounds() {
    // Override the showContestDetails function for the first contest
    window.showContestDetails = function (contestId) {
        // Check if this is the first contest (ID 1 or the first in the list)
        const allContests = [...mockContests, ...AppState.contests];
        const contest = allContests.find(c => c.id === contestId);

        if (contest && (contestId === 1 || contestId === allContests[0].id)) {
            // Show rounds modal for first contest
            showContestRounds();
        } else {
            // Show regular contest details for other contests
            showRegularContestDetails(contestId);
        }
    };
}

function showContestRounds() {
    const modal = document.getElementById('contestRoundsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        lucide.createIcons();
    }
}

function closeContestRoundsModal() {
    const modal = document.getElementById('contestRoundsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function openRoundPassword(roundNumber) {
    currentRoundNumber = roundNumber;

    // Close rounds modal
    closeContestRoundsModal();

    // Open password modal
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Clear previous password input
        const passwordInput = document.getElementById('roundPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }

        // Hide error message
        const errorMsg = document.getElementById('passwordError');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        lucide.createIcons();

        // Focus on password input
        setTimeout(() => {
            if (passwordInput) {
                passwordInput.focus();
            }
        }, 300);
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        // currentRoundNumber = null;
    }
}

function verifyPassword(event) {
    event.preventDefault();

    const passwordInput = document.getElementById('roundPassword');
    const errorMsg = document.getElementById('passwordError');
    const password = passwordInput.value.trim();

    // Define passwords for each round
    const roundPasswords = {
        1: 'kamaladevi',
        2: 'kamaladevi2',
        3: 'kamaladevi3'
    };

    // Check if password is correct for the current round
    if (password === roundPasswords[currentRoundNumber]) {
        // Password correct - navigate to code.html with round parameter
        closePasswordModal();

        // Show success notification
        showNotification(`Round ${currentRoundNumber} unlocked! Loading coding challenge...`, 'success');

        // Save round number to localStorage for code.html to access
        localStorage.setItem('currentRound', currentRoundNumber);

        // Navigate to code.html after a short delay
        setTimeout(() => {
            window.location.href = `contest?round=${currentRoundNumber}`;
        }, 1000);
    } else {
        // Password incorrect - show error
        if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Incorrect password. Please try again.';
        }
        passwordInput.value = '';
        passwordInput.focus();

        // Shake animation for error feedback
        passwordInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            passwordInput.style.animation = '';
        }, 500);
    }
}

function navigateToRoundPage(roundNumber) {
    // Check if custom round page exists
    const roundPage = document.getElementById(`round-${roundNumber}`);

    if (roundPage) {
        // Navigate to existing custom page
        navigateTo(`round-${roundNumber}`);
    } else {
        // Create a placeholder page if custom page doesn't exist
        showNotification(`Round ${roundNumber} page will be loaded here. Upload your custom page as round-${roundNumber}.html`, 'info');

        // For now, show a message
        alert(`Round ${roundNumber} unlocked! Your custom page will be displayed here.\n\nTo add your custom page:\n1. Create a section with id="round-${roundNumber}" in index.html\n2. Add your custom content inside that section\n3. The page will automatically load when password is verified`);
    }
}

function showRegularContestDetails(contestId) {
    const contest = mockContests.find(c => c.id === contestId);
    if (!contest) return;

    const problem = contest.problems[0];
    const detailsContent = document.getElementById('contestDetailsContent');

    detailsContent.innerHTML = `
        <div class="contest-details-header">
            <h1 class="contest-details-title">${contest.title}</h1>
            <div class="contest-details-meta">
                <div class="meta-item">
                    <i data-lucide="calendar"></i>
                    <span>${formatDate(contest.startDate)} - ${formatDate(contest.endDate)}</span>
                </div>
                <div class="meta-item">
                    <i data-lucide="users"></i>
                    <span>${contest.participants} participants</span>
                </div>
                <div class="meta-item">
                    <span class="tag tag-${contest.difficulty}">${contest.difficulty}</span>
                </div>
                <div class="meta-item">
                    <span class="tag tag-${contest.status}">${contest.status}</span>
                </div>
            </div>
        </div>
        
        <div class="contest-details-body">
            <div class="problem-section">
                <h2>${problem.title}</h2>
                <p>${problem.description}</p>
                
                <h3>Input Format</h3>
                <p>${problem.inputFormat}</p>
                
                <h3>Output Format</h3>
                <p>${problem.outputFormat}</p>
                
                <h3>Sample Test Case</h3>
                <div class="sample-case">
                    <h4>Input:</h4>
                    <pre>${problem.sampleInput}</pre>
                </div>
                <div class="sample-case">
                    <h4>Output:</h4>
                    <pre>${problem.sampleOutput}</pre>
                </div>
                <div class="sample-case">
                    <h4>Explanation:</h4>
                    <p>${problem.explanation}</p>
                </div>
            </div>
            
            <div class="compiler-section">
                <div class="compiler-card">
                    <div class="compiler-header">
                        <h3>Code Editor</h3>
                        <select class="language-selector" id="languageSelector">
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="javascript">JavaScript</option>
                            <option value="c">C</option>
                            <option value="csharp">C#</option>
                            <option value="ruby">Ruby</option>
                            <option value="go">Go</option>
                            <option value="rust">Rust</option>
                            <option value="php">PHP</option>
                        </select>
                    </div>
                    <div class="compiler-body">
                        <textarea class="code-editor" id="codeEditor" placeholder="Write your code here..."># Write your solution here
def solve():
    # Your code
    pass

solve()</textarea>
                        <div class="compiler-actions">
                            <button class="btn btn-secondary" onclick="runCode()">
                                <i data-lucide="play"></i>
                                <span>Run Code</span>
                            </button>
                            <button class="btn btn-primary" onclick="submitCode()">
                                <i data-lucide="send"></i>
                                <span>Submit</span>
                            </button>
                        </div>
                        <div class="compiler-output" id="compilerOutput" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
    navigateTo('contest-details');
}

// Make functions globally accessible
window.closeContestRoundsModal = closeContestRoundsModal;
window.openRoundPassword = openRoundPassword;
window.closePasswordModal = closePasswordModal;
window.verifyPassword = verifyPassword;

// ===================================
// Compiler Integration
// ===================================

async function runCode() {
    const code = document.getElementById('codeEditor').value;
    const language = document.getElementById('languageSelector').value;
    const output = document.getElementById('compilerOutput');

    if (!code.trim()) {
        showOutput('Error: Please write some code first!', 'error');
        return;
    }

    showOutput('Compiling and running your code...', 'info');

    // Simulate compilation and execution
    setTimeout(() => {
        try {
            // Mock execution result
            const result = simulateCodeExecution(code, language);
            showOutput(result, 'success');
        } catch (error) {
            showOutput(`Runtime Error: ${error.message}`, 'error');
        }
    }, 1500);
}

function simulateCodeExecution(code, language) {
    // This is a mock simulation. In production, this would call a real compiler API
    const outputs = {
        python: `Compilation successful!\n\nOutput:\n15\n\nExecution time: 0.023s\nMemory used: 2.4 MB\n\nTest case 1: ✓ Passed\nTest case 2: ✓ Passed\nTest case 3: ✓ Passed`,
        cpp: `Compilation successful!\n\nOutput:\n15\n\nExecution time: 0.012s\nMemory used: 1.8 MB\n\nTest case 1: ✓ Passed\nTest case 2: ✓ Passed\nTest case 3: ✓ Passed`,
        java: `Compilation successful!\n\nOutput:\n15\n\nExecution time: 0.045s\nMemory used: 3.2 MB\n\nTest case 1: ✓ Passed\nTest case 2: ✓ Passed\nTest case 3: ✓ Passed`,
        javascript: `Execution successful!\n\nOutput:\n15\n\nExecution time: 0.018s\nMemory used: 2.1 MB\n\nTest case 1: ✓ Passed\nTest case 2: ✓ Passed\nTest case 3: ✓ Passed`
    };

    return outputs[language] || outputs.python;
}

function showOutput(message, type) {
    const output = document.getElementById('compilerOutput');
    output.style.display = 'block';
    output.textContent = message;

    // Add styling based on type
    output.style.color = type === 'error' ? 'var(--accent-red)' :
        type === 'success' ? 'var(--accent-green)' :
            'var(--text-primary)';
}

async function submitCode() {
    const code = document.getElementById('codeEditor').value;
    const language = document.getElementById('languageSelector').value;

    if (!code.trim()) {
        showOutput('Error: Please write some code first!', 'error');
        return;
    }

    if (!AppState.currentUser) {
        showNotification('Please login to submit your solution', 'warning');
        navigateTo('login');
        return;
    }

    showOutput('Submitting your solution...', 'info');

    // Simulate submission
    setTimeout(() => {
        showOutput('✓ Solution submitted successfully!\n\nYour submission is being evaluated...\n\nScore: 100/100\nAll test cases passed!', 'success');
        showNotification('Solution submitted successfully!', 'success');
    }, 2000);
}

// ===================================
// UI Rendering Functions
// ===================================

function renderUpcomingContests() {
    const container = document.getElementById('upcomingContests');
    const upcomingContests = mockContests.filter(c => c.status === 'upcoming').slice(0, 3);

    container.innerHTML = upcomingContests.map(contest => `
        <div class="contest-card" onclick="showContestDetails(${contest.id})">
            <div class="contest-header">
                <h3 class="contest-title">${contest.title}</h3>
                <div class="contest-meta">
                    <i data-lucide="calendar"></i>
                    <span>${formatDate(contest.startDate)}</span>
                </div>
            </div>
            <div class="contest-body">
                <p class="contest-description">${contest.description}</p>
                <div class="contest-tags">
                    <span class="tag tag-${contest.difficulty}">${contest.difficulty}</span>
                    <span class="tag tag-${contest.status}">${contest.status}</span>
                </div>
                <div class="contest-footer">
                    <div class="contest-participants">
                        <i data-lucide="users"></i>
                        <span>${contest.participants} participants</span>
                    </div>
                    <button class="btn btn-primary">
                        <span>View Details</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function renderAllContests() {
    const container = document.getElementById('contestsList');
    let contests = [...mockContests];

    // Apply filters
    const statusFilter = document.getElementById('statusFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    if (statusFilter !== 'all') {
        contests = contests.filter(c => c.status === statusFilter);
    }

    if (difficultyFilter !== 'all') {
        contests = contests.filter(c => c.difficulty === difficultyFilter);
    }

    if (searchQuery) {
        contests = contests.filter(c =>
            c.title.toLowerCase().includes(searchQuery) ||
            c.description.toLowerCase().includes(searchQuery)
        );
    }

    if (contests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i data-lucide="search" style="width: 64px; height: 64px; margin-bottom: 1rem;"></i>
                <h3>No contests found</h3>
                <p>Try adjusting your filters or search query</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = contests.map(contest => `
        <div class="contest-card" onclick="showContestDetails(${contest.id})">
            <div class="contest-header">
                <h3 class="contest-title">${contest.title}</h3>
                <div class="contest-meta">
                    <i data-lucide="calendar"></i>
                    <span>${formatDate(contest.startDate)}</span>
                </div>
            </div>
            <div class="contest-body">
                <p class="contest-description">${contest.description}</p>
                <div class="contest-tags">
                    <span class="tag tag-${contest.difficulty}">${contest.difficulty}</span>
                    <span class="tag tag-${contest.status}">${contest.status}</span>
                </div>
                <div class="contest-footer">
                    <div class="contest-participants">
                        <i data-lucide="users"></i>
                        <span>${contest.participants} participants</span>
                    </div>
                    <button class="btn btn-primary">
                        <span>View Details</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');

    tbody.innerHTML = mockLeaderboard.map(user => `
        <tr>
            <td>
                ${user.rank <= 3 ?
            `<div class="rank-badge rank-${user.rank}">${user.rank}</div>` :
            `<div class="rank-badge">${user.rank}</div>`
        }
            </td>
            <td>
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <span class="user-name">${user.name}</span>
                </div>
            </td>
            <td><span class="score-badge">${user.score}</span></td>
            <td>${user.contests}</td>
            <td>${user.solved}</td>
            <td>${user.accuracy}%</td>
        </tr>
    `).join('');
}

// ===================================
// Form Handlers
// ===================================

function handleCreateContest(e) {
    e.preventDefault();

    if (!AppState.currentUser) {
        showNotification('Please login to create a contest', 'warning');
        navigateTo('login');
        return;
    }

    // Get form values
    const title = document.getElementById('contestTitle').value.trim();
    const difficulty = document.getElementById('contestDifficulty').value;
    const description = document.getElementById('contestDescription').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const problemTitle = document.getElementById('problemTitle').value.trim();
    const problemStatement = document.getElementById('problemStatement').value.trim();
    const inputFormat = document.getElementById('inputFormat').value.trim();
    const outputFormat = document.getElementById('outputFormat').value.trim();

    // Validate required fields
    if (!title || !description || !startDate || !endDate || !problemTitle || !problemStatement) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
        showNotification('End date must be after start date', 'error');
        return;
    }

    // Collect test cases
    const testCases = [];
    document.querySelectorAll('.test-case-item').forEach(item => {
        const input = item.querySelector('.test-input').value.trim();
        const output = item.querySelector('.test-output').value.trim();
        if (input && output) {
            testCases.push({ input, output });
        }
    });

    if (testCases.length === 0) {
        showNotification('Please add at least one test case', 'error');
        return;
    }

    // Create contest object
    const contest = {
        title,
        difficulty,
        description,
        startDate,
        endDate,
        createdBy: AppState.currentUser.name,
        problems: [{
            title: problemTitle,
            description: problemStatement,
            inputFormat: inputFormat || 'Not specified',
            outputFormat: outputFormat || 'Not specified',
            testCases: testCases,
            sampleInput: testCases[0].input,
            sampleOutput: testCases[0].output,
            explanation: 'See test cases for details'
        }]
    };

    // Add contest to state
    const newContest = AppState.addContest(contest);

    // Show success notification
    showNotification('Contest created successfully! 🎉', 'success');

    // Reset form
    document.getElementById('createContestForm').reset();

    // Reset test cases to show only one
    const testCasesContainer = document.getElementById('testCasesContainer');
    testCasesContainer.innerHTML = `
        <div class="test-case-item">
            <div class="form-grid">
                <div class="form-group">
                    <label>Sample Input</label>
                    <textarea class="test-input" rows="3" required placeholder="Enter sample input..."></textarea>
                </div>
                <div class="form-group">
                    <label>Expected Output</label>
                    <textarea class="test-output" rows="3" required placeholder="Enter expected output..."></textarea>
                </div>
            </div>
        </div>
    `;

    // Navigate to contests page after 1.5 seconds
    setTimeout(() => {
        navigateTo('contests');
    }, 1500);
}

// ===================================
// Create Contest Form Initialization
// ===================================

function initCreateContestForm() {
    const createContestForm = document.getElementById('createContestForm');
    const addTestCaseBtn = document.getElementById('addTestCase');

    if (createContestForm) {
        // Handle form submission
        createContestForm.addEventListener('submit', handleCreateContest);
    }

    if (addTestCaseBtn) {
        // Handle adding test cases
        addTestCaseBtn.addEventListener('click', function () {
            const testCasesContainer = document.getElementById('testCasesContainer');
            const testCaseItem = document.createElement('div');
            testCaseItem.className = 'test-case-item';
            testCaseItem.innerHTML = `
                <div class="test-case-header">
                    <h4>Test Case ${testCasesContainer.children.length + 1}</h4>
                    <button type="button" class="btn-remove-test" onclick="this.closest('.test-case-item').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Sample Input</label>
                        <textarea class="test-input" rows="3" required placeholder="Enter sample input..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Expected Output</label>
                        <textarea class="test-output" rows="3" required placeholder="Enter expected output..."></textarea>
                    </div>
                </div>
            `;
            testCasesContainer.appendChild(testCaseItem);
            lucide.createIcons();
        });
    }
}

// ===================================
// Contest Loading Functions
// ===================================

function loadContests() {
    const container = document.getElementById('contestsList');
    if (!container) return;

    // Combine mock contests with user-created contests
    let allContests = [...mockContests, ...AppState.contests];

    // Update contest statuses
    allContests = allContests.map(contest => ({
        ...contest,
        status: AppState.getContestStatus(contest.startDate, contest.endDate)
    }));

    // Apply filters
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const difficultyFilter = document.getElementById('difficultyFilter')?.value || 'all';
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';

    let filteredContests = allContests;

    if (statusFilter !== 'all') {
        filteredContests = filteredContests.filter(c => c.status === statusFilter);
    }

    if (difficultyFilter !== 'all') {
        filteredContests = filteredContests.filter(c => c.difficulty === difficultyFilter);
    }

    if (searchQuery) {
        filteredContests = filteredContests.filter(c =>
            c.title.toLowerCase().includes(searchQuery) ||
            c.description.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredContests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;">
                <i data-lucide="search" style="width: 64px; height: 64px; margin-bottom: 1rem;"></i>
                <h3>No contests found</h3>
                <p>Try adjusting your filters or create a new contest!</p>
                <button class="btn btn-primary" data-navigate="create-contest" style="margin-top: 1rem;">
                    <i data-lucide="plus-circle"></i>
                    <span>Create Contest</span>
                </button>
            </div>
        `;
        lucide.createIcons();

        // Add event listener to the button
        container.querySelector('[data-navigate]').addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo('create-contest');
        });
        return;
    }

    container.innerHTML = filteredContests.map(contest => `
        <div class="contest-card" onclick="showContestDetails(${contest.id})">
            <div class="contest-header">
                <h3 class="contest-title">${contest.title}</h3>
                <div class="contest-meta">
                    <i data-lucide="calendar"></i>
                    <span>${formatDate(contest.startDate)}</span>
                </div>
            </div>
            <div class="contest-body">
                <p class="contest-description">${contest.description}</p>
                ${contest.createdBy ? `<p style="font-size: 0.875rem; color: var(--text-tertiary); margin-top: 0.5rem;">Created by ${contest.createdBy}</p>` : ''}
                <div class="contest-tags">
                    <span class="tag tag-${contest.difficulty}">${contest.difficulty}</span>
                    <span class="tag tag-${contest.status}">${contest.status}</span>
                </div>
                <div class="contest-footer">
                    <div class="contest-participants">
                        <i data-lucide="users"></i>
                        <span>${contest.participants || 0} participants</span>
                    </div>
                    <button class="btn btn-primary">
                        <span>View Details</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function loadUpcomingContests() {
    const container = document.getElementById('upcomingContests');
    if (!container) return;

    // Combine mock contests with user-created contests
    let allContests = [...mockContests, ...AppState.contests];

    // Update statuses and filter upcoming
    const upcomingContests = allContests
        .map(contest => ({
            ...contest,
            status: AppState.getContestStatus(contest.startDate, contest.endDate)
        }))
        .filter(c => c.status === 'upcoming')
        .slice(0, 3);

    if (upcomingContests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i data-lucide="calendar" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <p>No upcoming contests. Create one now!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = upcomingContests.map(contest => `
        <div class="contest-card" onclick="showContestDetails(${contest.id})">
            <div class="contest-header">
                <h3 class="contest-title">${contest.title}</h3>
                <div class="contest-meta">
                    <i data-lucide="calendar"></i>
                    <span>${formatDate(contest.startDate)}</span>
                </div>
            </div>
            <div class="contest-body">
                <p class="contest-description">${contest.description}</p>
                <div class="contest-tags">
                    <span class="tag tag-${contest.difficulty}">${contest.difficulty}</span>
                    <span class="tag tag-${contest.status}">${contest.status}</span>
                </div>
                <div class="contest-footer">
                    <div class="contest-participants">
                        <i data-lucide="users"></i>
                        <span>${contest.participants || 0} participants</span>
                    </div>
                    <button class="btn btn-primary">
                        <span>View Details</span>
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    //    fetch("/loginsuck")
    //   .then(res => res.json())
    //   .then(data => {
    //       console.log(data);
    //   });

    // // Simulate login
    // const logininfo = document.getElementById("loginForm");

    // if (!logininfo) return;
    //  const user = {
    //             name: email.split('@')[0],
    //             email: email
    //         };

    // logininfo.addEventListener("submit", async (e) => {
    //     e.preventDefault();

    //     const loginData = new FormData(logininfo);

    //     const response = await fetch("/loginsuck", {
    //         method: "POST",
    //         body: new URLSearchParams(loginData)
    //     });

    //     const result = await response.json();

    //     if (result.success) {
    //         alert("Message sent successfully!");
    //         form.reset();
    //         AppState.setUser(user);
    //         showNotification('Login successful!', 'success');

    //         setTimeout(() => {
    //             navigateTo('home');
    //         }, 1000);
    //     } else {
    //         alert(" Something went wrong!");
    //         showNotification('Login Failed!', 'Failed');

    //         setTimeout(() => {
    //             navigateTo('home');
    //         }, 1000);

    //     }
    // });



}

function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    // Simulate signup
    const user = {
        name: name,
        email: email
    };

    AppState.setUser(user);
    showNotification('Account created successfully!', 'success');

    setTimeout(() => {
        navigateTo('home');
    }, 1000);
}

// ===================================
// CONTACT FORM WITH EMAIL FUNCTIONALITY
// ===================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const subject = document.getElementById('contactSubject').value.trim();
            const message = document.getElementById('contactMessage').value.trim();

            // Validate form
            let isValid = true;

            // Validate name
            if (!name || name.length < 2) {
                showNotification('Please enter a valid name', 'error');
                isValid = false;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showNotification('Please enter a valid email address', 'error');
                isValid = false;
            }

            // Validate subject
            if (!subject || subject.length < 3) {
                showNotification('Please enter a valid subject', 'error');
                isValid = false;
            }

            // Validate message
            if (!message || message.length < 10) {
                showNotification('Message must be at least 10 characters long', 'error');
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i data-lucide="loader"></i><span>Sending...</span>';
            submitBtn.disabled = true;
            lucide.createIcons();

            // Prepare email parameters
            const templateParams = {
                from_name: name,
                from_email: email,
                subject: subject,
                message: message,
                to_email: 'infinitymart48@gmail.com'
            };

            // Send email using EmailJS
            // Note: User needs to set up EmailJS account and replace these IDs
            emailjs.send('service_52kvw69', 'template_67ujlho', templateParams)
                .then(function (response) {
                    console.log('SUCCESS!', response.status, response.text);

                    // Reset button
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                    lucide.createIcons();

                    // Show success message
                    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');

                    // Reset form
                    contactForm.reset();

                }, function (error) {
                    console.log('FAILED...', error);

                    // Reset button
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                    lucide.createIcons();

                    // Show error message
                    showNotification('Failed to send message. Please try again or email us directly at infinitymart48@gmail.com', 'error');
                });
        });
    }
}

// ===================================
// Utility Functions
// ===================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--accent-green)' :
            type === 'error' ? 'var(--accent-red)' :
                type === 'warning' ? '#F59E0B' :
                    'var(--primary-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===================================
// Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize EmailJS with public key
    // emailjs.init('ytbZHbPHi3QfsXKjo'); // User needs to replace this with their EmailJS public key
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        AppState.updateUI();
    }
    function formdata() {
        const form = document.getElementById("contactForm");

        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);

            const response = await fetch("/contact", {
                method: "POST",
                body: new URLSearchParams(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert("Message sent successfully!");
                form.reset();
            } else {
                alert(" Something went wrong!");
            }
        });
    }
    formdata();
    // Login page logic
    function loggingdata() {
        const logininfo = document.getElementById("loginForm");

        if (!logininfo) return;


        logininfo.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const user = {
                name: email.split('@')[0],
                email: email
            };


            const loginData = new FormData(logininfo);

            const response = await fetch("/loginsuck", {
                method: "POST",
                body: new URLSearchParams(loginData)
            });

            const result = await response.json();


            if (result.success) {
                alert("Message sent successfully!");

                AppState.setUser(user);
                showNotification('Login successful!', 'success');

                setTimeout(() => {
                    navigateTo('home');
                }, 1000);
                logininfo.reset();
            } else {
                alert(" Something went wrong!");
                showNotification('Singup Required!', 'Failed');

                setTimeout(() => {
                    navigateTo('login');
                }, 1000);

            }
        });
    }
    loggingdata()


    function signupdata() {
        const signupinfo = document.getElementById("signupForm");



        if (!signupinfo) return;

        signupinfo.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;

            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            } else {
                const signupData = new FormData(signupinfo);

                const response = await fetch("/signup", {
                    method: "POST",
                    body: new URLSearchParams(signupData)
                });

                const result = await response.json();

                if (result.success) {

                    form.reset();
                } else {
                    alert(" Something went wrong!");
                }
            }
        });
    }
    signupdata();



    // Initialize theme
    AppState.setTheme(AppState.theme);

    // Initialize Lucide icons
    lucide.createIcons();

    // Render initial content
    renderUpcomingContests();
    renderAllContests();
    renderLeaderboard();

    // Initialize contact form
    initContactForm();

    // Initialize create contest form
    initCreateContestForm();

    // Initialize contest rounds functionality
    initContestRounds();

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Navigation buttons
    document.querySelectorAll('[data-navigate]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const page = btn.getAttribute('data-navigate');
            navigateTo(page);
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        AppState.setTheme(newTheme);
    });

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', () => {
        if (AppState.currentUser) {
            // Show user menu or profile
            showNotification('Profile page coming soon!', 'info');
        } else {
            navigateTo('login');
        }
    });

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Update tabs
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update forms
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(`${targetTab}Form`).classList.add('active');
        });
    });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Contest filters
    document.getElementById('statusFilter').addEventListener('change', renderAllContests);
    document.getElementById('difficultyFilter').addEventListener('change', renderAllContests);
    document.getElementById('searchInput').addEventListener('input', renderAllContests);

    // Leaderboard filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // In production, this would filter leaderboard data
            showNotification(`Showing ${btn.getAttribute('data-period')} leaderboard`, 'info');
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Handle hash navigation
    const hash = window.location.hash.slice(1);
    if (hash) {
        navigateTo(hash);
    }

    // Brand click - go home
    document.querySelector('.nav-brand').addEventListener('click', () => {
        navigateTo('home');
    });
});

// ===================================
// Additional Animations
// ===================================

// Add CSS for notifications and animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

console.log('CodeArena initialized successfully! 🚀');