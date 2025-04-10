// Global variables
let questLogs = []
let currentLogId = null
let currentQuestId = null
let templates = []
let saveTimeout = null

// API endpoints
const API = {
  SAVE_LOG: "/api/save",
  LOAD_LOGS: "/api/logs",
  LOAD_LOG: "/api/log/",
  DELETE_LOG: "/api/delete/",
  TEMPLATES: "/api/templates",
  IMPORT_TEMPLATE: "/api/import-template/",
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  init()
})

async function init() {
  // Set up event listeners
  setupEventListeners()

  // Load quest logs
  await loadQuestLogs()

  // Update date in footer
  updateDate()

  // Set up auto-save
  window.addEventListener("beforeunload", () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      if (currentLogId) {
        saveCurrentLog(true)
      }
    }
  })

  // Set up dropdown functionality
  setupDropdowns()
}

// Update header based on current view
function updateHeader() {
  const backButton = document.getElementById("back-to-main-btn")

  if (currentLogId) {
    backButton.classList.remove("hidden")
  } else {
    backButton.classList.add("hidden")
  }
}

// Event Listeners
function setupEventListeners() {
  // Main Menu
  document.getElementById("create-log-btn").addEventListener("click", showCreateLogDialog)
  document.getElementById("create-log-submit").addEventListener("click", createQuestLog)
  document.getElementById("create-log-cancel").addEventListener("click", hideCreateLogDialog)
  document.getElementById("create-log-close").addEventListener("click", hideCreateLogDialog)

  document.getElementById("import-log-btn").addEventListener("click", showImportLogDialog)
  document.getElementById("import-log-submit").addEventListener("click", importQuestLog)
  document.getElementById("import-log-cancel").addEventListener("click", hideImportLogDialog)
  document.getElementById("import-log-close").addEventListener("click", hideImportLogDialog)

  document.getElementById("browse-templates-btn").addEventListener("click", showTemplatesDialog)
  document.getElementById("templates-cancel").addEventListener("click", hideTemplatesDialog)
  document.getElementById("templates-close").addEventListener("click", hideTemplatesDialog)

  // Quest Log View
  document.getElementById("back-to-logs-btn").addEventListener("click", backToLogs)
  document.getElementById("add-quest-btn").addEventListener("click", showAddQuestForm)
  document.getElementById("delete-log-btn").addEventListener("click", deleteCurrentQuestLog)
  document.getElementById("export-log-btn").addEventListener("click", exportCurrentLog)

  // Add Quest Form
  document.getElementById("add-objective-btn").addEventListener("click", addObjectiveInput)
  document.getElementById("save-quest-btn").addEventListener("click", saveQuest)
  document.getElementById("cancel-quest-btn").addEventListener("click", hideAddQuestForm)

  // Edit Quest
  document.getElementById("edit-quest-btn").addEventListener("click", showEditQuestForm)
  document.getElementById("cancel-edit-btn").addEventListener("click", hideEditQuestForm)
  document.getElementById("save-edit-btn").addEventListener("click", saveEditedQuest)
  document.getElementById("edit-add-objective-btn").addEventListener("click", addEditObjectiveInput)

  // Back to Main Menu
  document.getElementById("back-to-main-btn").addEventListener("click", backToLogs)

  // Notification
  document.querySelectorAll(".notification-close").forEach((btn) => {
    btn.addEventListener("click", hideNotification)
  })

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!document.getElementById("add-quest-form").classList.contains("hidden")) {
        hideAddQuestForm()
      } else if (!document.getElementById("create-log-dialog").classList.contains("hidden")) {
        hideCreateLogDialog()
      } else if (!document.getElementById("import-log-dialog").classList.contains("hidden")) {
        hideImportLogDialog()
      } else if (!document.getElementById("templates-dialog").classList.contains("hidden")) {
        hideTemplatesDialog()
      } else if (currentLogId) {
        backToLogs()
      }
    }
  })
}

// Setup dropdowns
function setupDropdowns() {
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation()
      const dropdown = toggle.closest(".dropdown")
      const menu = dropdown.querySelector(".dropdown-menu")
      menu.style.display = menu.style.display === "block" ? "none" : "block"
    })
  })

  document.addEventListener("click", (e) => {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.style.display = "none"
    })
  })
}

