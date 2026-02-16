// ===================================
// Code Challenge Page - JavaScript
// ===================================

let currentLanguage = null;
let currentRound = null;
let monacoEditor = null;
let initialCode = '';
let isTerminalFullscreen = false;
let term = null;


let socket = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") + location.host
);;
let isProgramRunning = false;
let inputBuffer = "";



function initSocket() {
    socket = new WebSocket(
        (location.protocol === "https:" ? "wss://" : "ws://") + location.host
    );;

    socket.onopen = () => {
        console.log("✅ WebSocket connected");
        writeToTerminal("Connected to execution server\n");
    };

    socket.onmessage = (e) => {
        writeToTerminal(e.data);
    };

    socket.onerror = (e) => {
        writeToTerminal("❌ WebSocket error\n");
        console.error(e);
    };

    socket.onclose = () => {
        writeToTerminal("\n⚠️ Connection closed\n");
        isProgramRunning = false;
    };
}



function initTerminal() {
    term = new Terminal({
        cursorBlink: true,
        disableStdin: true,
        convertEol: true,
        scrollback: 50000,
        theme: {
            background: "#000000",
            foreground: "#00ff00"
        }
    });

    term.open(document.getElementById("terminal"));

    term.onKey(({ key, domEvent }) => {
        if (!isProgramRunning) return;

        domEvent.preventDefault();

        // ENTER
        if (key === "\r") {
            term.write("\r\n");
            socket.send(JSON.stringify({
                type: "input",
                value: inputBuffer + "\n"
            }));
            inputBuffer = "";
            return;
        }

        // BACKSPACE
        if (key === "\x7f" || key === "\b" || domEvent.key === "Backspace") {
            if (inputBuffer.length > 0) {
                inputBuffer = inputBuffer.slice(0, -1);
                term.write("\b \b");
            }
            return;
        }
        if (key.length !== 1) return;

        // Printable chars
        inputBuffer += key;
        term.write(key);

    });
}


// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Lucide icons
    lucide.createIcons();
    // restoreLoginState();
    updateUI();
    // Get round number from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentRound = urlParams.get('round') || localStorage.getItem('currentRound') || '1';
    initTerminal();
    initSocket();
    // Update round title
    updateRoundTitle();

    // Initialize theme
    initTheme();

    // Initialize mobile menu
    initMobileMenu();

    // Start timer
    // startTimer();
    initMonacoLoader();
});
// ===================================
// MONACO EDITOR INITIALIZATION
// ===================================
function initMonacoLoader() {
    // Configure Monaco Editor loader
    require.config({
        paths: {
            'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
        }
    });

    // Load Monaco Editor
    require(['vs/editor/editor.main'], function () {
        console.log('Monaco Editor loaded successfully');
    });
}

function createMonacoEditor(language, code) {
    // Get current theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';

    // Map language names to Monaco language IDs
    const languageMap = {
        'python': 'python',
        'javascript': 'javascript',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'csharp': 'csharp',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'php': 'php',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'typescript': 'typescript'
    };

    // Create Monaco Editor instance
    monacoEditor = monaco.editor.create(document.getElementById('monacoEditorContainer'), {
        value: code,
        language: languageMap[language] || 'plaintext',
        theme: monacoTheme,
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: {
            enabled: true
        },
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 4,
        insertSpaces: true,
        renderWhitespace: 'selection',
        bracketPairColorization: {
            enabled: true
        },
        guides: {
            bracketPairs: true,
            indentation: true
        }
    });

    // Add keyboard shortcut for running code (Ctrl+Enter or Cmd+Enter)
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
        runCode();
    });

    // Store initial code for reset functionality
    initialCode = code;

    return monacoEditor;
}

function updateMonacoTheme() {
    if (monacoEditor) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const monacoTheme = currentTheme === 'dark' ? 'vs-dark' : 'vs';
        monaco.editor.setTheme(monacoTheme);
    }
}
// ===================================
// THEME MANAGEMENT
// ===================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    let icon = themeToggle.querySelector('i');

    // 🔐 If icon is not ready yet, retry once
    if (!icon) {
        setTimeout(initTheme, 50);
        return;
    }

    icon.setAttribute(
        'data-lucide',
        savedTheme === 'dark' ? 'sun' : 'moon'
    );
    lucide.createIcons();

    themeToggle.onclick = () => {
        const currentTheme =
            document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        icon.setAttribute(
            'data-lucide',
            newTheme === 'dark' ? 'sun' : 'moon'
        );
        lucide.createIcons();
        updateMonacoTheme();
    };
}
function restoreLoginState() {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) return;

    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    loginBtn.outerHTML = `
        <div class="user-dropdown" id="userDropdown">
            <button class="user-dropdown-btn" id="userDropdownBtn">
                <i data-lucide="user"></i>
                <span>${user.name}</span>
                <i data-lucide="chevron-down"></i>
            </button>
            <div class="user-dropdown-menu">
                <button class="dropdown-menu-item logout" onclick="logoutUser()">
                    <i data-lucide="log-out"></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    `;

    lucide.createIcons();
}



// ===================================
// MOBILE MENU
// ===================================
function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            icon.setAttribute('data-lucide', navMenu.classList.contains('active') ? 'x' : 'menu');
            lucide.createIcons();
        });
    }
}

// ===================================
// ROUND MANAGEMENT
// ===================================
function updateRoundTitle() {
    const roundTitle = document.getElementById('roundTitle');
    const roundTitles = {
        '1': 'Round 1 - Beginner Level Challenge',
        '2': 'Round 2 - Intermediate Challenge',
        '3': 'Round 3 - Advanced Challenge'
    };

    if (roundTitle) {
        roundTitle.textContent = roundTitles[currentRound] || 'Coding Challenge';
    }
}

// ===================================
// TIMER
// ===================================
let timerInterval = null;
let timeRemaining = 0;
/*
function startTimer() {
    let timeInSeconds = 7200; // 2 hours
    
    const timerElement = document.getElementById('timeRemaining');
    
    setInterval(() => {
        if (timeInSeconds > 0) {
            timeInSeconds--;
            const hours = Math.floor(timeInSeconds / 3600);
            const minutes = Math.floor((timeInSeconds % 3600) / 60);
            const seconds = timeInSeconds % 60;
            
            timerElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timerElement.textContent = 'Time Up!';
            timerElement.style.color = 'var(--accent-red)';
        }
    }, 1000);
}*/

function startTimer() {
    // Don't start timer until language is selected
    // Timer will be started in selectLanguage function
}

function startRoundTimer() {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Set time based on round (in seconds)
    const roundTimes = {
        '1': 15 * 60,  // 15 minutes
        '2': 20 * 60,  // 25 minutes
        '3': 25 * 60   // 45 minutes
    };

    timeRemaining = roundTimes[currentRound] || 900; // Default 15 minutes

    const timerElement = document.getElementById('timeRemaining');

    // Update timer immediately
    updateTimerDisplay(timerElement);

    // Start countdown
    timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateTimerDisplay(timerElement);
        } else {
            clearInterval(timerInterval);
            timerElement.textContent = 'Time Up!';
            timerElement.style.color = 'var(--accent-red)';

            // Show time up notification
            alert('Time is up! Your solution will be auto-submitted.');
            submitSolution();
            navigateTo("home");
        }
    }, 1000);
}

