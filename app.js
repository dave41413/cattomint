const placeholderImage = "assets/placeholder.svg";

const formatViews = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M views`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K views`;
  }
  return `${value} views`;
};

const renderFeatured = (item) => {
  const container = document.getElementById("featured-media");
  const picks = document.getElementById("quick-picks");

  if (!container || !picks) {
    return;
  }

  if (!item) {
    return;
  }

  const media = document.createElement(item.kind === "video" ? "video" : "img");
  if (item.kind === "video") {
    media.controls = true;
    media.src = item.media_url;
    media.poster = item.thumbnail_url || placeholderImage;
    media.setAttribute("aria-label", item.title);
  } else {
    media.src = item.media_url || item.thumbnail_url || placeholderImage;
    media.alt = item.title;
  }
  media.className = "featured-media";

  const info = document.createElement("div");
  info.className = "hero-info";
  info.innerHTML = `
    <h1>Featured: ${item.title}</h1>
    <p>${item.description}</p>
    <div class="hero-actions">
      <button type="button">Play Now</button>
      <button type="button">Add to Favorites</button>
    </div>
  `;

  container.innerHTML = "";
  container.appendChild(media);
  container.appendChild(info);

  picks.innerHTML = "";
  const picksItems = [item.category, "Fresh uploads", "Fan favorites", "Retro paw-some"];
  picksItems.forEach((label) => {
    const li = document.createElement("li");
    li.textContent = `🎬 ${label}`;
    picks.appendChild(li);
  });
};

const renderGrid = (items) => {
  const grid = document.getElementById("video-grid");
  const wall = document.getElementById("image-wall");

  if (!grid || !wall) {
    return;
  }

  grid.innerHTML = "";
  wall.innerHTML = "";

  const videos = items.filter((item) => item.kind === "video");
  const images = items.filter((item) => item.kind === "image");

  if (items.length === 0) {
    grid.innerHTML = `
      <article class="video-card empty-state">
        <div>
          <h3>No uploads yet</h3>
          <p>Head to the admin panel to add cat videos and images.</p>
        </div>
      </article>
    `;
    wall.innerHTML = '<div class="image-placeholder">Add images in admin.</div>';
    return;
  }

  videos.forEach((item) => {
    const card = document.createElement("article");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${item.thumbnail_url || placeholderImage}" alt="${item.title}" />
      <div>
        <h3>${item.title}</h3>
        <p>${item.duration ? `${item.duration} · ` : ""}${formatViews(item.views)}</p>
      </div>
    `;
    grid.appendChild(card);
  });

  images.forEach((item) => {
    const img = document.createElement("img");
    img.src = item.thumbnail_url || item.media_url || placeholderImage;
    img.alt = item.title;
    wall.appendChild(img);
  });

  if (videos.length === 0) {
    grid.innerHTML = `
      <article class="video-card empty-state">
        <div>
          <h3>No videos yet</h3>
          <p>Add videos in the admin panel to populate this feed.</p>
        </div>
      </article>
    `;
  }

  if (images.length === 0) {
    wall.innerHTML = '<div class="image-placeholder">Add images in admin.</div>';
  }
};

const loadContent = async () => {
  const [featuredResponse, itemsResponse] = await Promise.all([
    fetch("/api/featured"),
    fetch("/api/items"),
  ]);

  const featured = await featuredResponse.json();
  const items = await itemsResponse.json();

  renderFeatured(featured);
  renderGrid(items);
};

loadContent();
