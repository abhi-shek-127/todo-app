// ============================================================
// DOM Element Selection
// ============================================================
var taskInput = document.getElementById("taskInput");
var addBtn    = document.getElementById("addBtn");
var taskList  = document.getElementById("taskList");
var emptyMsg  = document.getElementById("emptyMsg");

// ============================================================
// Helper: update the "No tasks available." message visibility
// ============================================================
function updateEmptyMessage() {
    if (taskList.children.length === 0) {
        emptyMsg.style.display = "block";
    } else {
        emptyMsg.style.display = "none";
    }
}

// ============================================================
// Add Task — Event Listener on "Add Task" button
// ============================================================
addBtn.addEventListener("click", function () {
    var taskText = taskInput.value.trim();

    if (taskText === "") {
        taskInput.focus();
        return;
    }

    // Dynamically create a new task item
    var li = document.createElement("li");
    li.className = "task-item";

    // Task text span
    var span = document.createElement("span");
    span.className   = "task-text";
    span.textContent = taskText;

    // Complete button
    var completeBtn = document.createElement("button");
    completeBtn.className   = "btn-complete";
    completeBtn.textContent = "Complete";

    // Complete button event listener
    completeBtn.addEventListener("click", function () {
        if (!li.classList.contains("completed")) {
            li.classList.add("completed");
            completeBtn.textContent = "Done";
        }
    });

    // Delete button
    var deleteBtn = document.createElement("button");
    deleteBtn.className   = "btn-delete";
    deleteBtn.textContent = "Delete";

    // Delete button event listener — removes task from the DOM
    deleteBtn.addEventListener("click", function () {
        taskList.removeChild(li);
        updateEmptyMessage();
    });

    // Add elements to the task item
    li.appendChild(span);
    li.appendChild(completeBtn);
    li.appendChild(deleteBtn);

    // Add the task item to the list
    taskList.appendChild(li);

    // Clear input and update empty message
    taskInput.value = "";
    updateEmptyMessage();
    taskInput.focus();
});

// Allow pressing Enter to add a task
taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        addBtn.click();
    }
});

// Initialise empty message on page load
updateEmptyMessage();
