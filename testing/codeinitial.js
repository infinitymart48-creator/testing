// ===================================
// Code Challenge Page - JavaScript
// ===================================

// ===============================
// REAL-TIME COMPILER CONNECTION
// ===============================
let ws = null;
let isProgramRunning = false;
let isRunning = false; // For terminal input handling

function initCompilerSocket() {
    if (ws) {
        ws.close();
    }

    // Connect to your compiler server
    ws = new WebSocket("ws://localhost:3000");
    
    ws.onopen = () => {
        console.log('Compiler connected');
    };

    ws.onmessage = (e) => {
        showOutput(e.data);
    };

    ws.onclose = () => {
        ws = null;
        isProgramRunning = false;
        isRunning = false;
        console.log('Compiler disconnected');
    };
}




let currentLanguage = null;
let currentRound = null;
let monacoEditor = null;
let initialCode = '';

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Get round number from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentRound = urlParams.get('round') || localStorage.getItem('currentRound') || '1';
    
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
    require(['vs/editor/editor.main'], function() {
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
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function() {
        runCode();
    });
    
    // Store initial code for reset functionality
    initialCode = code;
    
    return monacoEditor;
}
document.addEventListener("keydown", (e) => {
    if (!isRunning || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Send input to program
    if (e.key === "Enter") {
        ws.send(JSON.stringify({ type: "input", value: "\n" }));
        showOutput("\n"); // Echo newline in output
    } else if (e.key === "Backspace") {
        // Handle backspace
        ws.send(JSON.stringify({ type: "input", value: "\b" }));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Send printable characters
        ws.send(JSON.stringify({ type: "input", value: e.key }));
        showOutput(e.key); // Echo character in output
    }
});


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
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.setAttribute('data-lucide', savedTheme === 'dark' ? 'sun' : 'moon');
        lucide.createIcons();
        
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            icon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
            lucide.createIcons();
            updateMonacoTheme();
        });
    }
}