function updateTimerDisplay(element) {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    if (hours > 0) {
        element.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Change color when time is running low (last 2 minutes)
    if (timeRemaining <= 120) {
        element.style.color = 'var(--accent-red)';
    } else if (timeRemaining <= 300) {
        element.style.color = '#F59E0B'; // Warning color
    } else {
        element.style.color = 'var(--text-secondary)';
    }
}

// ===================================
// LANGUAGE SELECTION
// ===================================
function selectLanguage(language) {
    currentLanguage = language;

    // Hide language selection
    document.getElementById('languageSelectionSection').style.display = 'none';

    // Show coding challenge
    document.getElementById('codingChallengeSection').style.display = 'block';

    // Update selected language display
    const languageNames = {
        python: 'Python 3',
        javascript: 'JavaScript',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        csharp: 'C#',
        ruby: 'Ruby',
        go: 'Go',
        rust: 'Rust',
        php: 'PHP',
        swift: 'Swift',
        kotlin: 'Kotlin'
    };

    document.getElementById('selectedLanguage').textContent = languageNames[language];

    // Load problem based on language and round
    showRulesModal();
    loadProblem();

    // Start the round timer
    startRoundTimer();

    // Load code template and create Monaco Editor
    setTimeout(() => {
        loadCodeTemplate();
    }, 100);

    // Load code template
    //loadCodeTemplate();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// RULES MODAL
// ===================================
function showRulesModal() {
    // Get round-specific rules
    const roundRules = getRoundRules(currentRound);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'rulesModal';
    modal.innerHTML = `
        <div class="modal-content model-con">
            <div class="modal-header">
                <h2><i data-lucide="book-open"></i> Round ${currentRound} - Contest Rules</h2>
            </div>
            <div class="modal-body">
                <div class="rules-content">
                    <div class="rule-section">
                        <h3><i data-lucide="clock"></i> Time Limit</h3>
                        <p>${roundRules.timeLimit}</p>
                    </div>
                    
                    <div class="rule-section">
                        <h3><i data-lucide="target"></i> Objective</h3>
                        <p>${roundRules.objective}</p>
                    </div>
                    
                    <div class="rule-section">
                        <h3><i data-lucide="list-checks"></i> Rules</h3>
                        <ul class="rules-list">
                            ${roundRules.rules.map(rule => `<li>${rule}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="rule-section">
                        <h3><i data-lucide="trophy"></i> Scoring</h3>
                        <p>${roundRules.scoring}</p>
                    </div>
                    
                    <div class="rule-section warning-section">
                        <h3><i data-lucide="alert-triangle"></i> Important Notes</h3>
                        <ul class="rules-list">
                            ${roundRules.warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-large" onclick="startContest()">
                    <i data-lucide="play"></i>
                    <span>Continue to Contest</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// ===================================
// GET ROUND-SPECIFIC RULES
// ===================================
function getRoundRules(round) {
    const rules = {
        '1': {
            timeLimit: '15 minutes',
            objective: 'Fix the buggy code and solve the Sum of Two Numbers problem. Read two integers and output their sum.',
            rules: [
                'You must fix the provided buggy code',
                'The code has a simple operator error that needs correction',
                'Your solution must handle all test cases correctly',
                'You can submit multiple times, but only the best submission counts',
                'Use the provided code template as a starting point'
            ],
            scoring: 'Full points (100) for all test cases passed. Partial credit for some test cases.',
            warnings: [
                'Timer starts immediately after clicking Continue',
                'Make sure you understand the problem before starting',
                'Test your code with the provided examples',
                'Auto-submission occurs when time runs out'
            ]
        },
        '2': {
            timeLimit: '20 minutes',
            objective: 'Fix the buggy code and solve the String Reversal problem. Read a string and output it in reverse order.',
            rules: [
                'You must fix the provided buggy code',
                'The code is missing the string reversal logic',
                'Your solution must handle strings of any length (up to 1000 characters)',
                'You can submit multiple times, but only the best submission counts',
                'Use language-specific string manipulation methods'
            ],
            scoring: 'Full points (100) for all test cases passed. Partial credit for some test cases.',
            warnings: [
                'Timer starts immediately after clicking Continue',
                'Pay attention to language-specific string handling',
                'Test with different string lengths',
                'Auto-submission occurs when time runs out'
            ]
        },
        '3': {
            timeLimit: '25 minutes',
            objective: 'Fix the buggy code and solve the Maximum Element problem. Read an array of integers and find the maximum element.',
            rules: [
                'You must fix the provided buggy code',
                'The code uses the wrong function/operator for finding maximum',
                'Your solution must handle arrays up to 100,000 elements',
                'Handle negative numbers correctly',
                'You can submit multiple times, but only the best submission counts'
            ],
            scoring: 'Full points (100) for all test cases passed. Partial credit for some test cases.',
            warnings: [
                'Timer starts immediately after clicking Continue',
                'Consider edge cases (all negative numbers, single element)',
                'Optimize for large arrays',
                'Auto-submission occurs when time runs out'
            ]
        }
    };

    return rules[round] || rules['1'];
}

// ===================================
// START CONTEST (Called after rules modal)
// ===================================
function startContest() {
    // Remove rules modal
    const modal = document.getElementById('rulesModal');
    if (modal) {
        modal.remove();
    }

    // Hide language selection
    document.getElementById('languageSelectionSection').style.display = 'none';

    // Show coding challenge
    document.getElementById('codingChallengeSection').style.display = 'block';

    // Load problem based on language and round
    loadProblem();

    // Start the round timer
    startRoundTimer();

    // Load code template and create Monaco Editor
    setTimeout(() => {
        loadCodeTemplate();
    }, 100);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Show notification
    showNotification('Contest started! Good luck!', 'success');
}

function changeLanguage() {
    if (confirm('Are you sure you want to change language? Your current code will be lost.')) {
        if (monacoEditor) {
            monacoEditor.dispose();
            monacoEditor = null;
        }
        document.getElementById('languageSelectionSection').style.display = 'block';
        document.getElementById('codingChallengeSection').style.display = 'none';
        currentLanguage = null;
        document.getElementById('selectedLanguage').textContent = 'Not Selected';
        clearOutput();
    }
}

// ===================================
// PROBLEM LOADING
// ===================================
function loadProblem() {
    const problemContent = document.getElementById('problemContent');

    // Get language-specific problem descriptions
    const problemDescriptions = getLanguageSpecificProblem(currentRound, currentLanguage);

    problemContent.innerHTML = `
        <div class="problem-header">
            <h2>${problemDescriptions.title}</h2>
            <div class="problem-tags">
                <span class="tag tag-${problemDescriptions.difficulty.toLowerCase()}">${problemDescriptions.difficulty}</span>
                <span class="tag">
                    <i data-lucide="clock"></i>
                    ${problemDescriptions.timeLimit}
                </span>
                <span class="tag">
                    <i data-lucide="cpu"></i>
                    ${problemDescriptions.memoryLimit}
                </span>
            </div>
        </div>
        
        <div class="problem-section">
            <h3>Problem Description (${getLanguageName(currentLanguage)})</h3>
            <p>${problemDescriptions.description}</p>
            ${problemDescriptions.languageNote ? `<div class="language-note"><i data-lucide="info"></i><p>${problemDescriptions.languageNote}</p></div>` : ''}
        </div>
        
        <div class="problem-section">
            <h3>Input Format</h3>
            <p>${problemDescriptions.inputFormat}</p>
            ${problemDescriptions.inputExample ? `<pre class="format-example">${problemDescriptions.inputExample}</pre>` : ''}
        </div>
        
        <div class="problem-section">
            <h3>Output Format</h3>
            <p>${problemDescriptions.outputFormat}</p>
            ${problemDescriptions.outputExample ? `<pre class="format-example">${problemDescriptions.outputExample}</pre>` : ''}
        </div>
        
        <div class="problem-section buggy-code-section">
            <h3>
                <i data-lucide="alert-triangle"></i>
                Buggy Code (Read Only)
            </h3>
            <p class="buggy-code-description">The following ${getLanguageName(currentLanguage)} code has bugs. Analyze it and write the correct version in your editor below.</p>
            <div class="buggy-code-container">
                <div class="code-header">
                    <span class="code-language">${getLanguageName(currentLanguage)}</span>
                    <span class="code-status">
                        <i data-lucide="x-circle"></i>
                        Contains Bugs
                    </span>
                </div>
                <pre class="buggy-code" id="buggycode"><code>${escapeHtml(problemDescriptions.buggyCode)}</code></pre>
            </div>
            <button class="btn btn-primary" style="background-color:green;
            margin-top:10px;" onclick="copyText()">copy</button>
        </div>
        
        <div class="problem-section">
            <h3>Examples</h3>
            ${problemDescriptions.examples.map((example, index) => `
                <div class="example-case">
                    <h4>Example ${index + 1}:</h4>
                    <div class="example-grid">
                        <div class="example-box">
                            <strong>Input:</strong>
                            <pre>${example.input}</pre>
                        </div>
                        <div class="example-box">
                            <strong>Output:</strong>
                            <pre>${example.output}</pre>
                        </div>
                    </div>
                    <p class="example-explanation"><strong>Explanation:</strong> ${example.explanation}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="problem-section">
            <h3>Constraints</h3>
            <ul>
                <li>Time Limit: ${problemDescriptions.timeLimit} per test case</li>
                <li>Memory Limit: ${problemDescriptions.memoryLimit}</li>
                <li>You can submit your solution multiple times</li>
                <li>Only the best submission will be considered for scoring</li>
            </ul>
        </div>
        
        <div class="problem-section">
            <h3>Task</h3>
            <p>${problemDescriptions.task}</p>
        </div>
    `;

    lucide.createIcons();
}

// ===================================
// LANGUAGE-SPECIFIC PROBLEM DESCRIPTIONS
// ===================================
function getLanguageSpecificProblem(round, language) {
    const problems = {
        '1': {
            python: {
                title: "Rock Paper Scissor Game",
                description: "Create a Python program that allows a user to play Rock–Paper–Scissors against the computer. The computer should generate a random choice (1-3), and the program must determine whether the user wins, loses, or the match is a draw.", difficulty: "Easy",
                timeLimit: "15",
                memoryLimit: "256 MB",
                inputFormat: "A single integer n (1 ≤ n ≤ 3) representing the user's choice.\n1 = Rock\n2 = Paper\n3 = Scissors",
                inputExample: "1",
                outputFormat: "Print one line:\n- 'Draw' if both choices are same\n- 'You Win' if player wins\n- 'Computer Wins' otherwise",

                outputExample: "Draw",

                languageNote: "In Python, use random.randint(1,3) to generate the computer's move.",

                task: "Fix the buggy code so that:\n1. The computer generates numbers from 1 to 3 correctly.\n2. Comparison operator is used correctly instead of assignment.\n3. The winner logic works properly.",

                buggyCode: getBuggyCode('1', 'python'),

                examples: [
                    {
                        input: "1",
                        output: "Draw",
                        explanation: "If computer also generates 1 (Rock), result is Draw."
                    },
                    {
                        input: "2",
                        output: "You Win",
                        explanation: "If user = 2 (Paper) and computer = 1 (Rock), Paper beats Rock."
                    },
                    {
                        input: "3",
                        output: "Computer Wins",
                        explanation: "If user = 3 (Scissors) and computer = 1 (Rock), Rock beats Scissors."
                    }
                ]
            }
            ,
            javascript: {
                title: 'Sum of Two Numbers (JavaScript)',
                description: 'Write a JavaScript (Node.js) program that reads two integers from standard input and prints their sum. Use the readline module to handle input.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'Two space-separated integers a and b on a single line (1 ≤ a, b ≤ 1000)',
                inputExample: '5 10',
                outputFormat: 'Print a single integer - the sum of a and b',
                outputExample: '15',
                languageNote: 'In Node.js, use the readline module to read from stdin. Split the input and convert to numbers using map(Number).',
                task: 'Fix the buggy code by changing the multiplication operator to addition in the result calculation.',
                buggyCode: getBuggyCode('1', 'javascript'),
                examples: [
                    { input: '5 10', output: '15', explanation: '5 + 10 = 15' },
                    { input: '100 200', output: '300', explanation: '100 + 200 = 300' },
                    { input: '1 1', output: '2', explanation: '1 + 1 = 2' }
                ]
            },
            java: {
                title: 'Rock Paper Scissor Game (Java)',
                description: 'Write a Java program that allows the user to play Rock–Paper–Scissors against the computer using the Random class.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer n (1 ≤ n ≤ 3)\n1 = Rock\n2 = Paper\n3 = Scissors',
                inputExample: '3',
                outputFormat: 'Print one line:\nDraw\nYou Win\nComputer Wins',
                outputExample: 'Computer Wins',
                languageNote: 'Use rand.nextInt(3) + 1 to generate numbers from 1 to 3. Use == for comparison.',
                task: 'Fix the buggy code by correcting the random range and replacing the assignment operator with comparison operator.',
                buggyCode: getBuggyCode('1', 'java'),
                examples: [
                    { input: '1', output: 'Draw', explanation: 'If both user and computer choose Rock, the result is Draw.' },
                    { input: '2', output: 'You Win', explanation: 'Paper beats Rock.' },
                    { input: '3', output: 'Computer Wins', explanation: 'Rock beats Scissors if computer chooses 1.' }
                ]
            }
            ,
            cpp: {
                title: 'Rock Paper Scissor Game (C++)',
                description: 'Write a C++ program that allows the user to play Rock–Paper–Scissors against the computer. The computer should generate a random number between 1 and 3 and determine the winner correctly.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer n (1 ≤ n ≤ 3)\n1 = Rock\n2 = Paper\n3 = Scissors',
                inputExample: '1',
                outputFormat: 'Print one line:\nDraw\nYou Win\nComputer Wins',
                outputExample: 'Draw',
                languageNote: 'Use rand()%3 + 1 to generate numbers from 1 to 3. Use == for comparison.',
                task: 'Fix the buggy code so that:\n1. The computer generates numbers from 1 to 3 correctly.\n2. Comparison operator is used correctly instead of assignment.\n3. The winner logic works properly.',
                buggyCode: getBuggyCode('1', 'cpp'),
                examples: [
                    { input: '1', output: 'Draw', explanation: 'If computer also generates 1 (Rock), the result is Draw.' },
                    { input: '2', output: 'You Win', explanation: 'If user = 2 (Paper) and computer = 1 (Rock), Paper beats Rock.' },
                    { input: '3', output: 'Computer Wins', explanation: 'If user = 3 (Scissors) and computer = 1 (Rock), Rock beats Scissors.' }
                ]
            }
            ,
            c: {
                title: 'Rock Paper Scissor Game (C)',
                description: 'Write a C program that allows the user to play Rock–Paper–Scissors against the computer using random number generation.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer n (1 ≤ n ≤ 3)\n1 = Rock\n2 = Paper\n3 = Scissors',
                inputExample: '2',
                outputFormat: 'Print one line:\nDraw\nYou Win\nComputer Wins',
                outputExample: 'You Win',
                languageNote: 'Use rand()%3 + 1 to generate numbers from 1 to 3. Use == for comparison in conditions.',
                task: 'Fix the buggy code so that:\n1. The computer generates numbers from 1 to 3 correctly.\n2. Comparison operator is used correctly instead of assignment.\n3. The winner logic works properly.',
                buggyCode: getBuggyCode('1', 'c'),
                examples: [
                    { input: '1', output: 'Draw', explanation: 'If both user and computer choose Rock, the result is Draw.' },
                    { input: '2', output: 'You Win', explanation: 'Paper beats Rock.' },
                    { input: '3', output: 'Computer Wins', explanation: 'Rock beats Scissors if computer chooses 1.' }
                ]
            }
            ,
            csharp: {
                title: 'Sum of Two Numbers (C#)',
                description: 'Write a C# program that reads two integers from standard input and prints their sum. Use Console.ReadLine() for input and Console.WriteLine() for output.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'Two space-separated integers a and b on a single line (1 ≤ a, b ≤ 1000)',
                inputExample: '5 10',
                outputFormat: 'Print a single integer - the sum of a and b',
                outputExample: '15',
                languageNote: 'In C#, use Console.ReadLine().Split() to read input, then parse with int.Parse().',
                task: 'Fix the buggy code by changing the multiplication operator to addition.',
                buggyCode: getBuggyCode('1', 'csharp'),
                examples: [
                    { input: '5 10', output: '15', explanation: '5 + 10 = 15' },
                    { input: '100 200', output: '300', explanation: '100 + 200 = 300' },
                    { input: '1 1', output: '2', explanation: '1 + 1 = 2' }
                ]
            }
        },
        '2': {
            python: {
                title: 'Sorting and Searching (Python)',
                description: 'Write a Python program that sorts a list in ascending order and then searches for a given element using linear search.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer target (element to search)',
                inputExample: '7',
                outputFormat: 'First print the sorted array.\nThen print either:\nElement found at index X\nOR\nElement not found',
                outputExample: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4',
                languageNote: 'Use nested loops for sorting. Avoid using built-in sort().',
                task: 'Fix the sorting condition and loop boundary issues.',
                buggyCode: getBuggyCode('2', 'python'),
                examples: [
                    { input: '7', output: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4', explanation: 'After sorting, 7 is at index 4.' },
                    { input: '10', output: 'Sorted array: 1 2 3 5 7 9\nElement not found', explanation: '10 is not present in the array.' }
                ]
            }
            ,
            javascript: {
                title: 'Reverse a String (JavaScript)',
                description: 'Write a JavaScript (Node.js) program that reads a string from standard input and prints it in reverse order. Use array methods to reverse the string.',
                difficulty: 'Medium',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single string s (1 ≤ length ≤ 1000, no spaces)',
                inputExample: 'hello',
                outputFormat: 'Print the reversed string',
                outputExample: 'olleh',
                languageNote: 'In JavaScript, convert string to array with split(\'\'), reverse it with reverse(), then join back with join(\'\').',
                task: 'Fix the buggy code by implementing the string reversal using split, reverse, and join methods.',
                buggyCode: getBuggyCode('2', 'javascript'),
                examples: [
                    { input: 'hello', output: 'olleh', explanation: 'Reverse of "hello" is "olleh"' },
                    { input: 'CodeArena', output: 'anerAedoC', explanation: 'Reverse of "CodeArena" is "anerAedoC"' },
                    { input: 'javascript', output: 'tpircsavaj', explanation: 'Reverse of "javascript" is "tpircsavaj"' }
                ]
            },
            java: {
                title: 'Sorting and Searching (Java)',
                description: 'Write a Java program that sorts an array in ascending order and searches for a target element.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer target',
                inputExample: '7',
                outputFormat: 'Print sorted array and search result.',
                outputExample: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4',
                languageNote: 'Use nested loops for sorting and linear search.',
                task: 'Fix sorting logic, loop boundary, comparison operator, and variable scope.',
                buggyCode: getBuggyCode('sort_search', 'java'),
                examples: [
                    { input: '7', output: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4', explanation: 'After sorting, 7 is at index 4.' },
                    { input: '10', output: 'Sorted array: 1 2 3 5 7 9\nElement not found', explanation: '10 is not present in the array.' }
                ]
            },
            cpp: {
                title: 'Sorting and Searching (C++)',
                description: 'Write a C++ program that sorts an array in ascending order and then searches for a given element using linear search. Print the sorted array and the index of the element if found.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer target (element to search)',
                inputExample: '7',
                outputFormat: 'First print the sorted array.\nThen print either:\nElement found at index X\nOR\nElement not found',
                outputExample: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4',
                languageNote: 'Use nested loops for sorting and linear search for searching.',
                task: 'Fix all the bugs in the sorting condition, loop boundary, comparison operator, and variable scope.',
                buggyCode: getBuggyCode('2', 'cpp'),
                examples: [
                    {
                        input: '7',
                        output: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4',
                        explanation: 'After sorting, 7 is at index 4 (0-based indexing).'
                    },
                    {
                        input: '10',
                        output: 'Sorted array: 1 2 3 5 7 9\nElement not found',
                        explanation: '10 is not present in the array.'
                    }
                ]
            }
            ,
            c: {
                title: 'Sorting and Searching (C)',
                description: 'Write a C program that sorts an array in ascending order and then searches for a given element using linear search.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single integer target (element to search)',
                inputExample: '7',
                outputFormat: 'First print the sorted array.\nThen print either:\nElement found at index X\nOR\nElement not found',
                outputExample: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4',
                languageNote: 'Use nested loops for sorting and linear search for searching.',
                task: 'Fix the bugs in sorting condition, loop boundary, comparison operator, and variable scope.',
                buggyCode: getBuggyCode('2', 'c'),
                examples: [
                    { input: '7', output: 'Sorted array: 1 2 3 5 7 9\nElement found at index 4', explanation: 'After sorting, 7 is at index 4.' },
                    { input: '10', output: 'Sorted array: 1 2 3 5 7 9\nElement not found', explanation: '10 is not present in the array.' }
                ]
            }
            ,
            csharp: {
                title: 'Sum of Two Numbers (C#)',
                description: 'Write a C# program that reads a string from standard input and prints it in reverse order. Use LINQ Reverse() or manual character array reversal.',
                difficulty: 'Medium',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single string s (1 ≤ length ≤ 1000, no spaces)',
                inputExample: 'hello',
                outputFormat: 'Print the reversed string',
                outputExample: 'olleh',
                languageNote: 'In C#, convert string to char array, use Array.Reverse(), or use LINQ: new string(s.Reverse().ToArray()).',
                task: 'Fix the buggy code by implementing string reversal using Array.Reverse() or LINQ.',
                buggyCode: getBuggyCode('2', 'csharp'),
                examples: [
                    { input: 'hello', output: 'olleh', explanation: 'Reverse of "hello" is "olleh"' },
                    { input: 'CodeArena', output: 'anerAedoC', explanation: 'Reverse of "CodeArena" is "anerAedoC"' },
                    { input: 'csharp', output: 'prahsc', explanation: 'Reverse of "csharp" is "prahsc"' }
                ]
            }
        },
        '3': {
            python: {
                title: 'Cart Chaos: Multi-Cart Inventory Debugging (Python)',
                description: 'You are given a Python implementation of a Shopping Cart system using dictionaries and object references. The system contains logical bugs in discount stacking, incorrect discount formula, rollback logic, and shared state between multiple cart objects. Improper shallow copying causes inventory inconsistencies. Debug and fix the implementation.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'No input required. The program executes predefined cart operations.',
                inputExample: 'No input',
                outputFormat: 'Program should calculate totals correctly and maintain consistent stock after operations.',
                outputExample: 'Correct totals and correct final stock values.',
                languageNote: 'Be careful with shallow vs deep copy (copy.copy), object reference behavior, discount stacking, flat subtraction instead of percentage calculation, and rollback underflow.',
                task: 'Correct the bugs so that discount is calculated properly, rollback restores inventory safely, multi-cart copies do not corrupt shared state, and checkout behaves correctly.',
                buggyCode: getBuggyCode('3', 'python'),
                examples: [
                    { input: 'No input', output: 'alredy provided', explanation: 'Inventory and totals must match correct business logic.' }
                ]
            }
            ,
            javascript: {
                title: 'Find Maximum in Array (JavaScript)',
                description: 'Write a JavaScript (Node.js) program that reads an array of integers and finds the maximum element. Use Math.max() with spread operator or manual iteration.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'First line: n (size of array, 1 ≤ n ≤ 10^5). Second line: n space-separated integers (-10^9 ≤ each element ≤ 10^9)',
                inputExample: '5\\n3 7 2 9 1',
                outputFormat: 'Print the maximum element',
                outputExample: '9',
                languageNote: 'In JavaScript, use Math.max(...arr) with spread operator, or use reduce() to find maximum.',
                task: 'Fix the buggy code by changing Math.min to Math.max in the result calculation.',
                buggyCode: getBuggyCode('3', 'javascript'),
                examples: [
                    { input: '5\\n3 7 2 9 1', output: '9', explanation: 'Maximum element is 9' },
                    { input: '4\\n-5 -2 -8 -1', output: '-1', explanation: 'Maximum element is -1 (all negative)' },
                    { input: '3\\n100 200 150', output: '200', explanation: 'Maximum element is 200' }
                ]
            },
            java: {
                title: 'Cart Chaos: Multi-Cart Inventory Debugging (Java)',
                description: 'You are given a Java implementation of a Shopping Cart system using classes and HashMap. The system contains logical bugs in discount stacking, incorrect flat discount subtraction, rollback handling, and shallow copying of cart objects that leads to shared state corruption. Because Java objects are reference-based, improper copying leads to inventory inconsistencies. Debug and fix the implementation.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'No input required. The main() method contains predefined cart operations.',
                inputExample: 'No input',
                outputFormat: 'Program should calculate totals correctly and maintain consistent inventory.',
                outputExample: 'Correct total and correct final stock values.',
                languageNote: 'Be careful with reference copying of HashMap, discount stacking, incorrect percentage formula, rollback underflow, and shared object references between carts.',
                task: 'Fix the logical issues so that discount behaves correctly, rollback restores stock safely, multi-cart copying does not corrupt shared inventory, and checkout resets state correctly.',
                buggyCode: getBuggyCode('3', 'java'),
                examples: [
                    { input: 'No input', output: 'alredy provided', explanation: 'After fixing, totals and stock should follow correct business logic.' }
                ]
            }
            ,
            cpp: {
                title: 'Cart Chaos: Multi-Cart Inventory Debugging (C++)',
                description: 'You are given a C++ Shopping Cart system using classes, unordered_map, shallow copy constructor, and Product pointers. The system contains logical bugs in discount calculation, rollback handling, stock restoration, and multi-cart state management. Because CartItem stores Product pointers, shallow copying leads to shared state corruption. Your task is to debug and fix the implementation.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'No input required. The program contains predefined cart operations inside main().',
                inputExample: 'No input',
                outputFormat: 'Program should correctly calculate totals and maintain proper stock consistency after all operations.',
                outputExample: 'Correct totals and consistent stock values after checkout.',
                languageNote: 'Pay attention to shallow copy constructor behavior, pointer sharing, discount stacking, incorrect percentage formula, rollback underflow, and inventory corruption between cart copies.',
                task: 'Fix the buggy code so that discount is applied correctly as percentage, does not stack incorrectly, rollback restores stock safely, removeItem does not corrupt shared inventory, and checkout resets cart state properly.',
                buggyCode: getBuggyCode('3', 'cpp'),
                examples: [
                    { input: 'No input', output: 'alredy provided', explanation: 'After fixing, totals and inventory should follow proper business logic.' }
                ]
            }
            ,
            c: {
                title: 'Cart Chaos: Multi-Cart Inventory Debugging (C)',
                description: 'You are given a C implementation of a Shopping Cart system using structs and arrays. The program contains logical bugs in discount stacking, incorrect flat discount subtraction, rollback handling, and struct copying behavior that leads to inventory corruption. Since C uses manual state management, shallow struct copying causes shared inventory inconsistencies. Debug and fix the implementation.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'No input required. Predefined operations are executed inside main().',
                inputExample: 'No input',
                outputFormat: 'Program should compute totals correctly and maintain proper stock consistency.',
                outputExample: 'Correct total and consistent final stock values.',
                languageNote: 'Pay attention to struct copy behavior, manual stock updates, discount stacking, incorrect percentage formula, and rollback quantity underflow.',
                task: 'Fix the logical errors in discount calculation, rollback operation, removeItem handling, and multi-cart struct copying.',
                buggyCode: getBuggyCode('3', 'c'),
                examples: [
                    { input: 'No input', output: 'alredy provided', explanation: 'Stock and totals should remain logically consistent after operations.' }
                ]
            }
            ,
            csharp: {
                title: 'Find Maximum in Array (C#)',
                description: 'Write a C# program that reads an array of integers and finds the maximum element. Use LINQ Max() method or manual iteration.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'First line: n (size of array, 1 ≤ n ≤ 10^5). Second line: n space-separated integers (-10^9 ≤ each element ≤ 10^9)',
                inputExample: '5\\n3 7 2 9 1',
                outputFormat: 'Print the maximum element',
                outputExample: '9',
                languageNote: 'In C#, use LINQ: arr.Max(), or iterate manually to find the maximum value.',
                task: 'Fix the buggy code by changing Min() to Max() in the LINQ query.',
                buggyCode: getBuggyCode('3', 'csharp'),
                examples: [
                    { input: '5\\n3 7 2 9 1', output: '9', explanation: 'Maximum element is 9' },
                    { input: '4\\n-5 -2 -8 -1', output: '-1', explanation: 'Maximum element is -1 (all negative)' },
                    { input: '3\\n100 200 150', output: '200', explanation: 'Maximum element is 200' }
                ]
            }
        }
    };

    // Get problem for current round and language, fallback to python if language not found
    const roundProblems = problems[currentRound] || problems['1'];
    const problem = roundProblems[currentLanguage] || roundProblems['python'];

    return problem;
}
function copyText() {
    let text = document.getElementById("buggycode").innerText
    navigator.clipboard.writeText(text);

}
// ===================================
// BUGGY CODE GENERATOR
// ===================================
function getBuggyCode(round, language) {
    const buggyCodeMap = {
        python: {
            '1': `# Buggy Python Code - Sum of Two Numbers


import random
import time

def generate_computer_choice():
    random.seed(int(time.time()))   
    return random.randint(1, 3)

def get_choice_name(choice):
    if choice == 1:
        return "Rock"
    elif choice == 2:
        return "Paper"
    elif choice == 3:
        return "Scissors"
    elif choice == 4:
        return "Exit"
    else:
        return "Invalid"

def calculate_result(user, computer):
    if user == computer:
        return 0
    if (user == 1 and computer == 3) or \
       (user == 2 and computer == 1) or \
       (user == 3 and computer == 2):
        return 1
    return -1

while True:
    print("\n===== Rock Paper Scissors Game =====")
    print("1. Rock\n2. Paper\n3. Scissors\n4. Exit")
    
    user_choice = int(input("Enter your choice: "))

    if user_choice == 4:
        print("Exiting Game...")
        break

    computer_choice = generate_computer_choice()

    print("You chose:", get_choice_name(user_choice))
    print("Computer chose:", get_choice_name(computer_choice))

    result = calculate_result(user_choice, computer_choice)

    result = -result

    
    if result == 0:
        print("Result: Computer Wins")   
    elif result == 1:
        print("Result: Computer Wins")  
    else:
        print("Result: Computer Wins")   

    if user_choice < 1 or user_choice > 4:
        print("Invalid input detected.")
`,
            '2': `arr = [5, 2, 9, 1, 7, 3]
n = len(arr)


for i in range(n):
    for j in range(i + 1, n):
        if arr[i] < arr[j]:   # BUG 1: descending sort
            arr[i], arr[j] = arr[j], arr[i]

print("Sorted array:", *arr)

target = int(input())

found = False

# Searching (Buggy)
for i in range(n + 1):   # BUG 2: out of bounds
    if arr[i] == target:
        found = True
        break

if found = True:   # BUG 3: invalid comparison (syntax error)
    print("Element found at index", i)
else:
    print("Element not found")
`,
            '3': `import copy

class Product:
    def __init__(self, id, name, price, stock):
        self.id = id
        self.name = name
        self.price = price
        self.stock = stock

    def reduce_stock(self, quantity):
        if quantity <= self.stock:
            self.stock -= quantity
            return True
        return False

    def increase_stock(self, quantity):
        self.stock += quantity


class ShoppingCart:
    def __init__(self):
        self.items = {}
        self.history = []
        self.discount = 0

    def add_item(self, product, quantity):

        if not product.reduce_stock(quantity):
            return False

        if product.id in self.items:
            self.items[product.id]["quantity"] += quantity
        else:
            self.items[product.id] = {
                "product": product,
                "quantity": quantity
            }

        self.history.append(product.id)
        return True

    def remove_item(self, product_id):

        if product_id not in self.items:
            return

        product = self.items[product_id]["product"]
        quantity = self.items[product_id]["quantity"]

        product.increase_stock(quantity)

        del self.items[product_id]

    def apply_discount(self, percentage):
        self.discount += percentage

    def update_price(self, product, new_price):
        product.price = new_price

    def rollback_last_add(self):

        if not self.history:
            return

        last_id = self.history.pop()

        if last_id in self.items:
            self.items[last_id]["quantity"] -= 1

            if self.items[last_id]["quantity"] == 0:
                del self.items[last_id]

    def calculate_total(self):

        total = 0

        for item in self.items.values():
            total += item["product"].price * item["quantity"]

        total = total - self.discount
        return total

    def checkout(self):

        total = self.calculate_total()

        self.items.clear()
        self.history.clear()

        return total

    def audit(self):

        print("\n=== CART AUDIT ===")
        print("Items in cart:", len(self.items))
        print("Discount:", self.discount, "%")

        total_quantity = 0
        for item in self.items.values():
            total_quantity += item["quantity"]

        print("Total Quantity in Cart:", total_quantity)
        print("===================")


# ---------------- MAIN ----------------

laptop = Product(1, "Laptop", 1000.0, 5)
mouse = Product(2, "Mouse", 50.0, 10)

cart = ShoppingCart()

cart.add_item(laptop, 2)
cart.add_item(mouse, 3)

cart.apply_discount(10)
cart.apply_discount(5)

print("Total:", cart.calculate_total())

cart2 = copy.copy(cart)
cart2.items = cart.items.copy()
cart2.history = cart.history.copy()

cart2.remove_item(1)

cart.rollback_last_add()

print("Cart Total After Rollback:", cart.calculate_total())

cart.update_price(laptop, 1200.0)

print("Cart Total After Price Change:", cart.calculate_total())

print("Checkout Total:", cart.checkout())

cart.audit()

print("\nFinal Stock - Laptop:", laptop.stock,
      "Mouse:", mouse.stock)
`
        },
        javascript: {
            '1': `// Buggy JavaScript Code - Sum of Two Numbers
// BUG: Using multiplication instead of addition
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const [a, b] = line.split(' ').map(Number);
    const result = a * b;  // Should be a + b
    console.log(result);
    rl.close();
});`,
            '2': `// Buggy JavaScript Code - Reverse a String
// BUG: Not reversing, just returning same string
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const result = line;  // Should be line.split('').reverse().join('')
    console.log(result);
    rl.close();
});`,
            '3': `// Buggy JavaScript Code - Find Maximum
// BUG: Using Math.min instead of Math.max
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let n, arr;
let lineCount = 0;

rl.on('line', (line) => {
    if (lineCount === 0) {
        n = parseInt(line);
    } else {
        arr = line.split(' ').map(Number);
        const result = Math.min(...arr);  // Should be Math.max
        console.log(result);
        rl.close();
    }
    lineCount++;
});`
        },
        java: {
            '1': `// Buggy Java Code - Rock Paper Scessor Game 



import java.util.*;

public class RockPaperScissors {

    public static int generateComputerChoice() {
        Random rand = new Random(System.currentTimeMillis());
        return rand.nextInt(3) + 1;
    }

    public static String getChoiceName(int choice) {
        if (choice == 1) return "Rock";
        else if (choice == 2) return "Paper";
        else if (choice == 3) return "Scissors";
        else if (choice == 4) return "Exit";
        else return "Invalid";
    }

    public static int calculateResult(int user, int computer) {
        if (user == computer) return 0;

        if ((user == 1 && computer == 3) ||
            (user == 2 && computer == 1) ||
            (user == 3 && computer == 2))
            return 1;

        return -1;
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        while (true) {

            System.out.println("\n===== Rock Paper Scissors Game =====");
            System.out.println("1. Rock\n2. Paper\n3. Scissors\n4. Exit");
            System.out.print("Enter your choice: ");
            int userChoice = sc.nextInt();

            if (userChoice == 4) {
                System.out.println("Exiting Game...");
                break;
            }

            int computerChoice = generateComputerChoice();

            System.out.println("You chose: " + getChoiceName(userChoice));
            System.out.println("Computer chose: " + getChoiceName(computerChoice));

            int result = calculateResult(userChoice, computerChoice);

            result = -result;   

            if (result == 0)
                System.out.println("Result: Computer Wins");
            else if (result == 1)
                System.out.println("Result: Computer Wins");
            else
                System.out.println("Result: Computer Wins");

            if (userChoice < 1 || userChoice > 4)
                System.out.println("Invalid input detected.");
        }

        sc.close();
    }
}

`,
            '2': `// Buggy Java Code - Reverse a String
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int arr[] = {5, 2, 9, 1, 7, 3};
        int n = arr.length;

        // Sorting 
        for(int i = 0; i < n; i++) {
            for(int j = i + 1; j < n; j++) {
                if(arr[i] < arr[j]) {  
                    int temp = arr[i];
                    arr[i] = arr[j];
                    arr[j] = temp;
                }
            }
        }

        System.out.print("Sorted array: ");
        for(int i = 0; i < n; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();

        Scanner sc = new Scanner(System.in);
        int target = sc.nextInt();

        boolean found = false;

        for(int i = 0; i <= n; i++) {  
            if(arr[i] == target) {
                found = true;
                break;
            }
        }

        if(found = true) {   
            System.out.println("Element found at index " + i); 
        } else {
            System.out.println("Element not found");
        }
    }
}
`,
            '3': `import java.util.*;

