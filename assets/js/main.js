let selectedLevel = 3;

document.addEventListener("DOMContentLoaded", () => {
  setupLevelButtonListeners();
  setupGenerateButtonListener();
  fetchLatestSchedule(selectedLevel);
});

function setupLevelButtonListeners() {
  const levelButtons = document.querySelectorAll(".btn-group .btn");
  if (!levelButtons.length) return console.warn("⚠️ No level buttons found.");

  levelButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      levelButtons.forEach((b) => {
        b.classList.remove("btn-dark");
        b.classList.add("btn-outline-dark");
      });

      const clicked = e.target;
      clicked.classList.remove("btn-outline-dark");
      clicked.classList.add("btn-dark");

      selectedLevel = parseInt(clicked.textContent.replace("Level", "").trim());
      fetchLatestSchedule(selectedLevel);
    });
  });
}

function setupGenerateButtonListener() {
  const generateBtn = document.getElementById("generateBtn");
  if (!generateBtn) return console.error("❌ Generate button not found!");

  generateBtn.addEventListener("click", async () => {
    if (!selectedLevel) {
      alert("Please select an academic level first.");
      return;
    }

    const container = document.getElementById("schedule-container");
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-warning" role="status"></div>
        <p class="mt-3 fw-bold text-secondary">Generating schedule for Level ${selectedLevel}...</p>
      </div>
    `;

    try {
      const res = await fetch("http://localhost:4000/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: selectedLevel }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to generate schedule.");

      if (!data.schedules?.length) {
        container.innerHTML = `<p class="text-center text-danger fw-bold mt-5">No schedules generated.</p>`;
        return;
      }

      displaySchedules(data.schedules);
    } catch (err) {
      console.error("❌ Schedule generation failed:", err);
      container.innerHTML = `<p class="text-center text-danger fw-bold mt-5">${err.message}</p>`;
    }
  });
}

// -------------------------------
// 📡 Fetch Latest Schedule by Level
// -------------------------------
async function fetchLatestSchedule(level) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = `<p class="text-center text-secondary mt-5">Fetching latest schedule for Level ${level}...</p>`;

  try {
    const res = await fetch(
      `http://localhost:4000/api/schedule/level/${level}`
    );
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to load schedule.");
    if (!data.schedules?.length)
      return (container.innerHTML = `<p class="text-center text-muted fw-bold mt-5">No schedules available for Level ${level}.</p>`);

    displaySchedules(data.schedules);
  } catch (err) {
    console.error("❌ Failed to fetch schedule:", err);
    container.innerHTML = `<p class="text-center text-warning fw-bold mt-5">${err.message}</p>`;
  }
}

