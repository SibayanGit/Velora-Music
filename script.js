/* ---------------------------------------------------------
   YOUTUBE IFRAME API
--------------------------------------------------------- */
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

var player;
var isPlayerReady = false;

function onYouTubeIframeAPIReady() {
    player = new YT.Player("youtube-player", {
        height: "100%",
        width: "100%",
        playerVars: {
            playsinline: 1,
            controls: 1, // Must be 1 for compliance if mini
            rel: 0,
            origin: window.location.origin
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
}

function onPlayerReady() {
    isPlayerReady = true;
    setVolume();
}

/* ---------------------------------------------------------
   DATA & STATE
--------------------------------------------------------- */
let library = [];
let currentSongIndex = 0;
let isPlaying = false;
let progressInterval;

// Load JSON
window.onload = () => {
    fetch("songs.json")
        .then(response => response.json())
        .then(data => {
            library = data;
            renderTrendingRow();
            renderQueue();
        })
        .catch(err => console.error("Could not load songs.json", err));
};

/* ---------------------------------------------------------
   UI RENDERING
--------------------------------------------------------- */
function renderTrendingRow() {
    const container = document.getElementById("trending-container");
    const trending = library.filter(s => s.isTrending);

    container.innerHTML = trending.map(song => `
        <div onclick="playTrack('${song.id}')" class="min-w-[140px] w-[140px] bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer group transition snap-start hover:bg-white/10">
            <div class="relative mb-2">
                <img src="${song.img}" class="w-full aspect-square object-cover rounded-lg shadow-lg">
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                    <i class="fas fa-play text-white"></i>
                </div>
            </div>
            <h3 class="font-bold text-white text-sm truncate">${song.title}</h3>
            <p class="text-[10px] text-gray-400 mt-0.5">${song.artist}</p>
        </div>
    `).join("");
}

function renderQueue() {
    const container = document.getElementById("queue-list");
    container.innerHTML = "";

    library.forEach((song, index) => {
        const isActive = index === currentSongIndex;
        const div = document.createElement("div");
        div.className = `flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${isActive ? "bg-white/10" : "hover:bg-white/5"}`;
        div.onclick = () => playTrack(song.id);
        
        div.innerHTML = `
            <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 relative">
                <img src="${song.img}" class="w-full h-full object-cover">
                ${isActive ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center"><i class="fas fa-wave-square text-white text-xs"></i></div>' : ''}
            </div>
            <div class="overflow-hidden">
                <h4 class="text-xs font-bold truncate ${isActive ? "text-purple-400" : "text-gray-200"}">${song.title}</h4>
                <p class="text-[10px] text-gray-400 truncate">${song.artist}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

/* ---------------------------------------------------------
   PLAYBACK LOGIC
--------------------------------------------------------- */
function playTrack(videoId) {
    const song = library.find(s => s.id === videoId);
    if (!song) return;

    currentSongIndex = library.indexOf(song);

    // Update UI
    document.getElementById("music-player").classList.remove("translate-y-[200%]");
    document.getElementById("player-title").innerText = song.title;
    document.getElementById("player-artist").innerText = song.artist;
    document.getElementById("player-art").src = song.img;
    
    // Update Main Video Text
    document.getElementById("now-title-main").innerText = song.title;
    document.getElementById("now-artist-main").innerText = song.artist;

    // Show Video Container (Normal Mode initially)
    const vContainer = document.getElementById("video-container");
    vContainer.classList.remove("video-hidden", "video-mini");
    vContainer.classList.add("video-normal");

    // Force switch to Home tab to show video
    switchTab('home');

    renderQueue();

    if (isPlayerReady) {
        player.loadVideoById(videoId);
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        document.getElementById("play-icon").className = "fas fa-pause";
        document.getElementById("player-art").style.animationPlayState = "running";
        startProgressLoop();
    } 
    else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        document.getElementById("play-icon").className = "fas fa-play ml-0.5";
        document.getElementById("player-art").style.animationPlayState = "paused";
        stopProgressLoop();
    } 
    else if (event.data === YT.PlayerState.ENDED) {
        nextSong();
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    // Auto-skip on error
    setTimeout(nextSong, 2000);
}

function togglePlay() {
    if (!isPlayerReady) return;
    isPlaying ? player.pauseVideo() : player.playVideo();
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % library.length;
    playTrack(library[currentSongIndex].id);
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + library.length) % library.length;
    playTrack(library[currentSongIndex].id);
}

/* ---------------------------------------------------------
   PROGRESS & VOLUME
--------------------------------------------------------- */
function startProgressLoop() {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        if (!player || !player.getCurrentTime) return;
        const current = player.getCurrentTime();
        const total = player.getDuration();
        if (total > 0) {
            const pct = (current / total) * 100;
            document.getElementById("progress-slider").value = pct;
            document.getElementById("progress-fill").style.width = pct + "%";
        }
    }, 500);
}

function stopProgressLoop() { clearInterval(progressInterval); }

document.getElementById("progress-slider").oninput = function() {
    if (!isPlayerReady) return;
    const seekTo = (this.value / 100) * player.getDuration();
    player.seekTo(seekTo, true);
};

document.getElementById("volume-slider").oninput = function() {
    setVolume();
}

function setVolume() {
    if (!isPlayerReady) return;
    const vol = document.getElementById("volume-slider").value;
    player.setVolume(vol);
    document.getElementById("volume-fill").style.width = vol + "%";
}

/* ---------------------------------------------------------
   NAVIGATION & COMPLIANCE (MINI MODE)
--------------------------------------------------------- */
function switchTab(id) {
    // 1. Toggle Content Views
    document.getElementById("view-home").classList.add("hidden");
    document.getElementById("view-search").classList.add("hidden");
    document.getElementById("view-" + id).classList.remove("hidden");

    // 2. Update Navbar
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active", "inactive"));
    document.querySelectorAll(".nav-item").forEach(el => el.classList.add("inactive"));
    document.getElementById("d-nav-" + id).classList.remove("inactive");
    document.getElementById("d-nav-" + id).classList.add("active");

    // 3. Toggle Search Bar
    document.getElementById("search-bar-container").classList.toggle("hidden", id !== "search");

    // 4. COMPLIANCE LOGIC: Handle Video Player Position
    const vContainer = document.getElementById("video-container");
    
    // Only toggle modes if the player is actually active (not hidden)
    if (!vContainer.classList.contains("video-hidden")) {
        if (id === 'search') {
            vContainer.classList.remove("video-normal");
            vContainer.classList.add("video-mini");
        } else {
            vContainer.classList.remove("video-mini");
            vContainer.classList.add("video-normal");
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("right-sidebar");
    if (sidebar.classList.contains("w-0")) {
        sidebar.classList.remove("w-0", "p-0", "opacity-0");
        sidebar.classList.add("w-[300px]", "p-4", "opacity-100");
    } else {
        sidebar.classList.add("w-0", "p-0", "opacity-0");
        sidebar.classList.remove("w-[300px]", "p-4", "opacity-100");
    }
}

/* ---------------------------------------------------------
   SEARCH
--------------------------------------------------------- */
document.getElementById("search-input").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const grid = document.getElementById("search-results-grid");
    
    const results = library.filter(s => 
        s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query)
    );

    if (!results.length) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center">No songs found.</p>';
        return;
    }

    grid.innerHTML = results.map(song => `
        <div onclick="playTrack('${song.id}')" class="bg-white/5 p-3 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition">
            <img src="${song.img}" class="w-full rounded-xl mb-2 aspect-square object-cover">
            <h3 class="font-bold text-white text-sm truncate">${song.title}</h3>
            <p class="text-xs text-gray-400">${song.artist}</p>
        </div>
    `).join("");
});