class Product {
    int id;
    String name;
    double price;
    int stock;

    Product(int id, String name, double price, int stock) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    boolean reduceStock(int quantity) {
        if (quantity <= stock) {
            stock -= quantity;
            return true;
        }
        return false;
    }

    void increaseStock(int quantity) {
        stock += quantity;
    }
}

class ShoppingCart {

    static class CartItem {
        Product product;
        int quantity;

        CartItem(Product product, int quantity) {
            this.product = product;
            this.quantity = quantity;
        }
    }

    Map<Integer, CartItem> items = new HashMap<>();
    List<Integer> history = new ArrayList<>();
    double discount = 0;

    // Shallow copy constructor
    ShoppingCart(ShoppingCart other) {
        this.discount = other.discount;
        this.history = new ArrayList<>(other.history);
        this.items = new HashMap<>(other.items);
    }

    ShoppingCart() {}

    boolean addItem(Product product, int quantity) {

        if (!product.reduceStock(quantity))
            return false;

        if (items.containsKey(product.id)) {
            items.get(product.id).quantity += quantity;
        } else {
            items.put(product.id,
                    new CartItem(product, quantity));
        }

        history.add(product.id);
        return true;
    }

    void removeItem(int id) {

        if (!items.containsKey(id))
            return;

        CartItem item = items.get(id);

        item.product.increaseStock(item.quantity);

        items.remove(id);
    }