// -------------------------------
// 🧱 Display Schedules as Cards
// -------------------------------
function displaySchedules(schedules) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  schedules.forEach((schedule) => {
    const card = document.createElement("div");
    card.className = "card shadow-sm border-0 rounded-3 p-3 mb-4";

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-semibold mb-0">${schedule.section} - Level ${schedule.level}</h5>
        <div>
          <button class="btn btn-info btn-sm me-2 edit-btn" 
            data-id="${schedule._id}" 
            data-section="${schedule.section}" 
            data-level="${schedule.level}">
            <i class="bi bi-pencil-square me-1"></i>Edit
          </button>
          <button class="btn btn-success btn-sm publish-btn" 
            data-id="${schedule._id}" 
            data-section="${schedule.section}" 
            data-level="${schedule.level}">
            <i class="bi bi-upload me-1"></i>Publish
          </button>
          <button class="btn btn-warning btn-sm publish-btn" 
  data-id="${schedule._id}" 
  data-section="${schedule.section}" 
  data-level="${schedule.level}">
   <i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>
  Regenerate
        </div>
      </div>
      <hr class="mt-0">
    `;

    const table = generateTable(schedule.grid);
    card.appendChild(table);
    container.appendChild(card);
  });

  attachPublishHandlers();
  attachEditHandlers();
}

// -------------------------------
// 📅 Generate Table for Schedule Grid
// -------------------------------
function generateTable(grid) {
  const table = document.createElement("table");
  table.className = "table table-bordered text-center align-middle";

  const thead = document.createElement("thead");
  thead.className = "table-light";

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>Day / Time</th>
    <th>8:00-8:50</th>
    <th>9:00-9:50</th>
    <th>10:00-10:50</th>
    <th>11:00-11:50</th>
    <th>12:00-12:50</th>
    <th>1:00-1:50</th>
    <th>2:00-2:50</th>
  `;
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const slots = [
    "8:00-8:50",
    "9:00-9:50",
    "10:00-10:50",
    "11:00-11:50",
    "12:00-12:50",
    "1:00-1:50",
    "2:00-2:50",
  ];

  for (const day of days) {
    const row = document.createElement("tr");
    row.innerHTML = `<th>${day}</th>`;
    for (const time of slots) {
      const course = grid[day]?.[time] || "";
      const cell =
        course.toLowerCase() === "break"
          ? `<td class="bg-light-subtle fw-bold">${course}</td>`
          : `<td>${course}</td>`;
      row.innerHTML += cell;
    }
    tbody.appendChild(row);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

// -------------------------------
// 🚀 Attach Publish Handlers
// -------------------------------
function attachPublishHandlers() {
  document.querySelectorAll(".publish-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const scheduleId = btn.dataset.id;
      const section = btn.dataset.section || "Section ?";
      const level = btn.dataset.level || "?";

      if (!scheduleId || scheduleId === "null") {
        alert("❌ Invalid schedule ID.");
        console.warn("Invalid Schedule ID:", scheduleId);
        return;
      }

      if (
        !confirm(
          `Are you sure you want to publish schedule for ${section} - Level ${level}?`
        )
      )
        return;

      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Publishing...';

      try {
        const res = await fetch(
          `http://localhost:4000/api/schedule/publish/${scheduleId}`,
          {
            method: "POST",
          }
        );

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to publish schedule.");

        // ✅ Success Feedback
        btn.classList.remove("btn-success");
        btn.classList.add("btn-secondary");
        btn.innerHTML = `<i class="bi bi-check-circle me-1"></i>Published v${data.version}`;
        btn.disabled = true;

        alert(`✅ ${data.message}`);
      } catch (err) {
        console.error("❌ Publish error:", err);
        alert(`Error publishing: ${err.message}`);
        btn.innerHTML = '<i class="bi bi-upload me-1"></i>Publish';
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// ========================================
// ✏️ EDIT + SAVE HANDLERS
// ========================================
function attachEditHandlers() {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const scheduleId = btn.dataset.id;
      const card = btn.closest(".card");
      const table = card.querySelector("table");

      // Disable other edit buttons
      document
        .querySelectorAll(".edit-btn")
        .forEach((b) => (b.disabled = true));

      // Create a Save button dynamically
      const saveBtn = document.createElement("button");
      saveBtn.className = "btn btn-success btn-sm ms-2";
      saveBtn.innerHTML = '<i class="bi bi-save me-1"></i>Save';
      btn.after(saveBtn);

      // Convert cells to editable inputs
      table.querySelectorAll("tbody tr").forEach((row) => {
        row.querySelectorAll("td").forEach((cell) => {
          const val = cell.innerText.trim();
          cell.innerHTML = `<input type="text" class="form-control form-control-sm text-center" value="${val}">`;
        });
      });

      btn.classList.add("btn-secondary");
      btn.innerHTML = '<i class="bi bi-pencil me-1"></i>Editing...';

      // Save button handler
      saveBtn.addEventListener("click", async () => {
        const updatedGrid = {};
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
        const times = [
          "8:00-8:50",
          "9:00-9:50",
          "10:00-10:50",
          "11:00-11:50",
          "12:00-12:50",
          "1:00-1:50",
          "2:00-2:50",
        ];

        table.querySelectorAll("tbody tr").forEach((row, rIdx) => {
          const day = days[rIdx];
          updatedGrid[day] = {};
          const inputs = row.querySelectorAll("input");
          inputs.forEach((input, cIdx) => {
            const val = input.value.trim();
            if (val) updatedGrid[day][times[cIdx]] = val;
          });
        });

        console.log("🧱 Updated Grid:", updatedGrid);

        // Save to backend
        try {
          const res = await fetch(
            `http://localhost:4000/api/update/${scheduleId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ grid: updatedGrid }),
            }
          );

          const data = await res.json();
          if (!data.success)
            throw new Error(data.error || "Failed to save schedule.");

          alert("✅ Schedule saved successfully!");
          fetchLatestSchedule(selectedLevel); // Refresh display
        } catch (err) {
          alert("❌ Error saving schedule: " + err.message);
          console.error("Save failed:", err);
        }
      });
    });
  });
}