// ===================================
// MOBILE MENU
// ===================================
function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
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
    
    timeRemaining = roundTimes[currentRound]||900; // Default 15 minutes
    
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
                title: 'Rock Paper Scessor Game ',
                description: 'Create a Python program that allows a user to play Rock–Paper–Scissors against the computer, where the computer makes a random choice and the program determines the game outcome.',
                difficulty: 'Easy',
                timeLimit: '15',
                memoryLimit: '256 MB',
                inputFormat: 'Two space-separated integers a and b on a single line (1 ≤ a, b ≤ 1000)',
                inputExample: '5 10',
                outputFormat: 'Print a single integer - the sum of a and b',
                outputExample: '15',
                languageNote: 'In Python, use map(int, input().split()) to read two integers from a single line.',
                task: 'Fix the buggy code above by changing the subtraction operator to addition. The bug is in the calculation line.',
                buggyCode: getBuggyCode('1', 'python'),
                examples: [
                    { input: '5 10', output: '15', explanation: '5 + 10 = 15' },
                    { input: '100 200', output: '300', explanation: '100 + 200 = 300' },
                    { input: '1 1', output: '2', explanation: '1 + 1 = 2' }
                ]
            },
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
                title: 'Sum of Two Numbers (Java)',
                description: 'Write a Java program that reads two integers from standard input and prints their sum. Use Scanner class to read input and System.out.println() for output.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'Two space-separated integers a and b on a single line (1 ≤ a, b ≤ 1000)',
                inputExample: '5 10',
                outputFormat: 'Print a single integer - the sum of a and b',
                outputExample: '15',
                languageNote: 'In Java, use Scanner with System.in to read input. Use nextInt() to read integers.',
                task: 'Fix the buggy code by changing the division operator to addition. The Main class and main method are already set up.',
                buggyCode: getBuggyCode('1', 'java'),
                examples: [
                    { input: '5 10', output: '15', explanation: '5 + 10 = 15' },
                    { input: '100 200', output: '300', explanation: '100 + 200 = 300' },
                    { input: '1 1', output: '2', explanation: '1 + 1 = 2' }
                ]
            },
            cpp: {
                title: 'Sum of Two Numbers (C++)',
                description: 'Write a C++ program that reads two integers from standard input and prints their sum. Use cin for input and cout for output.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'Two space-separated integers a and b on a single line (1 ≤ a, b ≤ 1000)',
                inputExample: '5 10',
                outputFormat: 'Print a single integer - the sum of a and b',
                outputExample: '15',
                languageNote: 'In C++, use cin >> a >> b to read two integers. Use cout << result << endl to print output.',
                task: 'Fix the buggy code by changing the subtraction operator to addition in the result calculation.',
                buggyCode: getBuggyCode('1', 'cpp'),
                examples: [
                    { input: '5 10', output: '15', explanation: '5 + 10 = 15' },
                    { input: '100 200', output: '300', explanation: '100 + 200 = 300' },
                    { input: '1 1', output: '2', explanation: '1 + 1 = 2' }
                ]
            },
            c: {
                title: 'Sum of Two Numbers (C)',
                description: 'Write a C program that reads two integers from standard input and prints their sum. Use scanf for input and printf for output.',
                difficulty: 'Easy',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'Two space-separated integers a and b on a single line (1 ≤ a, b ≤ 1000)',
                inputExample: '5 10',
                outputFormat: 'Print a single integer - the sum of a and b',
                outputExample: '15',
                languageNote: 'In C, use scanf("%d %d", &a, &b) to read two integers. Use printf("%d\\n", result) to print output.',
                task: 'Fix the buggy code by changing the modulo operator to addition in the result calculation.',
                buggyCode: getBuggyCode('1', 'c'),
                examples: [
                    { input: '5 10', output: '15', explanation: '5 + 10 = 15' },
                    { input: '100 200', output: '300', explanation: '100 + 200 = 300' },
                    { input: '1 1', output: '2', explanation: '1 + 1 = 2' }
                ]
            },
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
                title: 'Reverse a String (Python)',
                description: 'Write a Python program that reads a string from standard input and prints it in reverse order. Use Python\'s string slicing feature for an elegant solution.',
                difficulty: 'Medium',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single string s (1 ≤ length ≤ 1000, no spaces)',
                inputExample: 'hello',
                outputFormat: 'Print the reversed string',
                outputExample: 'olleh',
                languageNote: 'In Python, you can reverse a string using slicing: s[::-1]. This is the most Pythonic way.',
                task: 'Fix the buggy code by adding the string reversal logic using Python slicing.',
                buggyCode: getBuggyCode('2', 'python'),
                examples: [
                    { input: 'hello', output: 'olleh', explanation: 'Reverse of "hello" is "olleh"' },
                    { input: 'CodeArena', output: 'anerAedoC', explanation: 'Reverse of "CodeArena" is "anerAedoC"' },
                    { input: 'python', output: 'nohtyp', explanation: 'Reverse of "python" is "nohtyp"' }
                ]
            },
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
                title: 'Reverse a String (Java)',
                description: 'Write a Java program that reads a string from standard input and prints it in reverse order. Use StringBuilder or manual character array reversal.',
                difficulty: 'Medium',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single string s (1 ≤ length ≤ 1000, no spaces)',
                inputExample: 'hello',
                outputFormat: 'Print the reversed string',
                outputExample: 'olleh',
                languageNote: 'In Java, use StringBuilder with reverse() method, or manually reverse using a loop with charAt().',
                task: 'Fix the buggy code by implementing string reversal. You can use StringBuilder.reverse() or a manual loop.',
                buggyCode: getBuggyCode('2', 'java'),
                examples: [
                    { input: 'hello', output: 'olleh', explanation: 'Reverse of "hello" is "olleh"' },
                    { input: 'CodeArena', output: 'anerAedoC', explanation: 'Reverse of "CodeArena" is "anerAedoC"' },
                    { input: 'java', output: 'avaj', explanation: 'Reverse of "java" is "avaj"' }
                ]
            },
            cpp: {
                title: 'Reverse a String (C++)',
                description: 'Write a C++ program that reads a string from standard input and prints it in reverse order. Use the algorithm library or manual reversal.',
                difficulty: 'Medium',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single string s (1 ≤ length ≤ 1000, no spaces)',
                inputExample: 'hello',
                outputFormat: 'Print the reversed string',
                outputExample: 'olleh',
                languageNote: 'In C++, use std::reverse(s.begin(), s.end()) from <algorithm> header, or manually reverse with a loop.',
                task: 'Fix the buggy code by adding the reverse logic using std::reverse or a manual loop.',
                buggyCode: getBuggyCode('2', 'cpp'),
                examples: [
                    { input: 'hello', output: 'olleh', explanation: 'Reverse of "hello" is "olleh"' },
                    { input: 'CodeArena', output: 'anerAedoC', explanation: 'Reverse of "CodeArena" is "anerAedoC"' },
                    { input: 'cpp', output: 'ppc', explanation: 'Reverse of "cpp" is "ppc"' }
                ]
            },
            c: {
                title: 'Reverse a String (C)',
                description: 'Write a C program that reads a string from standard input and prints it in reverse order. Use manual character swapping or print in reverse order.',
                difficulty: 'Medium',
                timeLimit: '1 second',
                memoryLimit: '256 MB',
                inputFormat: 'A single string s (1 ≤ length ≤ 1000, no spaces)',
                inputExample: 'hello',
                outputFormat: 'Print the reversed string',
                outputExample: 'olleh',
                languageNote: 'In C, use strlen() to get length, then print characters from end to start, or swap characters in place.',
                task: 'Fix the buggy code by implementing string reversal logic using a loop.',
                buggyCode: getBuggyCode('2', 'c'),
                examples: [
                    { input: 'hello', output: 'olleh', explanation: 'Reverse of "hello" is "olleh"' },
                    { input: 'CodeArena', output: 'anerAedoC', explanation: 'Reverse of "CodeArena" is "anerAedoC"' },
                    { input: 'clang', output: 'gnalc', explanation: 'Reverse of "clang" is "gnalc"' }
                ]
            },
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
                title: 'Find Maximum in Array (Python)',
                description: 'Write a Python program that reads an array of integers and finds the maximum element. Use Python\'s built-in max() function or implement manually.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'First line: n (size of array, 1 ≤ n ≤ 10^5). Second line: n space-separated integers (-10^9 ≤ each element ≤ 10^9)',
                inputExample: '5\\n3 7 2 9 1',
                outputFormat: 'Print the maximum element',
                outputExample: '9',
                languageNote: 'In Python, use max(arr) for the built-in solution, or iterate through the array to find maximum manually.',
                task: 'Fix the buggy code by changing min() to max(). The bug is using the wrong function.',
                buggyCode: getBuggyCode('3', 'python'),
                examples: [
                    { input: '5\\n3 7 2 9 1', output: '9', explanation: 'Maximum element is 9' },
                    { input: '4\\n-5 -2 -8 -1', output: '-1', explanation: 'Maximum element is -1 (all negative)' },
                    { input: '3\\n100 200 150', output: '200', explanation: 'Maximum element is 200' }
                ]
            },
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
                title: 'Find Maximum in Array (Java)',
                description: 'Write a Java program that reads an array of integers and finds the maximum element. Iterate through the array and track the maximum value.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'First line: n (size of array, 1 ≤ n ≤ 10^5). Second line: n space-separated integers (-10^9 ≤ each element ≤ 10^9)',
                inputExample: '5\\n3 7 2 9 1',
                outputFormat: 'Print the maximum element',
                outputExample: '9',
                languageNote: 'In Java, initialize max with first element, then iterate and compare each element with current max.',
                task: 'Fix the buggy code by changing the comparison operator from < to > in the if condition.',
                buggyCode: getBuggyCode('3', 'java'),
                examples: [
                    { input: '5\\n3 7 2 9 1', output: '9', explanation: 'Maximum element is 9' },
                    { input: '4\\n-5 -2 -8 -1', output: '-1', explanation: 'Maximum element is -1 (all negative)' },
                    { input: '3\\n100 200 150', output: '200', explanation: 'Maximum element is 200' }
                ]
            },
            cpp: {
                title: 'Find Maximum in Array (C++)',
                description: 'Write a C++ program that reads an array of integers and finds the maximum element. Use std::max_element or manual iteration.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'First line: n (size of array, 1 ≤ n ≤ 10^5). Second line: n space-separated integers (-10^9 ≤ each element ≤ 10^9)',
                inputExample: '5\\n3 7 2 9 1',
                outputFormat: 'Print the maximum element',
                outputExample: '9',
                languageNote: 'In C++, use std::max_element(arr, arr+n) from <algorithm>, or iterate manually to find maximum.',
                task: 'Fix the buggy code by changing min_element to max_element.',
                buggyCode: getBuggyCode('3', 'cpp'),
                examples: [
                    { input: '5\\n3 7 2 9 1', output: '9', explanation: 'Maximum element is 9' },
                    { input: '4\\n-5 -2 -8 -1', output: '-1', explanation: 'Maximum element is -1 (all negative)' },
                    { input: '3\\n100 200 150', output: '200', explanation: 'Maximum element is 200' }
                ]
            },
            c: {
                title: 'Find Maximum in Array (C)',
                description: 'Write a C program that reads an array of integers and finds the maximum element. Use a loop to iterate and track the maximum value.',
                difficulty: 'Hard',
                timeLimit: '2 seconds',
                memoryLimit: '512 MB',
                inputFormat: 'First line: n (size of array, 1 ≤ n ≤ 10^5). Second line: n space-separated integers (-10^9 ≤ each element ≤ 10^9)',
                inputExample: '5\\n3 7 2 9 1',
                outputFormat: 'Print the maximum element',
                outputExample: '9',
                languageNote: 'In C, initialize max with first array element, then loop through remaining elements comparing each with max.',
                task: 'Fix the buggy code by changing the comparison operator from < to > in the if statement.',
                buggyCode: getBuggyCode('3', 'c'),
                examples: [
                    { input: '5\\n3 7 2 9 1', output: '9', explanation: 'Maximum element is 9' },
                    { input: '4\\n-5 -2 -8 -1', output: '-1', explanation: 'Maximum element is -1 (all negative)' },
                    { input: '3\\n100 200 150', output: '200', explanation: 'Maximum element is 200' }
                ]
            },
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
function copyText(){
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
# BUG: Using wrong operator
a, b = map(int, input().split())
result = a - b  # Should be a + b
print(result)`,
            '2': `# Buggy Python Code - Reverse a String
# BUG: Not reversing the string
s = input()
result = s  # Should be s[::-1]
print(result)`,
            '3': `# Buggy Python Code - Find Maximum
# BUG: Finding minimum instead of maximum
n = int(input())
arr = list(map(int, input().split()))
result = min(arr)  # Should be max(arr)
print(result)`
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
            '1': `// Buggy Java Code - Sum of Two Numbers
// BUG: Using division instead of addition
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int result = a / b;  // Should be a + b
        System.out.println(result);
        sc.close();
    }
}`,
            '2': `// Buggy Java Code - Reverse a String