    void applyDiscount(double percentage) {
        discount += percentage;
    }

    void updatePrice(Product product, double newPrice) {
        product.price = newPrice;
    }

    void rollbackLastAdd() {

        if (history.isEmpty())
            return;

        int lastId = history.remove(history.size() - 1);

        if (items.containsKey(lastId)) {

            CartItem item = items.get(lastId);
            item.quantity--;

            if (item.quantity == 0)
                items.remove(lastId);
        }
    }

    double calculateTotal() {

        double total = 0;

        for (CartItem item : items.values()) {
            total += item.product.price * item.quantity;
        }

        total = total - discount;
        return total;
    }

    double checkout() {

        double total = calculateTotal();

        items.clear();
        history.clear();

        return total;
    }

    void audit() {

        System.out.println("\n=== CART AUDIT ===");
        System.out.println("Items in cart: " + items.size());
        System.out.println("Discount: " + discount + "%");

        int totalQuantity = 0;
        for (CartItem item : items.values()) {
            totalQuantity += item.quantity;
        }

        System.out.println("Total Quantity in Cart: " + totalQuantity);
        System.out.println("===================");
    }
}

public class Main {

    public static void main(String[] args) {

        Product laptop = new Product(1, "Laptop", 1000.0, 5);
        Product mouse = new Product(2, "Mouse", 50.0, 10);

        ShoppingCart cart = new ShoppingCart();

        cart.addItem(laptop, 2);
        cart.addItem(mouse, 3);

        cart.applyDiscount(10);
        cart.applyDiscount(5);

        System.out.println("Total: " + cart.calculateTotal());

        ShoppingCart cart2 = new ShoppingCart(cart);

        cart2.removeItem(1);

        cart.rollbackLastAdd();

        System.out.println("Cart Total After Rollback: "
                + cart.calculateTotal());

        cart.updatePrice(laptop, 1200.0);

        System.out.println("Cart Total After Price Change: "
                + cart.calculateTotal());

        System.out.println("Checkout Total: "
                + cart.checkout());

        cart.audit();

        System.out.println("\nFinal Stock - Laptop: "
                + laptop.stock + ", Mouse: "
                + mouse.stock);
    }
}

