
// ======================================
// STUDYFLOW - MAIN APPLICATION
// ======================================

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("studyflowTasks")) || [];
let currentFilter = "all";

// ======================================
// SAVE TASKS
// ======================================

function saveTasks() {
    localStorage.setItem("studyflowTasks", JSON.stringify(tasks));
}

// ======================================
// DASHBOARD STATISTICS
// ======================================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.done).length;
    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("progressPercent").textContent =
        percentage + "%";

    document.getElementById("progressFill").style.width =
        percentage + "%";

    let message = "Start completing your tasks!";

    if (percentage === 100 && total > 0) {
        message = "Amazing! All tasks completed!";
    } else if (percentage >= 50) {
        message = "Great progress! Keep going!";
    } else if (percentage > 0) {
        message = "Good start! Keep working!";
    }

    document.getElementById("progressMessage").textContent = message;
}

// ======================================
// DISPLAY TASKS
// ======================================

function renderTasks() {
    taskList.replaceChildren();

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "pending") return !task.done;
        if (currentFilter === "completed") return task.done;
        return true;
    });

    if (filteredTasks.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No tasks found!";
        taskList.appendChild(message);
    }

    filteredTasks.forEach(task => {
        const card = document.createElement("div");
        card.className = task.done ? "task done" : "task";

        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("strong");
        title.textContent = task.name;

        const details = document.createElement("small");

        details.textContent =
            "Priority: " + task.priority +
            (task.dueDate ? " | Due: " + task.dueDate : "");

        details.classList.add(
            "priority-" + task.priority.toLowerCase()
        );

        const deadline = document.createElement("small");
        deadline.className = "deadline-status";

        if (task.dueDate) {
            const [year, month, day] =
                task.dueDate.split("-").map(Number);

            const due = new Date(year, month - 1, day);
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            const difference = Math.round(
                (due.getTime() - today.getTime()) / 86400000
            );

            if (difference < 0) {
                deadline.textContent = "⚠ Overdue";
                deadline.classList.add("overdue");
            } else if (difference === 0) {
                deadline.textContent = "⚠ Due today";
                deadline.classList.add("due-today");
            } else if (difference === 1) {
                deadline.textContent = "⏰ Due tomorrow";
                deadline.classList.add("upcoming");
            } else {
                deadline.textContent =
                    "✓ Due in " + difference + " days";
                deadline.classList.add("upcoming");
            }
        }

        info.append(title, details, deadline);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");
        completeButton.textContent = task.done ? "Undo" : "Complete";
        completeButton.dataset.action = "toggle";
        completeButton.dataset.id = task.id;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = task.id;

        actions.append(completeButton, deleteButton);
        card.append(info, actions);

        taskList.appendChild(card);
    });

    updateStats();
    renderCalendar();
}

// ======================================
// ADD TASKS
// ======================================

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = taskInput.value.trim();

    if (!name) return;

    const newTask = {
        id: Date.now(),
        name: name,
        priority: priorityInput.value,
        dueDate: dueDateInput.value,
        done: false
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();
    taskForm.reset();
});

// ======================================
// COMPLETE AND DELETE TASKS
// ======================================

taskList.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "toggle") {
        tasks = tasks.map(task =>
            task.id === id
                ? { ...task, done: !task.done }
                : task
        );
    }

    if (button.dataset.action === "delete") {
        tasks = tasks.filter(task => task.id !== id);
    }

    saveTasks();
    renderTasks();
});

// ======================================
// TASK FILTERS
// ======================================

document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", function() {
        currentFilter = this.dataset.filter;

        document.querySelectorAll(".filter").forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");
        renderTasks();
    });
});

// ======================================
// DARK AND LIGHT MODE
// ======================================

const themeToggle = document.getElementById("themeToggle");
const settingsThemeToggle =
    document.getElementById("settingsThemeToggle");

let darkMode =
    localStorage.getItem("studyflowTheme") === "dark";

function applyTheme() {
    document.body.classList.toggle("dark-mode", darkMode);

    themeToggle.textContent = darkMode
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

    settingsThemeToggle.textContent = darkMode
        ? "☀️ Switch to Light Mode"
        : "🌙 Switch to Dark Mode";
}

function changeTheme() {
    darkMode = !darkMode;

    localStorage.setItem(
        "studyflowTheme",
        darkMode ? "dark" : "light"
    );

    applyTheme();
}

themeToggle.addEventListener("click", changeTheme);
settingsThemeToggle.addEventListener("click", changeTheme);

applyTheme();

// ======================================
// SIDEBAR NAVIGATION
// ======================================

const navLinks = document.querySelectorAll(".nav-link");
const pageSections = document.querySelectorAll(".page-section");

function showSection(sectionId) {
    pageSections.forEach(section => {
        section.hidden = section.id !== sectionId;
    });

    navLinks.forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.section === sectionId
        );
    });

    if (sectionId === "calendar") {
        renderCalendar();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        showSection(this.dataset.section);
        history.replaceState(null, "", "#" + this.dataset.section);
    });
});

// Open the selected section from the URL, or Dashboard by default
const startingSection = location.hash.substring(1);