// Date functions
function updateDate() {
  const now = new Date()
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  document.getElementById("current-date").textContent = now.toLocaleDateString(undefined, options)
}

// API Functions
async function loadQuestLogs() {
  try {
    const response = await fetch(API.LOAD_LOGS)
    if (!response.ok) throw new Error("Failed to load quest logs")

    const data = await response.json()
    questLogs = data.logs
    renderQuestLogs()
  } catch (error) {
    console.error("Error loading quest logs:", error)
    showNotification("Failed to load quest logs. Using local storage instead.", "error")

    // Fallback to localStorage
    const savedData = localStorage.getItem("questLogs")
    if (savedData) {
      questLogs = JSON.parse(savedData)
    }
    renderQuestLogs()
  }
}

async function loadQuestLog(logId) {
  try {
    const response = await fetch(API.LOAD_LOG + logId)
    if (!response.ok) throw new Error("Failed to load quest log")

    const data = await response.json()

    // Update the quest log in the questLogs array
    const index = questLogs.findIndex((log) => log.id === logId)
    if (index !== -1) {
      questLogs[index] = data.log
    } else {
      questLogs.push(data.log)
    }

    return data.log
  } catch (error) {
    console.error("Error loading quest log:", error)
    showNotification("Failed to load quest log", "error")

    // Fallback to finding in the existing array
    return questLogs.find((log) => log.id === logId)
  }
}

async function saveQuestLog(log) {
  updateSaveStatus("Saving...")

  try {
    const response = await fetch(API.SAVE_LOG, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ log }),
    })

    if (!response.ok) throw new Error("Failed to save quest log")

    updateSaveStatus("All changes saved")

    // Also update localStorage as backup
    localStorage.setItem("questLogs", JSON.stringify(questLogs))

    return true
  } catch (error) {
    console.error("Error saving quest log:", error)
    updateSaveStatus("Failed to save to server (using local backup)")

    // Fallback to localStorage
    localStorage.setItem("questLogs", JSON.stringify(questLogs))

    return false
  }
}

async function deleteQuestLog(logId) {
  try {
    const response = await fetch(API.DELETE_LOG + logId, {
      method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete quest log")

    // Remove from local array
    questLogs = questLogs.filter((log) => log.id !== logId)

    // Update localStorage
    localStorage.setItem("questLogs", JSON.stringify(questLogs))

    showNotification("Quest log deleted successfully", "success")
    return true
  } catch (error) {
    console.error("Error deleting quest log:", error)
    showNotification("Failed to delete quest log from server", "error")

    // Still remove from local array
    questLogs = questLogs.filter((log) => log.id !== logId)
    localStorage.setItem("questLogs", JSON.stringify(questLogs))

    return false
  }
}

async function loadTemplates() {
  try {
    const response = await fetch(API.TEMPLATES)
    if (!response.ok) throw new Error("Failed to load templates")

    const data = await response.json()
    templates = data.templates
    renderTemplates()
  } catch (error) {
    console.error("Error loading templates:", error)
    showNotification("Failed to load quest templates", "error")

    // Show error in templates list
    document.getElementById("templates-list").innerHTML = `
      <div class="empty-message">
        <p>Failed to load templates</p>
        <p>Please try again later</p>
      </div>
    `
  }
}

async function importTemplate(templateId) {
  try {
    const response = await fetch(API.IMPORT_TEMPLATE + templateId)
    if (!response.ok) throw new Error("Failed to import template")

    const data = await response.json()

    // Add to quest logs
    questLogs.push(data.log)

    // Save to localStorage
    localStorage.setItem("questLogs", JSON.stringify(questLogs))

    showNotification("Template imported successfully", "success")
    hideTemplatesDialog()
    openQuestLog(data.log.id)

    return true
  } catch (error) {
    console.error("Error importing template:", error)
    showNotification("Failed to import template", "error")
    return false
  }
}

// UI Functions
function renderQuestLogs() {
  const questLogsList = document.getElementById("quest-logs-list")

  if (questLogs.length === 0) {
    questLogsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <p>No quest logs found</p>
          <p>Create your first quest log to get started</p>
        </div>
      </div>
    `
    return
  }

  questLogsList.innerHTML = questLogs
    .map(
      (log) => `
    <div class="item-list-item" data-id="${log.id}">
      <div class="item-title">${log.name}</div>
      <div class="item-meta">
        <span class="item-badge">${log.quests.length} ${log.quests.length === 1 ? "quest" : "quests"}</span>
        <span>${formatDate(log.updated)}</span>
      </div>
    </div>
  `,
    )
    .join("")

  // Add click event listeners
  document.querySelectorAll(".item-list-item").forEach((item) => {
    item.addEventListener("click", () => {
      const logId = item.getAttribute("data-id")
      openQuestLog(logId)
    })
  })
}

function renderTemplates() {
  const templatesList = document.getElementById("templates-list")

  if (templates.length === 0) {
    templatesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-content">
          <p>No templates available</p>
        </div>
      </div>
    `
    return
  }

  templatesList.innerHTML = templates
    .map(
      (template) => `
    <div class="item-list-item">
      <div class="item-title">${template.name}</div>
      <div class="item-meta">
        <span>${template.description}</span>
      </div>
      <button class="btn primary import-template-btn" data-id="${template.id}">Import</button>
    </div>
  `,
    )
    .join("")

  // Add click event listeners
  document.querySelectorAll(".import-template-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const templateId = btn.getAttribute("data-id")
      importTemplate(templateId)
    })
  })
}