`
        },
        cpp: {
            '1': `// Buggy C++ Code - Rock Paper Scessor Game
#include <iostream>
#include <cstdlib>
#include <ctime>
using namespace std;

int generateComputerChoice() {
    srand(time(0));                 
    int value = rand() % 3 + 1;     
    return value;
}

string getChoiceName(int choice) {
    if (choice == 1)
        return "Rock";
    else if (choice == 2)
        return "Paper";
    else if (choice == 3)
        return "Scissors";
    else if (choice == 4)
        return "Exit";
    else
        return "Invalid";
}

int calculateResult(int user, int computer) {
    
    if (user == computer)
        return 0;   // draw
    
    if ((user == 1 && computer == 3) ||
        (user == 2 && computer == 1) ||
        (user == 3 && computer == 2))
        return 1;   // user win
    
    return -1;      
}

int main() {

    int userChoice;

    while (true) {

        cout << "\n===== Rock Paper Scissors Game =====\n";
        cout << "1. Rock\n2. Paper\n3. Scissors\n4. Exit\n";
        cout << "Enter your choice: ";
        cin >> userChoice;

        if (userChoice == 4) {
            cout << "Exiting Game...\n";
            break;
        }

        int computerChoice = generateComputerChoice();

        cout << "\nYou chose: " << getChoiceName(userChoice) << endl;
        cout << "Computer chose: " << getChoiceName(computerChoice) << endl;

        int result = calculateResult(userChoice, computerChoice);

        
        result = -result;

        
        if (result = 0) {
            cout << "\nResult: Draw\n";
        }
        else if (result == 1) {
            cout << "\nResult: You Win!\n";
        }
        else {
            cout << "\nResult: Computer Wins!\n";
        }

        
        if (userChoice < 1 || userChoice > 4) {
            cout << "Invalid input detected.\n";
        }
    }

    return 0;
}
`,
            '2': `// Buggy C++ Code - Reverse a String
#include <iostream>
using namespace std;