const validSections = [
    "dashboard",
    "tasks",
    "calendar",
    "pomodoro",
    "settings"
];

showSection(
    validSections.includes(startingSection)
        ? startingSection
        : "dashboard"
);

// ======================================
// CALENDAR AND DEADLINES
// ======================================

function renderCalendar() {
    const calendarTasks = document.getElementById("calendarTasks");

    calendarTasks.replaceChildren();

    const datedTasks = tasks
        .filter(task => task.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (datedTasks.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No deadlines added yet. Add a due date to a task!";
        calendarTasks.appendChild(message);
        return;
    }

    datedTasks.forEach(task => {
        const item = document.createElement("div");
        item.className = "task";

        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("strong");
        title.textContent = task.name;

        const date = document.createElement("small");
        date.textContent = "Deadline: " + task.dueDate;

        const status = document.createElement("small");
        status.textContent = task.done ? "✓ Completed" : "Pending";

        info.append(title, date, status);
        item.appendChild(info);
        calendarTasks.appendChild(item);
    });
}

// ======================================
// POMODORO TIMER
// ======================================

let timeLeft = 25 * 60;
let timerInterval = null;

const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");

const startTimer = document.getElementById("startTimer");
const pauseTimer = document.getElementById("pauseTimer");
const resetTimer = document.getElementById("resetTimer");

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

startTimer.addEventListener("click", function() {
    if (timerInterval !== null || timeLeft === 0) return;

    timerStatus.textContent = "Focus time! Keep going!";

    timerInterval = setInterval(function() {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;

            timerStatus.textContent =
                "Amazing! Your study session is complete!";
        }
    }, 1000);
});

pauseTimer.addEventListener("click", function() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerStatus.textContent = "Timer paused.";
    }
});

resetTimer.addEventListener("click", function() {
    clearInterval(timerInterval);
    timerInterval = null;

    timeLeft = 25 * 60;

    updateTimerDisplay();
    timerStatus.textContent = "Ready to focus?";
});

updateTimerDisplay();

// ======================================
// START APPLICATION
// ======================================

renderTasks();

console.log("StudyFlow loaded successfully!");

// ======================================
// STUDYFLOW DEMO LOGIN SYSTEM
// ======================================

const authScreen = document.getElementById("authScreen");
const appLayout = document.getElementById("appLayout");

const authForm = document.getElementById("authForm");
const authName = document.getElementById("authName");
const nameLabel = document.getElementById("nameLabel");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const signInTab = document.getElementById("signInTab");
const signUpTab = document.getElementById("signUpTab");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const logoutButton = document.getElementById("logoutButton");

let authMode = "signin";

// Show login or dashboard
function showLoginScreen() {
    authScreen.hidden = false;
    appLayout.hidden = true;
}

function showDashboard() {
    authScreen.hidden = true;
    appLayout.hidden = false;
}

// Switch between Sign In and Sign Up
function setAuthMode(mode) {
    authMode = mode;

    const isSignUp = mode === "signup";

    authName.hidden = !isSignUp;
    nameLabel.hidden = !isSignUp;

    authName.required = isSignUp;

    authPassword.autocomplete = isSignUp
        ? "new-password"
        : "current-password";

    signInTab.classList.toggle("active", !isSignUp);
    signUpTab.classList.toggle("active", isSignUp);

    authSubmit.textContent = isSignUp
        ? "Create Demo Account"
        : "Sign In";

    authMessage.textContent = isSignUp
        ? "Create a demo profile to enter StudyFlow."
        : "Welcome back! Please sign in to continue.";
}

signInTab.addEventListener("click", function() {
    setAuthMode("signin");
});

signUpTab.addEventListener("click", function() {
    setAuthMode("signup");
});

// Demo account submission
authForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (authMode === "signup") {
        const name = authName.value.trim();

        if (!name) {
            authMessage.textContent = "Please enter your name.";
            return;
        }

        localStorage.setItem("studyflowDemoUser", JSON.stringify({
            name: name,
            email: email
        }));

        authMessage.textContent = "Demo profile created! Welcome, " + name + ".";

    } else {
        const savedUser = localStorage.getItem("studyflowDemoUser");

        if (savedUser) {
            const user = JSON.parse(savedUser);

            if (user.email !== email) {
                authMessage.textContent =
                    "No demo profile found for this email. Please sign up first.";
                return;
            }
        } else {
            localStorage.setItem("studyflowDemoUser", JSON.stringify({
                name: "Student",
                email: email
            }));
        }

        authMessage.textContent = "Welcome to StudyFlow!";
    }

    localStorage.setItem("studyflowLoggedIn", "true");

    showDashboard();
    authForm.reset();
});

// Logout
logoutButton.addEventListener("click", function() {
    localStorage.removeItem("studyflowLoggedIn");
    showLoginScreen();
    setAuthMode("signin");
});

// Keep login state when refreshing the page
if (localStorage.getItem("studyflowLoggedIn") === "true") {
    showDashboard();
} else {
    showLoginScreen();
}

setAuthMode("signin");