// BUG: Not reversing the string
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        String result = s;  // Should reverse the string
        System.out.println(result);
        sc.close();
    }
}`,
            '3': `// Buggy Java Code - Find Maximum
// BUG: Initializing max with first element but not comparing properly
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int num = sc.nextInt();
            if (num < max) {  // Should be num > max
                max = num;
            }
        }
        System.out.println(max);
        sc.close();
    }
}`
        },
        cpp: {
            '1': `// Buggy C++ Code - Sum of Two Numbers
// BUG: Using subtraction instead of addition
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    int result = a - b;  // Should be a + b
    cout << result << endl;
    return 0;
}`,
            '2': `// Buggy C++ Code - Reverse a String
// BUG: Not reversing the string
#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    // Missing reverse logic
    cout << s << endl;  // Should reverse s first
    return 0;
}`,
            '3': `// Buggy C++ Code - Find Maximum
// BUG: Finding minimum instead of maximum
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
    int result = *min_element(arr, arr + n);  // Should be max_element
    cout << result << endl;
    return 0;
}`
        },
        c: {
            '1': `// Buggy C Code - Sum of Two Numbers
// BUG: Using modulo instead of addition
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    int result = a % b;  // Should be a + b
    printf("%d\\n", result);
    return 0;
}`,
            '2': `// Buggy C Code - Reverse a String