int main() {
    int arr[] = {5, 2, 9, 1, 7, 3};
    int n = sizeof(arr) / sizeof(arr[0]);

    // Sorting (Buggy)
    for(int i = 0; i < n; i++) {
        for(int j = i + 1; j < n; j++) {
            if(arr[i] < arr[j]) {   
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
    }

    cout << "Sorted array: ";
    for(int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;

    int target;
    cin >> target;

    bool found = false;

   
    for(int i = 0; i <= n; i++) {   
        if(arr[i] == target) {
            found = true;
            break;
        }
    }

    
    if(found = true) {
        cout << "Element found at index " << i << endl; 
    }
    else {
        cout << "Element not found" << endl;
    }

    return 0;
}
`, '3': `#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

class Product {
private:
    int id;
    string name;
    double price;
    int stock;

public:
    Product(int id, string name, double price, int stock)
        : id(id), name(name), price(price), stock(stock) {}

    int getId() const { return id; }
    string getName() const { return name; }
    double getPrice() const { return price; }
    int getStock() const { return stock; }

    void setPrice(double newPrice) { price = newPrice; }

    bool reduceStock(int quantity) {
        if (quantity <= stock) {
            stock -= quantity;
            return true;
        }
        return false;
    }

    void increaseStock(int quantity) {
        stock += quantity;
    }
};

class ShoppingCart {
private:
    struct CartItem {
        Product* product;
        int quantity;
    };

    unordered_map<int, CartItem> items;
    vector<int> history;
    double discount;

public:
    ShoppingCart() : discount(0) {}

    ShoppingCart(const ShoppingCart& other) {
        discount = other.discount;
        history = other.history;
        items = other.items;
    }

    bool addItem(Product& product, int quantity) {

        if (!product.reduceStock(quantity))
            return false;

        if (items.count(product.getId())) {
            items[product.getId()].quantity += quantity;
        } else {
            items[product.getId()] = { &product, quantity };
        }

        history.push_back(product.getId());

        return true;
    }

    void removeItem(int productId) {

        if (!items.count(productId))
            return;

        Product* product = items[productId].product;
        int quantity = items[productId].quantity;
        product->increaseStock(quantity);

        items.erase(productId);
    }

    void applyDiscount(double percentage) {
        discount += percentage;
    }

    void updatePrice(Product& product, double newPrice) {
        product.setPrice(newPrice);
    }

    void rollbackLastAdd() {

        if (history.empty())
            return;

        int lastId = history.back();
        history.pop_back();

        if (items.count(lastId)) {

            items[lastId].quantity--;

            if (items[lastId].quantity == 0)
                items.erase(lastId);
        }
    }

    double calculateTotal() const {

        double total = 0;

        for (const auto& pair : items) {
            total += pair.second.product->getPrice() *
                     pair.second.quantity;
        }

        total = total - discount;

        return total;
    }

    double checkout() {

        double total = calculateTotal();

        items.clear();
        history.clear();

        return total;
    }

    void audit() const {

        cout << "\n=== CART AUDIT ===\n";
        cout << "Items in cart: " << items.size() << endl;
        cout << "Discount: " << discount << "%" << endl;

        int totalQuantity = 0;
        for (const auto& pair : items)
            totalQuantity += pair.second.quantity;

        cout << "Total Quantity in Cart: "
             << totalQuantity << endl;

        cout << "===================\n";
    }
};

int main() {

    Product laptop(1, "Laptop", 1000.0, 5);
    Product mouse(2, "Mouse", 50.0, 10);

    ShoppingCart cart;

    cart.addItem(laptop, 2);
    cart.addItem(mouse, 3);

    cart.applyDiscount(10);
    cart.applyDiscount(5);

    cout << "Total: $" << cart.calculateTotal() << endl;

    ShoppingCart cart2 = cart;

    cart2.removeItem(1);

    cart.rollbackLastAdd();

    cout << "Cart Total After Rollback: $"
         << cart.calculateTotal() << endl;

    cart.updatePrice(laptop, 1200.0);

    cout << "Cart Total After Price Change: $"
         << cart.calculateTotal() << endl;

    cout << "Checkout Total: $"
         << cart.checkout() << endl;

    cart.audit();

    cout << "\nFinal Stock - Laptop: "
         << laptop.getStock()
         << ", Mouse: "
         << mouse.getStock() << endl;

    return 0;
}
`
        },
        c: {
            '1': `// Buggy C Code - Rock Paper Scessor Game


#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int generateComputerChoice() {
    srand(time(0));           
    return rand() % 3 + 1;
}

char* getChoiceName(int choice) {
    if (choice == 1) return "Rock";
    else if (choice == 2) return "Paper";
    else if (choice == 3) return "Scissors";
    else if (choice == 4) return "Exit";
    else return "Invalid";
}

int calculateResult(int user, int computer) {
    if (user == computer) return 0;

    if ((user == 1 && computer == 3) ||
        (user == 2 && computer == 1) ||
        (user == 3 && computer == 2))
        return 1;

    return -1;
}

int main() {
    int userChoice;

    while (1) {
        printf("\n===== Rock Paper Scissors Game =====\n");
        printf("1. Rock\n2. Paper\n3. Scissors\n4. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &userChoice);

        if (userChoice == 4) {
            printf("Exiting Game...\n");
            break;
        }

        int computerChoice = generateComputerChoice();

        printf("You chose: %s\n", getChoiceName(userChoice));
        printf("Computer chose: %s\n", getChoiceName(computerChoice));

        int result = calculateResult(userChoice, computerChoice);

        result = -result;   

        
        if (result == 0)
            printf("Result: Computer Wins\n");
        else if (result == 1)
            printf("Result: Computer Wins\n");
        else
            printf("Result: Computer Wins\n");

        if (userChoice < 1 || userChoice > 4)
            printf("Invalid input detected.\n");
    }

    return 0;
}

`,
            '2': `// Buggy C Code - Reverse a String
#include <stdio.h>

int main() {
    int arr[] = {5, 2, 9, 1, 7, 3};
    int n = sizeof(arr) / sizeof(arr[0]);

    // Sorting (Buggy)
    for(int i = 0; i < n; i++) {
        for(int j = i + 1; j < n; j++) {
            if(arr[i] < arr[j]) {   // BUG 1: descending sort
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
    }

    printf("Sorted array: ");
    for(int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    int target;
    scanf("%d", &target);

    int found = 0;

    for(int i = 0; i <= n; i++) {   // BUG 2: out of bounds
        if(arr[i] == target) {
            found = 1;
            break;
        }
    }

    if(found = 1) {   // BUG 3: assignment instead of comparison
        printf("Element found at index %d\n", i); // BUG 4: i not accessible
    }
    else {
        printf("Element not found\n");
    }

    return 0;
}
`,
            '3': `#include <stdio.h>
#include <string.h>

#define MAX_ITEMS 20
#define MAX_HISTORY 100

typedef struct {
    int id;
    char name[50];
    double price;
    int stock;
} Product;

typedef struct {
    Product* product;
    int quantity;
} CartItem;

typedef struct {
    CartItem items[MAX_ITEMS];
    int itemCount;

    int history[MAX_HISTORY];
    int historyCount;

    double discount;
} ShoppingCart;


int addItem(ShoppingCart* cart, Product* product, int quantity) {

    if (product->stock >= quantity) {
        product->stock -= quantity;
    } else {
        return 0;
    }

    cart->items[cart->itemCount].product = product;
    cart->items[cart->itemCount].quantity = quantity;
    cart->itemCount++;

    cart->history[cart->historyCount++] = product->id;

    return 1;
}

void removeItem(ShoppingCart* cart, int index) {

    if (index >= cart->itemCount)
        return;

    Product* product = cart->items[index].product;
    int quantity = cart->items[index].quantity;

    product->stock += quantity;

    for (int i = index; i < cart->itemCount - 1; i++) {
        cart->items[i] = cart->items[i + 1];
    }

    cart->itemCount--;
}

void applyDiscount(ShoppingCart* cart, double percentage) {
    cart->discount += percentage;
}

void rollbackLastAdd(ShoppingCart* cart) {

    if (cart->historyCount == 0)
        return;

    int lastId = cart->history[--cart->historyCount];

    for (int i = 0; i < cart->itemCount; i++) {

        if (cart->items[i].product->id == lastId) {

            cart->items[i].quantity--;

            if (cart->items[i].quantity == 0) {
                removeItem(cart, i);
            }

            break;
        }
    }
}

double calculateTotal(ShoppingCart* cart) {

    double total = 0;

    for (int i = 0; i < cart->itemCount; i++) {
        total += cart->items[i].product->price *
                 cart->items[i].quantity;
    }

    total = total - cart->discount;

    return total;
}

double checkout(ShoppingCart* cart) {

    double total = calculateTotal(cart);

    cart->itemCount = 0;
    cart->historyCount = 0;

    return total;
}

void audit(ShoppingCart* cart) {

    printf("\n=== CART AUDIT ===\n");
    printf("Items in cart: %d\n", cart->itemCount);
    printf("Discount: %.2f%%\n", cart->discount);

    int totalQuantity = 0;

    for (int i = 0; i < cart->itemCount; i++) {
        totalQuantity += cart->items[i].quantity;
    }

    printf("Total Quantity in Cart: %d\n", totalQuantity);
    printf("===================\n");
}


int main() {

    Product laptop = {1, "Laptop", 1000.0, 5};
    Product mouse = {2, "Mouse", 50.0, 10};

    ShoppingCart cart = {0};
    cart.discount = 0;

    addItem(&cart, &laptop, 2);
    addItem(&cart, &mouse, 3);

    applyDiscount(&cart, 10);
    applyDiscount(&cart, 5);

    printf("Total: %.2f\n", calculateTotal(&cart));

    ShoppingCart cart2 = cart;

    removeItem(&cart2, 0);

    rollbackLastAdd(&cart);

    printf("Cart Total After Rollback: %.2f\n",
           calculateTotal(&cart));

    laptop.price = 1200.0;

    printf("Cart Total After Price Change: %.2f\n",
           calculateTotal(&cart));

    printf("Checkout Total: %.2f\n",
           checkout(&cart));

    audit(&cart);

    printf("\nFinal Stock - Laptop: %d, Mouse: %d\n",
           laptop.stock, mouse.stock);

    return 0;
}

`
        },
        csharp: {
            '1': `// Buggy C# Code - Sum of Two Numbers
// BUG: Using wrong operator
using System;

class Program {
    static void Main() {
        string[] input = Console.ReadLine().Split();
        int a = int.Parse(input[0]);
        int b = int.Parse(input[1]);
        int result = a * b;  // Should be a + b
        Console.WriteLine(result);
    }
}`,
            '2': `// Buggy C# Code - Reverse a String
// BUG: Not reversing the string
using System;

class Program {
    static void Main() {
        string s = Console.ReadLine();
        string result = s;  // Should reverse the string
        Console.WriteLine(result);
    }
}`,
            '3': `// Buggy C# Code - Find Maximum
// BUG: Using Min instead of Max
using System;
using System.Linq;

class Program {
    static void Main() {
        int n = int.Parse(Console.ReadLine());
        int[] arr = Console.ReadLine().Split().Select(int.Parse).ToArray();
        int result = arr.Min();  // Should be arr.Max()
        Console.WriteLine(result);
    }
}`
        },
        ruby: {
            '1': `# Buggy Ruby Code - Sum of Two Numbers
# BUG: Using division instead of addition
a, b = gets.split.map(&:to_i)
result = a / b  # Should be a + b
puts result`,
            '2': `# Buggy Ruby Code - Reverse a String
# BUG: Not reversing the string
s = gets.chomp
result = s  # Should be s.reverse
puts result`,
            '3': `# Buggy Ruby Code - Find Maximum
# BUG: Using min instead of max
n = gets.to_i
arr = gets.split.map(&:to_i)
result = arr.min  # Should be arr.max
puts result`
        },
        go: {
            '1': `// Buggy Go Code - Sum of Two Numbers
// BUG: Using subtraction instead of addition
package main
import "fmt"

func main() {
    var a, b int
    fmt.Scan(&a, &b)
    result := a - b  // Should be a + b
    fmt.Println(result)
}`,
            '2': `// Buggy Go Code - Reverse a String
// BUG: Not reversing the string
package main
import (
    "fmt"
    "bufio"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Scan()
    s := scanner.Text()
    // Missing reverse logic
    fmt.Println(s)  // Should reverse first
}`,
            '3': `// Buggy Go Code - Find Maximum
// BUG: Finding minimum instead of maximum
package main
import (
    "fmt"
    "math"
)

func main() {
    var n int
    fmt.Scan(&n)
    arr := make([]int, n)
    for i := 0; i < n; i++ {
        fmt.Scan(&arr[i])
    }
    max := math.MinInt32
    for _, num := range arr {
        if num < max {  // Should be num > max
            max = num
        }
    }
    fmt.Println(max)
}`
        },
        rust: {
            '1': `// Buggy Rust Code - Sum of Two Numbers
// BUG: Using multiplication instead of addition
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input.trim().split_whitespace()
        .map(|s| s.parse().unwrap()).collect();
    let result = nums[0] * nums[1];  // Should be nums[0] + nums[1]
    println!("{}", result);
}`,
            '2': `// Buggy Rust Code - Reverse a String
// BUG: Not reversing the string
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let s = input.trim();
    // Missing reverse logic
    println!("{}", s);  // Should reverse first
}`,
            '3': `// Buggy Rust Code - Find Maximum
// BUG: Using min instead of max
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    
    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let arr: Vec<i32> = input.trim().split_whitespace()
        .map(|s| s.parse().unwrap()).collect();
    
    let result = arr.iter().min().unwrap();  // Should be max()
    println!("{}", result);
}`
        },
        php: {
            '1': `<?php
// Buggy PHP Code - Sum of Two Numbers
// BUG: Using wrong operator
$input = trim(fgets(STDIN));
list($a, $b) = explode(' ', $input);
$result = $a - $b;  // Should be $a + $b
echo $result . "\\n";
?>`,
            '2': `<?php
// Buggy PHP Code - Reverse a String
// BUG: Not reversing the string
$s = trim(fgets(STDIN));
$result = $s;  // Should be strrev($s)
echo $result . "\\n";
?>`,
            '3': `<?php
// Buggy PHP Code - Find Maximum
// BUG: Using min instead of max
$n = intval(trim(fgets(STDIN)));
$arr = array_map('intval', explode(' ', trim(fgets(STDIN))));
$result = min($arr);  // Should be max($arr)
echo $result . "\\n";
?>`
        },
        swift: {
            '1': `// Buggy Swift Code - Sum of Two Numbers
// BUG: Using division instead of addition
let input = readLine()!
let numbers = input.split(separator: " ").map { Int($0)! }
let result = numbers[0] / numbers[1]  // Should be numbers[0] + numbers[1]
print(result)`,
            '2': `// Buggy Swift Code - Reverse a String
// BUG: Not reversing the string
let s = readLine()!
let result = s  // Should be String(s.reversed())
print(result)`,
            '3': `// Buggy Swift Code - Find Maximum
// BUG: Using min instead of max
let n = Int(readLine()!)!
let arr = readLine()!.split(separator: " ").map { Int($0)! }
let result = arr.min()!  // Should be arr.max()!
print(result)`
        },
        kotlin: {
            '1': `// Buggy Kotlin Code - Sum of Two Numbers
// BUG: Using subtraction instead of addition
fun main() {
    val (a, b) = readLine()!!.split(" ").map { it.toInt() }
    val result = a - b  // Should be a + b
    println(result)
}`,
            '2': `// Buggy Kotlin Code - Reverse a String
// BUG: Not reversing the string
fun main() {
    val s = readLine()!!
    val result = s  // Should be s.reversed()
    println(result)
}`,
            '3': `// Buggy Kotlin Code - Find Maximum
// BUG: Using minOrNull instead of maxOrNull
fun main() {
    val n = readLine()!!.toInt()
    val arr = readLine()!!.split(" ").map { it.toInt() }
    val result = arr.minOrNull()  // Should be maxOrNull()
    println(result)
}`
        }
    };

    // Return buggy code for the specific round and language
    return buggyCodeMap[language]?.[round] || `// Buggy code not available for this language`;
}

function getLanguageName(languageCode) {
    const names = {
        python: 'Python 3',
        javascript: 'JavaScript (Node.js)',
        java: 'Java',
        cpp: 'C++',
        c: 'C',
        csharp: 'C#',
        ruby: 'Ruby',
        go: 'Go',
        rust: 'Rust',
        php: 'PHP',
        swift: 'Swift',
        kotlin: 'Kotlin'
    };
    return names[languageCode] || languageCode;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// CODE TEMPLATES
// ===================================
function loadCodeTemplate() {
    //const codeEditor = document.getElementById('codeEditor');

    const templates = {
        python: {
            '1': `# Python Solution - Sum of Two Numbers
# Read input
a, b = map(int, input().split())

# Calculate sum
result = a + b

# Print output
print(result)`,
            '2': `# Python Solution - Reverse a String
# Read input
s = input()

# Reverse the string
result = s[::-1]

# Print output
print(result)`,
            '3': `# Python Solution - Find Maximum in Array
# Read input
n = int(input())
arr = list(map(int, input().split()))

# Find maximum
result = max(arr)

# Print output
print(result)`
        },
        javascript: {
            '1': `// JavaScript Solution - Sum of Two Numbers
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const [a, b] = line.split(' ').map(Number);
    const result = a + b;
    console.log(result);
    rl.close();
});`,
            '2': `// JavaScript Solution - Reverse a String
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const result = line.split('').reverse().join('');
    console.log(result);
    rl.close();
});`,
            '3': `// JavaScript Solution - Find Maximum in Array
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let n, arr;
let lineCount = 0;

rl.on('line', (line) => {
    if (lineCount === 0) {
        n = parseInt(line);
    } else {
        arr = line.split(' ').map(Number);
        const result = Math.max(...arr);
        console.log(result);
        rl.close();
    }
    lineCount++;
});`
        },
        java: {
            '1': `// Java Solution - Sum of Two Numbers
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int result = a + b;
        System.out.println(result);
        sc.close();
    }
}`,
            '2': `// Java Solution - Reverse a String
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        String result = new StringBuilder(s).reverse().toString();
        System.out.println(result);
        sc.close();
    }
}`,
            '3': `// Java Solution - Find Maximum in Array
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int num = sc.nextInt();
            max = Math.max(max, num);
        }
        System.out.println(max);
        sc.close();
    }
}`
        },
        cpp: {
            '1': `// C++ Solution - Sum of Two Numbers
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    int result = a + b;
    cout << result << endl;
    return 0;
}`,
            '2': `// C++ Solution - Reverse a String
#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    string s;
    cin >> s;
    reverse(s.begin(), s.end());
    cout << s << endl;
    return 0;
}`,
            '3': `// C++ Solution - Find Maximum in Array
#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    int arr[n];
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    int result = *max_element(arr, arr + n);
    cout << result << endl;
    return 0;
}`
        },
        c: {
            '1': `// C Solution - Sum of Two Numbers
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    int result = a + b;
    printf("%d\\n", result);
    return 0;
}`,
            '2': `// C Solution - Reverse a String
#include <stdio.h>
#include <string.h>

int main() {
    char s[1001];
    scanf("%s", s);
    int len = strlen(s);
    for (int i = len - 1; i >= 0; i--) {
        printf("%c", s[i]);
    }
    printf("\\n");
    return 0;
}`,
            '3': `// C Solution - Find Maximum in Array
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int arr[n];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) max = arr[i];
    }
    printf("%d\\n", max);
    return 0;
}`
        },
        csharp: {
            '1': `// C# Solution - Sum of Two Numbers
using System;

class Program {
    static void Main() {
        string[] input = Console.ReadLine().Split();
        int a = int.Parse(input[0]);
        int b = int.Parse(input[1]);
        int result = a + b;
        Console.WriteLine(result);
    }
}`,
            '2': `// C# Solution - Reverse a String
using System;

class Program {
    static void Main() {
        string s = Console.ReadLine();
        char[] arr = s.ToCharArray();
        Array.Reverse(arr);
        Console.WriteLine(new string(arr));
    }
}`,
            '3': `// C# Solution - Find Maximum in Array
using System;
using System.Linq;

class Program {
    static void Main() {
        int n = int.Parse(Console.ReadLine());
        int[] arr = Console.ReadLine().Split().Select(int.Parse).ToArray();
        int result = arr.Max();
        Console.WriteLine(result);
    }
}`
        },
        ruby: {
            '1': `# Ruby Solution - Sum of Two Numbers
a, b = gets.split.map(&:to_i)
result = a + b
puts result`,
            '2': `# Ruby Solution - Reverse a String
s = gets.chomp
result = s.reverse
puts result`,
            '3': `# Ruby Solution - Find Maximum in Array
n = gets.to_i
arr = gets.split.map(&:to_i)
result = arr.max
puts result`
        },
        go: {
            '1': `// Go Solution - Sum of Two Numbers
package main
import "fmt"

func main() {
    var a, b int
    fmt.Scan(&a, &b)
    result := a + b
    fmt.Println(result)
}`,
            '2': `// Go Solution - Reverse a String
package main
import (
    "fmt"
    "bufio"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Scan()
    s := scanner.Text()
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    fmt.Println(string(runes))
}`,
            '3': `// Go Solution - Find Maximum in Array
package main
import "fmt"

func main() {
    var n int
    fmt.Scan(&n)
    arr := make([]int, n)
    for i := 0; i < n; i++ {
        fmt.Scan(&arr[i])
    }
    max := arr[0]
    for _, num := range arr {
        if num > max {
            max = num
        }
    }
    fmt.Println(max)
}`
        },
        rust: {
            '1': `// Rust Solution - Sum of Two Numbers
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i32> = input.trim().split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();
    let result = nums[0] + nums[1];
    println!("{}", result);
}`,
            '2': `// Rust Solution - Reverse a String
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let result: String = input.trim().chars().rev().collect();
    println!("{}", result);
}`,
            '3': `// Rust Solution - Find Maximum in Array
use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let n: usize = input.trim().parse().unwrap();
    
    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let arr: Vec<i32> = input.trim().split_whitespace()
        .map(|s| s.parse().unwrap())
        .collect();
    
    let result = arr.iter().max().unwrap();
    println!("{}", result);
}`
        },
        php: {
            '1': `<?php
// PHP Solution - Sum of Two Numbers
$input = trim(fgets(STDIN));
list($a, $b) = explode(' ', $input);
$result = $a + $b;
echo $result . "\\n";
?>`,
            '2': `<?php
// PHP Solution - Reverse a String
$s = trim(fgets(STDIN));
$result = strrev($s);
echo $result . "\\n";
?>`,
            '3': `<?php
// PHP Solution - Find Maximum in Array
$n = intval(trim(fgets(STDIN)));
$arr = array_map('intval', explode(' ', trim(fgets(STDIN))));
$result = max($arr);
echo $result . "\\n";
?>`
        },
        swift: {
            '1': `// Swift Solution - Sum of Two Numbers
let input = readLine()!.split(separator: " ")
let a = Int(input[0])!
let b = Int(input[1])!
let result = a + b
print(result)`,
            '2': `// Swift Solution - Reverse a String
let s = readLine()!
let result = String(s.reversed())
print(result)`,
            '3': `// Swift Solution - Find Maximum in Array
let n = Int(readLine()!)!
let arr = readLine()!.split(separator: " ").map { Int($0)! }
let result = arr.max()!
print(result)`
        },
        kotlin: {
            '1': `// Kotlin Solution - Sum of Two Numbers
fun main() {
    val (a, b) = readLine()!!.split(" ").map { it.toInt() }
    val result = a + b
    println(result)
}`,
            '2': `// Kotlin Solution - Reverse a String
fun main() {
    val s = readLine()!!
    val result = s.reversed()
    println(result)
}`,
            '3': `// Kotlin Solution - Find Maximum in Array
fun main() {
    val n = readLine()!!.toInt()
    val arr = readLine()!!.split(" ").map { it.toInt() }
    val result = arr.maxOrNull()
    println(result)
}`
        }
    };

    const template = templates[currentLanguage]?.[currentRound] || '// Start coding here...';
    initialCode = template;
    // codeEditor.value = template;

    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });

    require(['vs/editor/editor.main'], function () {
        // Dispose existing editor if any
        if (monacoEditor) {
            monacoEditor.dispose();
        }

        createMonacoEditor(currentLanguage, template);
    });
}
// ===================================
// TERMINAL HELPERS
// ===================================
function writeToTerminal(text) {
    if (term) term.write(text);
}

function clearOutput() {
    if (term) term.clear();
}

// ===================================
// CODE EXECUTION
// ===================================


// ===================================
// CODE EXECUTION
// ===================================
// function runCode() {
//       if (!monacoEditor) {
//         alert('Editor not initialized!');
//         return;
//     }

//     const code = monacoEditor.getValue().trim();
//     //const code = document.getElementById('codeEditor').value.trim();
//     const outputPanel = document.getElementById('outputPanel');
//     const codeOutput = document.getElementById('codeOutput');

//     if (!code) {
//         alert('Please write some code first!');
//         return;
//     }

//     // Show output panel
//     outputPanel.style.display = 'block';
//     codeOutput.textContent = 'Compiling and running code...\n';

//     // Simulate code execution
//     setTimeout(() => {
//         const outputs = {
//             '1': '15\n\nExecution successful!\nTime: 0.023s\nMemory: 2.1 MB',
//             '2': 'olleh\n\nExecution successful!\nTime: 0.018s\nMemory: 1.8 MB',
//             '3': '9\n\nExecution successful!\nTime: 0.031s\nMemory: 3.2 MB'
//         };

//         codeOutput.textContent = outputs[currentRound] || 'Code executed successfully!';
//     }, 1000);
// }
function runCode() {
    if (!monacoEditor) {
        alert("Editor not initialized!");
        return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        writeToTerminal("❌ Server not connected\n");
        return;
    }

    const code = monacoEditor.getValue().trim();
    if (!code) {
        alert("Please write some code first!");
        return;
    }

    clearOutput();
    term.reset();

    isProgramRunning = true;
    inputBuffer = "";

    socket.send(JSON.stringify({
        type: "run",
        language: currentLanguage,
        code: code
    }));

    term.focus();
}


function submitSolution() {
    // const code = document.getElementById('codeEditor').value.trim();
    if (!monacoEditor) {
        alert('Editor not initialized!');
        return;
    }

    const code = monacoEditor.getValue().trim();
    if (!code) {
        alert('Please write some code before submitting!');
        return;
    }

    if (confirm('Are you sure you want to submit your solution? This will be your final submission for this problem.')) {
        // Show loading
        const submitBtn = event.target.closest('button');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i><span>Submitting...</span>';
        submitBtn.disabled = true;
        lucide.createIcons();

        // Simulate submission
        setTimeout(() => {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            lucide.createIcons();

            // Show success modal
            showSubmissionResult();
        }, 2000);
    }
}

function showSubmissionResult() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h2>Submission Result</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--accent-green), var(--accent-teal)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                    <i data-lucide="check" style="width: 40px; height: 40px; color: white;"></i>
                </div>
                <h3 style="color: var(--accent-green); margin-bottom: 1rem;">All Test Cases Passed! ✓</h3>
                <div class="submission-stats">
                    <div class="stat-row">
                        <span>Test Cases:</span>
                        <strong style="color: var(--accent-green);">5/5 Passed</strong>
                    </div>
                    <div class="stat-row">
                        <span>Execution Time:</span>
                        <strong>0.234s</strong>
                    </div>
                    <div class="stat-row">
                        <span>Memory Used:</span>
                        <strong>12.5 MB</strong>
                    </div>
                    <div class="stat-row">
                        <span>Score:</span>
                        <strong style="color: var(--primary-color);">+100 points</strong>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="window.location.href='index.html#contests'" style="margin-top: 1.5rem;">
                    <i data-lucide="arrow-left"></i>
                    <span>Back to Contests</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    lucide.createIcons();
}

