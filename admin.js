const tokenInput = document.getElementById("admin-token");
const saveTokenButton = document.getElementById("save-token");
const form = document.getElementById("item-form");
const status = document.getElementById("form-status");
const itemsContainer = document.getElementById("admin-items");

const storedToken = localStorage.getItem("cattomintAdminToken");
if (storedToken && tokenInput) {
  tokenInput.value = storedToken;
}

const setStatus = (message, tone = "") => {
  if (!status) {
    return;
  }
  status.textContent = message;
  status.className = `form-status ${tone}`.trim();
};

const getToken = () => (tokenInput ? tokenInput.value.trim() : "");

const saveToken = () => {
  const token = getToken();
  if (token) {
    localStorage.setItem("cattomintAdminToken", token);
    setStatus("Admin token saved.", "success");
  } else {
    localStorage.removeItem("cattomintAdminToken");
    setStatus("Enter a token to continue.", "error");
  }
};

const fetchItems = async () => {
  const response = await fetch("/api/admin/items", {
    headers: { "X-Admin-Token": getToken() },
  });

  if (!response.ok) {
    setStatus("Unable to load uploads. Check your token.", "error");
    return [];
  }

  setStatus("Uploads loaded.", "success");
  return response.json();
};

const renderItems = (items) => {
  if (!itemsContainer) {
    return;
  }

  if (!items.length) {
    itemsContainer.innerHTML = "<p>No uploads yet.</p>";
    return;
  }

  itemsContainer.innerHTML = items
    .map(
      (item) => `
        <div class="admin-item">
          <div>
            <strong>${item.title}</strong>
            <p>${item.kind} · ${item.category} · ${item.views} views</p>
          </div>
          <button type="button" data-id="${item.id}" class="feature-btn">
            ${item.is_featured ? "Featured" : "Make featured"}
          </button>
        </div>
      `
    )
    .join("");

  itemsContainer.querySelectorAll(".feature-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const response = await fetch(`/api/admin/items/${id}/feature`, {
        method: "POST",
        headers: { "X-Admin-Token": getToken() },
      });

      if (response.ok) {
        setStatus("Featured updated.", "success");
        loadItems();
      } else {
        setStatus("Unable to update featured item.", "error");
      }
    });
  });
};

const loadItems = async () => {
  const items = await fetchItems();
  renderItems(items);
};

if (saveTokenButton) {
  saveTokenButton.addEventListener("click", saveToken);
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.is_featured = Boolean(data.get("is_featured"));

    const response = await fetch("/api/admin/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": getToken(),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      form.reset();
      setStatus("Upload added.", "success");
      loadItems();
    } else {
      const error = await response.json();
      setStatus(error.error || "Failed to add upload.", "error");
    }
  });
}

loadItems();
