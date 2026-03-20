function buildPlaylistNav() {
    const navList = document.getElementById('playlist-nav');
    navList.innerHTML = '';
    for (let key in playlists) {
        const li = document.createElement('li');
        li.textContent = key;
        li.dataset.playlist = key;
        li.addEventListener('click', () => switchPlaylist(key));
        navList.appendChild(li);
    }
    const firstKey = Object.keys(playlists)[0];
    if (firstKey) switchPlaylist(firstKey);
}

function switchPlaylist(playlistKey) {
    const playlist = playlists[playlistKey];
    if (!playlist) return;
    currentPlaylistKey = playlistKey;
    currentPlaylistTracks = getTracksForPlaylist(playlistKey);
    currentTrackIndex = 0;
    document.getElementById('playlist-title').innerText = playlistKey;
    document.getElementById('playlist-description').innerText = playlist.description || 'Плейлист для тебя';
    document.getElementById('playlist-cover').src = playlist.cover || 'images/default_playlist.jpg';
    renderTrackList(currentPlaylistTracks, playlistKey);
    document.querySelectorAll('#playlist-nav li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.playlist === playlistKey) li.classList.add('active');
    });
    const audioElem = document.getElementById('audio');
    audioElem.pause();
    audioElem.currentTime = 0;
    document.getElementById('play-pause').innerHTML = '<i class="fas fa-play"></i>';
    document.getElementById('current-time').innerText = '0:00';
    document.getElementById('duration').innerText = '0:00';
    document.getElementById('progress').value = 0;
    document.getElementById('current-track-name').innerText = 'Не выбрано';
    document.getElementById('current-artist').innerText = '';
    document.getElementById('current-cover').src = 'images/default_track.jpg';
    if (typeof preloadAllDurations === 'function') {
        preloadAllDurations(currentPlaylistTracks, playlistKey);
    }
}

function renderTrackList(tracks, playlistKey) {
    const container = document.getElementById('track-list');
    container.innerHTML = '';
    tracks.forEach((track, idx) => {
        const trackDiv = document.createElement('div');
        trackDiv.className = 'track-item';
        trackDiv.dataset.index = idx;
        trackDiv.innerHTML = `
            <div class="track-index">${idx+1}</div>
            <img class="track-cover" src="${track.cover || 'images/default_track.jpg'}" alt="cover">
            <div class="track-info">
                <div class="track-name">${escapeHtml(track.name)}</div>
                <div class="track-artist">${escapeHtml(track.artist)}</div>
            </div>
            <div class="track-duration">--:--</div>
        `;
        trackDiv.addEventListener('click', () => playTrack(idx));
        container.appendChild(trackDiv);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Предзагрузка длительностей
const durationsCache = {};
function getTrackDuration(trackSrc, callback) {
    if (durationsCache[trackSrc]) {
        callback(durationsCache[trackSrc]);
        return;
    }
    const tempAudio = new Audio();
    tempAudio.preload = 'metadata';
    tempAudio.src = trackSrc;
    tempAudio.addEventListener('loadedmetadata', () => {
        const duration = tempAudio.duration;
        if (isFinite(duration)) {
            durationsCache[trackSrc] = duration;
            callback(duration);
        } else callback(null);
        tempAudio.src = '';
        tempAudio.load();
    });
    tempAudio.addEventListener('error', () => callback(null));
}
function preloadAllDurations(tracks, playlistKey) {
    tracks.forEach((track, index) => {
        getTrackDuration(track.src, (duration) => {
            if (duration !== null) {
                updateTrackDurationDisplay(index, duration, playlistKey);
            }
        });
    });
}
function updateTrackDurationDisplay(index, duration, playlistKey) {
    const trackItems = document.querySelectorAll('.track-item');
    if (trackItems[index]) {
        const durationElem = trackItems[index].querySelector('.track-duration');
        if (durationElem) {
            let playsInfo = '';
            if (playlistKey === "Топ по прослушиваниям") {
                const plays = getTrackPlays(currentPlaylistTracks[index]?.src);
                playsInfo = `<span class="track-plays">🎧 ${plays}</span>`;
            }
            durationElem.innerHTML = `${formatTime(duration)} ${playsInfo}`;
        }
    }
}
window.preloadAllDurations = preloadAllDurations;

// Мобильное меню
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.querySelectorAll('#playlist-nav li').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            });
        });
        document.addEventListener('click', (event) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(event.target) && event.target !== menuToggle) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
});

buildPlaylistNav();