function resetCode() {
    if (!monacoEditor) {
        alert('Editor not initialized!');
        return;
    }

    if (confirm('Are you sure you want to reset your code? This will load the default template.')) {
        monacoEditor.setValue(initialCode);
    }
}

function clearOutput() {
    if (term) {
        term.reset();   // clears terminal properly
    }
}


// ===================================
// UTILITY FUNCTIONS
// ===================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);
    lucide.createIcons();

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: var(--shadow-lg);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 3000;
        max-width: 400px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification i {
        width: 24px;
        height: 24px;
    }
    
    .notification-success {
        border-left: 4px solid var(--accent-green);
    }
    
    .notification-success i {
        color: var(--accent-green);
    }
    
    .notification-error {
        border-left: 4px solid var(--accent-red);
    }
    
    .notification-error i {
        color: var(--accent-red);
    }
    
    .notification-info {
        border-left: 4px solid var(--primary-color);
    }
    
    .notification-info i {
        color: var(--primary-color);
    }
    
    .submission-stats {
        background: var(--bg-primary);
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .stat-row:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);
function clearTerminal() {
    if (term) {
        term.clear();
        term.write('\x1b[hTerminal cleared.\x1b[0m\r\n\r\n');
        inputBuffer = "";
    }
}
function toggleTerminalFullscreen() {
    const terminalSection = document.querySelector('.terminal-section');
    const fullscreenBtn = document.getElementById('fullscreenTerminal');

    if (!terminalSection || !fullscreenBtn) {
        console.warn('Fullscreen elements not found');
        return;
    }

    const icon = fullscreenBtn.querySelector('[data-lucide]');

    if (!icon) {
        console.warn('Fullscreen icon not found');
        return;
    }

    if (!isTerminalFullscreen) {
        // Enter fullscreen
        terminalSection.classList.add('fullscreen');
        icon.setAttribute('data-lucide', 'minimize-2');
        isTerminalFullscreen = true;
        setTimeout(() => {
            if (term) term.focus();
        }, 100);
    } else {
        // Exit fullscreen
        terminalSection.classList.remove('fullscreen');
        icon.setAttribute('data-lucide', 'maximize-2');
        isTerminalFullscreen = false;
    }

    // Only create icons if lucide is available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }

    if (term) {
        term.resize(term.cols, term.rows);
    }
}
function updateUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('loginBtn');

    if (!loginBtn && !document.getElementById('userDropdown')) return;

    if (user) {
        if (document.getElementById('userDropdown')) return;

        loginBtn.outerHTML = `
            <div class="user-dropdown" id="userDropdown">
                <button class="user-dropdown-btn" id="userDropdownBtn">
                    <i data-lucide="user"></i>
                    <span>${user.name}</span>
                    <i data-lucide="chevron-down"></i>
                </button>
                <div class="user-dropdown-menu">
                    <button class="dropdown-menu-item" onclick="AppState.viewProfile()">
                                    <i data-lucide="user"></i>
                                    <span>Profile</span>
                                </button>
                    <button class="dropdown-menu-item logout" id="logoutBtn">
                        <i data-lucide="log-out"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        `;

        lucide.createIcons();

        const userDropdown = document.getElementById('userDropdown');
        const userDropdownBtn = document.getElementById('userDropdownBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        userDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '/#home';
        });

    } else {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.outerHTML = `
                <button class="btn btn-primary" id="loginBtn">
                    <i data-lucide="log-in"></i>
                    <span>Login</span>
                </button>
            `;
            lucide.createIcons();
        }
    }
}