// BUG: Not reversing, just printing as is
#include <stdio.h>
#include <string.h>

int main() {
    char s[1001];
    scanf("%s", s);
    // Missing reverse logic
    printf("%s\\n", s);  // Should reverse first
    return 0;
}`,
            '3': `// Buggy C Code - Find Maximum
// BUG: Comparing with wrong operator
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
        if (arr[i] < max) {  // Should be arr[i] > max
            max = arr[i];
        }
    }
    printf("%d\\n", max);
    return 0;
}`
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

     require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
    
    require(['vs/editor/editor.main'], function() {
        // Dispose existing editor if any
        if (monacoEditor) {
            monacoEditor.dispose();
        }
        
        createMonacoEditor(currentLanguage, template);
    });
}

// ===================================
// CODE EXECUTION - UPDATED FOR COMPILER
// ===================================
function runCode() {
    if (!currentLanguage || !monacoEditor) {
        alert("Please select a language first.");
        return;
    }

    // Check if language is supported by compiler
    const supportedLanguages = ['python', 'java', 'cpp', 'c'];
    if (!supportedLanguages.includes(currentLanguage)) {
        alert(`Language ${currentLanguage} is not supported in this compiler. Please use Python, Java, C++, or C.`);
        return;
    }

    initCompilerSocket();
    
    // Wait for connection to establish
    setTimeout(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert("Compiler connection failed. Please try again.");
            return;
        }

        clearOutput();
        showOutput("⏳ Running program...\n");
        showOutput("=".repeat(50) + "\n");

        isProgramRunning = true;
        isRunning = true;

        // Send code to compiler
        ws.send(JSON.stringify({
            type: "run",
            language: currentLanguage,
            code: monacoEditor.getValue()
        }));
    }, 100);
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
    document.getElementById('outputPanel').style.display = 'none';
    document.getElementById('codeOutput').textContent = '';
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
function showOutput(text) {
    const panel = document.getElementById("outputPanel");
    const output = document.getElementById("codeOutput");
    
    panel.style.display = "block";
    output.textContent += text;
    output.scrollTop = output.scrollHeight;
}
function clearOutput() {
    const output = document.getElementById("codeOutput");
    output.textContent = "";
    document.getElementById("outputPanel").style.display = "none";
}
// ===================================
// HELPER FUNCTIONS
// ===================================
function showComingSoon() {
    showNotification('This language is coming soon! Currently available: Python, Java, C++, C', 'info');
}

function stopProgram() {
    if (ws && isProgramRunning) {
        ws.close();
        showOutput("\n\n🛑 Program stopped by user.");
        isProgramRunning = false;
        isRunning = false;
    }
}

// Update the Run button to show Stop when running
function toggleRunButton() {
    const runBtn = document.querySelector('.btn-secondary.btn-sm[onclick="runCode()"]');
    if (!runBtn) return;
    
    if (isProgramRunning) {
        runBtn.innerHTML = '<i data-lucide="square"></i><span>Stop</span>';
        runBtn.setAttribute('onclick', 'stopProgram()');
    } else {
        runBtn.innerHTML = '<i data-lucide="play"></i><span>Run</span>';
        runBtn.setAttribute('onclick', 'runCode()');
    }
    lucide.createIcons();
}

// Update showOutput to handle special cases
function showOutput(text) {
    const panel = document.getElementById("outputPanel");
    const output = document.getElementById("codeOutput");
    
    panel.style.display = "block";
    
    // Clean up output formatting
    let cleanedText = text;
    
    // Add proper line breaks for program finished message
    if (text.includes('[Program finished]')) {
        cleanedText = "\n" + "=".repeat(50) + "\n" + "✅ Program execution completed.\n" + "=".repeat(50);
        isProgramRunning = false;
        isRunning = false;
        toggleRunButton();
    }
    
    output.textContent += cleanedText;
    output.scrollTop = output.scrollHeight;
    
    // Update run/stop button
    toggleRunButton();
}


function clearTerminal() {
    if (term) {
        term.clear();
        term.write('\x1b[Terminal cleared.\x1b[0m\r\n\r\n');
        inputBuffer = "";
    }
}