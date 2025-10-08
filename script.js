

 // ---- DOM refs ----
const form = document.getElementById("registrationForm");
const feedback = document.getElementById("feedback");
const tableBody = document.querySelector("#summaryTable tbody");
const cardsContainer = document.getElementById("profileCards");
const searchInput = document.getElementById("searchInput");
const submitBtn = form.querySelector('button[type="submit"]');

// ---- state ----
let editingId = null;

// ---- helpers ----
function makeId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getFormValues() {
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    programme: document.getElementById("programme").value.trim(),
    year: document.getElementById("year").value.trim(),
    interests: document.getElementById("interests").value.trim(),
    photo: document.getElementById("photo").value.trim()
  };
}

function validateForm(values) {
  let valid = true;
  ["firstName", "lastName", "email", "programme", "year"].forEach(id => {
    const field = document.getElementById(id);
    const err = field.nextElementSibling;
    if (!values[id]) {
      err.textContent = "This field is required";
      valid = false;
    } else {
      err.textContent = "";
    }
  });

  if (values.email && !/^[^\s@]+@[^\s@]+\.(com|org|net|edu|gov|na)$/i.test(values.email)) {
    document.getElementById("email").nextElementSibling.textContent = "Invalid email format";
    valid = false;
  }

  return valid;
}

function resetEditMode() {
  editingId = null;
  submitBtn.textContent = "Add Student";
}

function enterEditMode(id) {
  editingId = id;
  submitBtn.textContent = "Update Student";
}

// ---- DOM creators ----
function createRow(id, { name, email, programme, year }) {
  const tr = document.createElement("tr");
  tr.dataset.id = id;
  tr.innerHTML = `
    <td data-col="name">${name}</td>
    <td data-col="email">${email}</td>
    <td data-col="programme">${programme}</td>
    <td data-col="year">${year}</td>
    <td>
      <button class="edit-btn" type="button">Edit</button>
      <button class="remove-btn" type="button">Remove</button>
    </td>
  `;
  return tr;
}

function createCard(id, { name, email, programme, year, interests, photo }) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = id;
  div.innerHTML = `
    <img src="${photo || "https://via.placeholder.com/80 "}" alt="Profile photo">
    <h3 data-field="name">${name}</h3>
    <p data-field="email"><strong>Email:</strong> ${email}</p>
    <p data-field="programme"><strong>Programme:</strong> ${programme}</p>
    <p data-field="year"><strong>Year:</strong> ${year}</p>
    ${interests ? `<p data-field="interests"><strong>Interests:</strong> ${interests}</p>` : ""}
    <button class="edit-btn" type="button">Edit</button>
    <button class="remove-btn" type="button">Remove</button>
  `;
  return div;
}

// ---- updaters ----
function updateRow(id, { name, email, programme, year }) {
  const tr = tableBody.querySelector(`tr[data-id="${id}"]`);
  if (!tr) return;
  tr.querySelector('[data-col="name"]').textContent = name;
  tr.querySelector('[data-col="email"]').textContent = email;
  tr.querySelector('[data-col="programme"]').textContent = programme;
  tr.querySelector('[data-col="year"]').textContent = year;
}

function updateCard(id, { name, email, programme, year, interests, photo }) {
  const card = cardsContainer.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;
  card.querySelector('[data-field="name"]').textContent = name;
  card.querySelector('[data-field="email"]').innerHTML = `<strong>Email:</strong> ${email}`;
  card.querySelector('[data-field="programme"]').innerHTML = `<strong>Programme:</strong> ${programme}`;
  card.querySelector('[data-field="year"]').innerHTML = `<strong>Year:</strong> ${year}`;

  const interestsEl = card.querySelector('[data-field="interests"]');
  if (interests) {
    if (interestsEl) {
      interestsEl.innerHTML = `<strong>Interests:</strong> ${interests}`;
    } else {
      card.insertAdjacentHTML("beforeend", `<p data-field="interests"><strong>Interests:</strong> ${interests}</p>`);
    }
  } else if (interestsEl) {
    interestsEl.remove();
  }

  if (photo) {
    card.querySelector("img").src = photo;
  }
}

function removeById(id) {
  tableBody.querySelector(`tr[data-id="${id}"]`)?.remove();
  cardsContainer.querySelector(`.card[data-id="${id}"]`)?.remove();
  if (editingId === id) {
    resetEditMode();
    form.reset();
  }
}

// ---- event: submit ----
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const values = getFormValues();
  if (!validateForm(values)) {
    feedback.textContent = "Please fix errors before submitting.";
    feedback.style.color = "crimson";
    return;
  }

  const name = `${values.firstName} ${values.lastName}`.trim();
  const payload = { name, ...values };

  if (editingId) {
    updateRow(editingId, payload);
    updateCard(editingId, payload);
    feedback.textContent = "Student updated successfully!";
    feedback.style.color = "green";
    resetEditMode();
  } else {
    const id = makeId();
    tableBody.appendChild(createRow(id, payload));
    cardsContainer.appendChild(createCard(id, payload));
    feedback.textContent = "Student added successfully!";
    feedback.style.color = "green";
  }

  form.reset();
});

// ---- event delegation: table buttons ----
tableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const tr = btn.closest("tr");
  if (!tr) return;
  const id = tr.dataset.id;

  if (btn.classList.contains("remove-btn")) {
    removeById(id);
  } else if (btn.classList.contains("edit-btn")) {
    const name = tr.querySelector('[data-col="name"]').textContent;
    const [firstName, ...rest] = name.split(" ");
    const lastName = rest.join(" ");

    document.getElementById("firstName").value = firstName;
    document.getElementById("lastName").value = lastName;
    document.getElementById("email").value = tr.querySelector('[data-col="email"]').textContent;
    document.getElementById("programme").value = tr.querySelector('[data-col="programme"]').textContent;
    document.getElementById("year").value = tr.querySelector('[data-col="year"]').textContent;

    const card = cardsContainer.querySelector(`.card[data-id="${id}"]`);
    const interestsEl = card?.querySelector('[data-field="interests"]');
    document.getElementById("interests").value = interestsEl
      ? interestsEl.innerText.replace(/^Interests:\s*/, "").trim()
      : "";

    const imgSrc = card?.querySelector("img")?.src || "";
    document.getElementById("photo").value = imgSrc.includes("placeholder") ? "" : imgSrc;

    enterEditMode(id);
  }
});

// ---- event delegation: card buttons ----
cardsContainer.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const card = btn.closest(".card");
  if (!card) return;
  const id = card.dataset.id;

  if (btn.classList.contains("remove-btn")) {
    removeById(id);
  } else if (btn.classList.contains("edit-btn")) {
      const tr = tableBody.querySelector(`tr[data-id="${id}"]`);
    if (tr) tr.querySelector(".edit-btn").click();
  }
});

// ---- search/filter ----
if (searchInput) {
  searchInput.addEventListener("input", function () {
    const q = this.value.toLowerCase();

    // filter rows
    tableBody.querySelectorAll("tr").forEach((tr) => {
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });

    // filter cards
    cardsContainer.querySelectorAll(".card").forEach((card) => {
      card.style.display = card.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}