function renderQuests() {
  const questsList = document.getElementById("quests-list")
  const currentLog = questLogs.find((log) => log.id === currentLogId)

  if (!currentLog || currentLog.quests.length === 0) {
    questsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <p>No quests available</p>
          <p>Add a new quest to get started</p>
        </div>
      </div>
    `
    return
  }

  questsList.innerHTML = currentLog.quests
    .map((quest) => {
      const completedCount = quest.objectives.filter((obj) => obj.completed).length
      const totalCount = quest.objectives.length

      return `
      <div class="item-list-item ${quest.id === currentQuestId ? "active" : ""}" data-id="${quest.id}">
        <div class="item-title">${quest.title}</div>
        <div class="item-meta">
          <span class="item-badge">${completedCount}/${totalCount}</span>
          <span>${formatDate(quest.updated)}</span>
        </div>
      </div>
    `
    })
    .join("")

  // Add click event listeners
  document.querySelectorAll(".item-list-item").forEach((item) => {
    item.addEventListener("click", () => {
      const questId = item.getAttribute("data-id")
      selectQuest(questId)
    })
  })
}

function renderQuestDetails() {
  if (!currentLogId || !currentQuestId) return

  const currentLog = questLogs.find((log) => log.id === currentLogId)
  const currentQuest = currentLog.quests.find((quest) => quest.id === currentQuestId)

  if (!currentQuest) return

  document.getElementById("quest-title").textContent = currentQuest.title
  document.getElementById("quest-description").textContent = currentQuest.description || "No description provided."

  const objectivesList = document.getElementById("objectives-list")

  if (currentQuest.objectives.length === 0) {
    objectivesList.innerHTML = `
      <div class="empty-state">
        <p>No objectives for this quest</p>
      </div>
    `
  } else {
    objectivesList.innerHTML = currentQuest.objectives
      .map(
        (objective) => `
      <li class="objective-item ${objective.completed ? "objective-completed" : ""}" data-id="${objective.id}">
        <div class="objective-marker">◆</div>
        <div class="objective-text">
          <div class="objective-title">${objective.title}</div>
        </div>
      </li>
    `,
      )
      .join("")

    // Add click event listeners for objectives
    document.querySelectorAll(".objective-item").forEach((item) => {
      item.addEventListener("click", () => {
        const objectiveId = item.getAttribute("data-id")
        toggleObjectiveCompletion(objectiveId)
      })
    })
  }

  showQuestDetails()
}

// Dialog Functions
function showCreateLogDialog() {
  document.getElementById("create-log-dialog").classList.remove("hidden")
  document.getElementById("new-log-name").focus()
}

function hideCreateLogDialog() {
  document.getElementById("create-log-dialog").classList.add("hidden")
  document.getElementById("new-log-name").value = ""
}

function showImportLogDialog() {
  document.getElementById("import-log-dialog").classList.remove("hidden")
}

function hideImportLogDialog() {
  document.getElementById("import-log-dialog").classList.add("hidden")
  document.getElementById("import-file-input").value = ""
}

function showTemplatesDialog() {
  document.getElementById("templates-dialog").classList.remove("hidden")
  loadTemplates()
}

function hideTemplatesDialog() {
  document.getElementById("templates-dialog").classList.add("hidden")
}

// Quest Log Functions
async function createQuestLog() {
  const name = document.getElementById("new-log-name").value.trim()

  if (!name) {
    showNotification("Please enter a quest log name", "error")
    return
  }

  const newQuestLog = {
    id: Date.now().toString(),
    name,
    quests: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  questLogs.push(newQuestLog)
  await saveQuestLog(newQuestLog)

  hideCreateLogDialog()
  openQuestLog(newQuestLog.id)
}

async function openQuestLog(logId) {
  // If we have a current log, save it first
  if (currentLogId) {
    await saveCurrentLog(true)
  }

  currentLogId = logId
  currentQuestId = null

  // Load the full log data
  const currentLog = await loadQuestLog(logId)
  document.getElementById("current-log-name").textContent = currentLog.name

  document.getElementById("quest-log-selector").classList.add("hidden")
  document.getElementById("quest-log-view").classList.remove("hidden")

  // Update header
  updateHeader()

  renderQuests()
  showEmptyState()
}

async function backToLogs() {
  // Save current log before navigating away
  if (currentLogId) {
    await saveCurrentLog(true)
  }

  currentLogId = null
  currentQuestId = null

  document.getElementById("quest-log-view").classList.add("hidden")
  document.getElementById("quest-log-selector").classList.remove("hidden")

  // Update header
  updateHeader()

  // Refresh the logs list
  await loadQuestLogs()
}

async function deleteCurrentQuestLog() {
  if (!currentLogId) return

  if (confirm("Are you sure you want to delete this quest log?")) {
    await deleteQuestLog(currentLogId)
    backToLogs()
  }
}

async function exportCurrentLog() {
  if (!currentLogId) return

  const currentLog = questLogs.find((log) => log.id === currentLogId)
  if (!currentLog) return

  // Create a JSON file
  const dataStr = JSON.stringify(currentLog, null, 2)
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

  // Create a download link
  const exportFileDefaultName = `${currentLog.name.replace(/\s+/g, "_")}.quest`

  const linkElement = document.createElement("a")
  linkElement.setAttribute("href", dataUri)
  linkElement.setAttribute("download", exportFileDefaultName)
  linkElement.click()

  showNotification("Quest log exported successfully", "success")
}

async function importQuestLog() {
  const fileInput = document.getElementById("import-file-input")
  const file = fileInput.files[0]

  if (!file) {
    showNotification("Please select a file to import", "error")
    return
  }

  try {
    const text = await file.text()
    const importedLog = JSON.parse(text)

    // Validate the imported log
    if (!importedLog.id || !importedLog.name || !Array.isArray(importedLog.quests)) {
      throw new Error("Invalid quest log file")
    }

    // Check if a log with this ID already exists
    const existingIndex = questLogs.findIndex((log) => log.id === importedLog.id)
    if (existingIndex !== -1) {
      // Generate a new ID to avoid conflicts
      importedLog.id = Date.now().toString()
      importedLog.name += " (Imported)"
    }

    // Add to quest logs
    questLogs.push(importedLog)
    await saveQuestLog(importedLog)

    hideImportLogDialog()
    showNotification("Quest log imported successfully", "success")
    openQuestLog(importedLog.id)
  } catch (error) {
    console.error("Error importing quest log:", error)
    showNotification("Failed to import quest log. Please make sure the file is valid.", "error")
  }
}

// Quest Functions
function selectQuest(questId) {
  currentQuestId = questId

  // Update selected state in list
  document.querySelectorAll(".item-list-item").forEach((item) => {
    if (item.getAttribute("data-id") === questId) {
      item.classList.add("active")
    } else {
      item.classList.remove("active")
    }
  })

  renderQuestDetails()
}

function toggleObjectiveCompletion(objectiveId) {
  const currentLog = questLogs.find((log) => log.id === currentLogId)
  const currentQuest = currentLog.quests.find((quest) => quest.id === currentQuestId)

  const objective = currentQuest.objectives.find((obj) => obj.id === objectiveId)
  objective.completed = !objective.completed

  // Update the log's updated timestamp
  currentLog.updated = new Date().toISOString()

  // Schedule auto-save
  scheduleAutoSave()

  renderQuestDetails()
  renderQuests() // Update the progress in the quest list
}

// Add Quest Form Functions
function showAddQuestForm() {
  document.getElementById("quest-details").classList.add("hidden")
  document.getElementById("empty-state").classList.add("hidden")
  document.getElementById("add-quest-form").classList.remove("hidden")

  // Reset form
  document.getElementById("quest-title-input").value = ""
  document.getElementById("quest-description-input").value = ""
  document.getElementById("objectives-container").innerHTML = `
    <div class="objective-input-item">
      <input type="text" class="text-input objective-title" placeholder="Objective title">
    </div>
  `

  document.getElementById("quest-title-input").focus()
}

function hideAddQuestForm() {
  document.getElementById("add-quest-form").classList.add("hidden")
  document.getElementById("edit-quest-form").classList.add("hidden")

  if (currentQuestId) {
    showQuestDetails()
  } else {
    showEmptyState()
  }
}

function addObjectiveInput() {
  const objectivesContainer = document.getElementById("objectives-container")
  const newObjectiveItem = document.createElement("div")
  newObjectiveItem.className = "objective-input-item"
  newObjectiveItem.innerHTML = `
    <input type="text" class="text-input objective-title" placeholder="Objective title">
    <button type="button" class="btn-icon remove-objective">×</button>
  `

  objectivesContainer.appendChild(newObjectiveItem)

  // Add event listener for remove button
  newObjectiveItem.querySelector(".remove-objective").addEventListener("click", (e) => {
    e.stopPropagation()
    newObjectiveItem.remove()
  })

  // Focus the new input
  newObjectiveItem.querySelector(".objective-title").focus()
}

async function saveQuest() {
  const title = document.getElementById("quest-title-input").value.trim()
  const description = document.getElementById("quest-description-input").value.trim()

  if (!title) {
    showNotification("Please enter a quest title", "error")
    return
  }

  const objectiveInputs = document.querySelectorAll(".objective-title")
  const objectives = []

  for (const input of objectiveInputs) {
    const objectiveTitle = input.value.trim()
    if (objectiveTitle) {
      objectives.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: objectiveTitle,
        completed: false,
      })
    }
  }

  if (objectives.length === 0) {
    showNotification("Please add at least one objective", "error")
    return
  }

  const newQuest = {
    id: Date.now().toString(),
    title,
    description,
    objectives,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }

  const currentLog = questLogs.find((log) => log.id === currentLogId)
  currentLog.quests.push(newQuest)

  // Update the log's updated timestamp
  currentLog.updated = new Date().toISOString()

  // Save the log
  await saveCurrentLog()

  hideAddQuestForm()
  renderQuests()
  selectQuest(newQuest.id)
}

// Edit Quest Functions
function showEditQuestForm() {
  if (!currentQuestId) return

  const currentLog = questLogs.find((log) => log.id === currentLogId)
  const currentQuest = currentLog.quests.find((quest) => quest.id === currentQuestId)

  // Populate form with current quest data
  document.getElementById("edit-quest-title-input").value = currentQuest.title
  document.getElementById("edit-quest-description-input").value = currentQuest.description || ""

  // Populate objectives
  const objectivesContainer = document.getElementById("edit-objectives-container")
  objectivesContainer.innerHTML = ""

  currentQuest.objectives.forEach((objective) => {
    const objectiveItem = document.createElement("div")
    objectiveItem.className = "objective-input-item"
    objectiveItem.innerHTML = `
      <input type="text" class="text-input objective-title" placeholder="Objective title" value="${objective.title}" data-id="${objective.id}" data-completed="${objective.completed}">
      <button type="button" class="btn-icon remove-objective">×</button>
    `
    objectivesContainer.appendChild(objectiveItem)

    // Add event listener for remove button
    objectiveItem.querySelector(".remove-objective").addEventListener("click", (e) => {
      e.stopPropagation()
      objectiveItem.remove()
    })
  })

  // Hide other views and show edit form
  document.getElementById("quest-details").classList.add("hidden")
  document.getElementById("empty-state").classList.add("hidden")
  document.getElementById("add-quest-form").classList.add("hidden")
  document.getElementById("edit-quest-form").classList.remove("hidden")
}

function hideEditQuestForm() {
  document.getElementById("edit-quest-form").classList.add("hidden")
  showQuestDetails()
}

function addEditObjectiveInput() {
  const objectivesContainer = document.getElementById("edit-objectives-container")
  const newObjectiveItem = document.createElement("div")
  newObjectiveItem.className = "objective-input-item"
  newObjectiveItem.innerHTML = `
    <input type="text" class="text-input objective-title" placeholder="Objective title">
    <button type="button" class="btn-icon remove-objective">×</button>
  `

  objectivesContainer.appendChild(newObjectiveItem)

  // Add event listener for remove button
  newObjectiveItem.querySelector(".remove-objective").addEventListener("click", (e) => {
    e.stopPropagation()
    newObjectiveItem.remove()
  })

  // Focus the new input
  newObjectiveItem.querySelector(".objective-title").focus()
}

async function saveEditedQuest() {
  const title = document.getElementById("edit-quest-title-input").value.trim()
  const description = document.getElementById("edit-quest-description-input").value.trim()

  if (!title) {
    showNotification("Please enter a quest title", "error")
    return
  }

  const objectiveInputs = document.querySelectorAll("#edit-objectives-container .objective-title")
  const objectives = []

  for (const input of objectiveInputs) {
    const objectiveTitle = input.value.trim()
    if (objectiveTitle) {
      // If the objective has an ID, keep it (existing objective)
      const objectiveId =
        input.getAttribute("data-id") || Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const completed = input.getAttribute("data-completed") === "true"

      objectives.push({
        id: objectiveId,
        title: objectiveTitle,
        completed: completed,
      })
    }
  }

  if (objectives.length === 0) {
    showNotification("Please add at least one objective", "error")
    return
  }

  const currentLog = questLogs.find((log) => log.id === currentLogId)
  const questIndex = currentLog.quests.findIndex((quest) => quest.id === currentQuestId)

  if (questIndex === -1) return

  // Update the quest
  currentLog.quests[questIndex] = {
    ...currentLog.quests[questIndex],
    title,
    description,
    objectives,
    updated: new Date().toISOString(),
  }

  // Update the log's updated timestamp
  currentLog.updated = new Date().toISOString()

  // Save the log
  await saveCurrentLog()

  hideEditQuestForm()
  renderQuests()
  selectQuest(currentQuestId)

  showNotification("Quest updated successfully", "success")
}

// UI State Functions
function showQuestDetails() {
  document.getElementById("quest-details").classList.remove("hidden")
  document.getElementById("empty-state").classList.add("hidden")
  document.getElementById("add-quest-form").classList.add("hidden")
  document.getElementById("edit-quest-form").classList.add("hidden")
}

function showEmptyState() {
  document.getElementById("quest-details").classList.add("hidden")
  document.getElementById("empty-state").classList.remove("hidden")
  document.getElementById("add-quest-form").classList.add("hidden")
}

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")

  notificationMessage.textContent = message
  notification.className = "notification" // Reset classes

  if (type === "error") {
    notification.classList.add("error")
  } else if (type === "success") {
    notification.classList.add("success")
  }

  notification.classList.remove("hidden")

  // Hide after 3 seconds
  setTimeout(() => {
    hideNotification()
  }, 3000)
}

function hideNotification() {
  document.getElementById("notification").classList.add("hidden")
}

function updateSaveStatus(status) {
  document.getElementById("save-status").textContent = status
}

function scheduleAutoSave() {
  // Clear any existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // Set save status
  updateSaveStatus("Unsaved changes...")

  // Schedule save after 2 seconds of inactivity
  saveTimeout = setTimeout(() => {
    saveCurrentLog()
  }, 2000)
}

async function saveCurrentLog(immediate = false) {
  if (!currentLogId) return

  const currentLog = questLogs.find((log) => log.id === currentLogId)
  if (!currentLog) return

  if (immediate) {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
    await saveQuestLog(currentLog)
  } else {
    saveTimeout = null
    await saveQuestLog(currentLog)
  }
}

// Utility Functions
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()

  // If it's today, just show the time
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  // If it's yesterday
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  // Otherwise show the date
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
}
