const audio = document.getElementById('audio');
let currentPlaylistKey = null;
let currentPlaylistTracks = [];
let currentTrackIndex = 0;
let repeatMode = 0; // 0: нет, 1: один трек, 2: плейлист
let previousVolume = 0.7;

// DOM элементы
const playPauseBtn = document.getElementById('play-pause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const repeatBtn = document.getElementById('repeat');
const progressSlider = document.getElementById('progress');
const volumeSlider = document.getElementById('volume');
const volumeIcon = document.getElementById('volume-icon');
const currentTimeSpan = document.getElementById('current-time');
const durationSpan = document.getElementById('duration');
const currentTrackNameSpan = document.getElementById('current-track-name');
const currentArtistSpan = document.getElementById('current-artist');
const currentCoverImg = document.getElementById('current-cover');

// Полноэкранные элементы
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenCover = document.getElementById('fullscreen-cover');
const fullscreenTrackName = document.getElementById('fullscreen-track-name');
const fullscreenArtist = document.getElementById('fullscreen-artist');
const fullscreenPlayPause = document.getElementById('fullscreen-play-pause');
const fullscreenPrev = document.getElementById('fullscreen-prev');
const fullscreenNext = document.getElementById('fullscreen-next');
const fullscreenRepeat = document.getElementById('fullscreen-repeat');
const fullscreenShuffle = document.getElementById('fullscreen-shuffle');
const fullscreenProgress = document.getElementById('fullscreen-progress');
const fullscreenCurrentTime = document.getElementById('fullscreen-current-time');
const fullscreenDuration = document.getElementById('fullscreen-duration');
const fullscreenVolume = document.getElementById('fullscreen-volume');
const fullscreenVolumeIcon = document.getElementById('fullscreen-volume-icon');
const closeFullscreen = document.getElementById('close-fullscreen');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// --- Работа со счётчиками (localStorage) ---
const PLAYS_STORAGE_KEY = 'trackPlays';

function initPlaysCounter() {
    let plays = localStorage.getItem(PLAYS_STORAGE_KEY);
    if (!plays) {
        const initialPlays = {};
        allTracks.forEach(track => { initialPlays[track.src] = 0; });
        localStorage.setItem(PLAYS_STORAGE_KEY, JSON.stringify(initialPlays));
    } else {
        syncPlaysCounter();
    }
}
function syncPlaysCounter() {
    let plays = JSON.parse(localStorage.getItem(PLAYS_STORAGE_KEY) || '{}');
    let changed = false;
    allTracks.forEach(track => {
        if (plays[track.src] === undefined) {
            plays[track.src] = 0;
            changed = true;
        }
    });
    if (changed) localStorage.setItem(PLAYS_STORAGE_KEY, JSON.stringify(plays));
}
function getTrackPlays(src) {
    const plays = JSON.parse(localStorage.getItem(PLAYS_STORAGE_KEY) || '{}');
    return plays[src] || 0;
}
function incrementTrackPlays(src) {
    const plays = JSON.parse(localStorage.getItem(PLAYS_STORAGE_KEY));
    if (plays) {
        plays[src] = (plays[src] || 0) + 1;
        localStorage.setItem(PLAYS_STORAGE_KEY, JSON.stringify(plays));
    }
}

// --- Управление плейлистами и треками ---
function getTracksForPlaylist(playlistKey) {
    const playlist = playlists[playlistKey];
    if (!playlist) return [];
    if (playlist.sortType === "original") return [...allTracks];
    if (playlist.sortType === "byPlays") {
        return [...allTracks].sort((a,b) => getTrackPlays(b.src) - getTrackPlays(a.src));
    }
    return [];
}

function playTrack(index) {
    if (!currentPlaylistTracks.length) return;
    if (index < 0) index = 0;
    if (index >= currentPlaylistTracks.length) index = 0;
    currentTrackIndex = index;
    const track = currentPlaylistTracks[currentTrackIndex];
    audio.src = track.src;
    audio.load();
    audio.play().catch(e => console.log("Автовоспроизведение заблокировано:", e));
    updateNowPlaying(track);
    highlightActiveTrack(currentTrackIndex);
    syncFullscreenUI(); // синхронизируем оверлей
}
function updateNowPlaying(track) {
    currentTrackNameSpan.innerText = track.name;
    currentArtistSpan.innerText = track.artist;
    currentCoverImg.src = track.cover || 'images/default_track.jpg';
    if (fullscreenOverlay.classList.contains('active')) {
        fullscreenTrackName.innerText = track.name;
        fullscreenArtist.innerText = track.artist;
        fullscreenCover.src = track.cover || 'images/default_track.jpg';
    }
}
function highlightActiveTrack(index) {
    document.querySelectorAll('.track-item').forEach((item, i) => {
        if (i === index) item.classList.add('active');
        else item.classList.remove('active');
    });
}
function nextTrack() {
    if (!currentPlaylistTracks.length) return;
    let next = currentTrackIndex + 1;
    if (next >= currentPlaylistTracks.length) {
        if (repeatMode === 2) next = 0;
        else return;
    }
    playTrack(next);
}
function prevTrack() {
    if (!currentPlaylistTracks.length) return;
    if (currentTrackIndex === 0) return;
    playTrack(currentTrackIndex - 1);
}
function playRandomTrack() {
    if (!currentPlaylistTracks.length) return;
    const randomIndex = Math.floor(Math.random() * currentPlaylistTracks.length);
    playTrack(randomIndex);
}

// --- Обработчики событий аудио ---
function onLoadedMetadata() {
    if (audio.duration && isFinite(audio.duration)) {
        durationSpan.innerText = formatTime(audio.duration);
        if (fullscreenOverlay.classList.contains('active')) {
            fullscreenDuration.innerText = formatTime(audio.duration);
        }
        updateTrackDurationInList(currentTrackIndex, audio.duration);
    }
}
function updateTrackDurationInList(index, duration) {
    const trackItems = document.querySelectorAll('.track-item');
    if (trackItems[index]) {
        const durationElem = trackItems[index].querySelector('.track-duration');
        if (durationElem) {
            const playsInfo = (currentPlaylistKey === "Топ по прослушиваниям") ?
                `<span class="track-plays">🎧 ${getTrackPlays(currentPlaylistTracks[index]?.src)}</span>` : '';
            durationElem.innerHTML = `${formatTime(duration)} ${playsInfo}`;
        }
    }
}
function updateProgress() {
    if (audio.duration && isFinite(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressSlider.value = percent;
        currentTimeSpan.innerText = formatTime(audio.currentTime);
        if (fullscreenOverlay.classList.contains('active')) {
            fullscreenProgress.value = percent;
            fullscreenCurrentTime.innerText = formatTime(audio.currentTime);
        }
    }
}
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
function onTrackEnded() {
    const currentTrack = currentPlaylistTracks[currentTrackIndex];
    if (currentTrack) incrementTrackPlays(currentTrack.src);
    if (repeatMode === 1) {
        playTrack(currentTrackIndex);
    } else if (repeatMode === 2) {
        let next = currentTrackIndex + 1;
        if (next >= currentPlaylistTracks.length) next = 0;
        playTrack(next);
    } else {
        let next = currentTrackIndex + 1;
        if (next < currentPlaylistTracks.length) playTrack(next);
    }
    if (currentPlaylistKey === "Топ по прослушиваниям") {
        updateCurrentPlaylistTracksBySort();
        renderTrackList(currentPlaylistTracks, currentPlaylistKey);
        const newIndex = currentPlaylistTracks.findIndex(t => t.src === currentTrack.src);
        if (newIndex !== -1) currentTrackIndex = newIndex;
        highlightActiveTrack(currentTrackIndex);
    }
}
function updateCurrentPlaylistTracksBySort() {
    if (currentPlaylistKey) {
        currentPlaylistTracks = getTracksForPlaylist(currentPlaylistKey);
    }
}

// --- Управление громкостью и mute ---
function setVolume(value) {
    let newVolume = parseFloat(value);
    if (isNaN(newVolume)) newVolume = 1;
    newVolume = Math.min(1, Math.max(0, newVolume));
    audio.volume = newVolume;
    if (audio.muted && newVolume > 0) audio.muted = false;
    volumeSlider.value = newVolume;
    if (fullscreenOverlay.classList.contains('active')) fullscreenVolume.value = newVolume;
    if (newVolume > 0) previousVolume = newVolume;
    updateVolumeIcon();
}
function updateVolumeIcon() {
    if (audio.muted || audio.volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
        if (fullscreenVolumeIcon) fullscreenVolumeIcon.className = 'fas fa-volume-mute';
    } else if (audio.volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
        if (fullscreenVolumeIcon) fullscreenVolumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
        if (fullscreenVolumeIcon) fullscreenVolumeIcon.className = 'fas fa-volume-up';
    }
}
function toggleMute() {
    if (audio.muted) {
        audio.muted = false;
        setVolume(previousVolume);
    } else {
        previousVolume = audio.volume;
        setVolume(0);
        audio.muted = true;
    }
}
function syncVolumeSlider() {
    volumeSlider.value = audio.volume;
    if (fullscreenOverlay.classList.contains('active')) fullscreenVolume.value = audio.volume;
    updateVolumeIcon();
}

// --- Полноэкранный режим ---
function openFullscreen() {
    if (!currentPlaylistTracks.length) return;
    const track = currentPlaylistTracks[currentTrackIndex];
    fullscreenCover.src = track.cover || 'images/default_track.jpg';
    fullscreenTrackName.innerText = track.name;
    fullscreenArtist.innerText = track.artist;
    fullscreenOverlay.classList.add('active');
    syncFullscreenUI();
}
function closeFullscreenMode() {
    fullscreenOverlay.classList.remove('active');
}
function syncFullscreenUI() {
    if (!fullscreenOverlay.classList.contains('active')) return;
    const isPlaying = !audio.paused;
    fullscreenPlayPause.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    fullscreenProgress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fullscreenCurrentTime.innerText = formatTime(audio.currentTime);
    fullscreenDuration.innerText = formatTime(audio.duration);
    fullscreenVolume.value = audio.volume;
    updateVolumeIcon();
    // Режим повтора
    if (repeatMode === 1 || repeatMode === 2) fullscreenRepeat.style.color = '#1db954';
    else fullscreenRepeat.style.color = 'white';
}
function syncFullscreenWithAudio() {
    if (fullscreenOverlay.classList.contains('active')) {
        fullscreenProgress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        fullscreenCurrentTime.innerText = formatTime(audio.currentTime);
        fullscreenDuration.innerText = formatTime(audio.duration);
        fullscreenVolume.value = audio.volume;
        updateVolumeIcon();
    }
}

// --- Инициализация и подписка на события ---
function initPlayer() {
    initPlaysCounter();
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onTrackEnded);
    audio.addEventListener('play', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (fullscreenOverlay.classList.contains('active')) fullscreenPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    });
    audio.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (fullscreenOverlay.classList.contains('active')) fullscreenPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    });
    audio.addEventListener('volumechange', syncVolumeSlider);
    audio.addEventListener('timeupdate', syncFullscreenWithAudio);
    volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
    volumeIcon.addEventListener('click', toggleMute);
    playPauseBtn.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);
    repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        if (repeatMode === 1 || repeatMode === 2) repeatBtn.style.color = '#1db954';
        else repeatBtn.style.color = 'white';
        if (fullscreenOverlay.classList.contains('active')) {
            if (repeatMode === 1 || repeatMode === 2) fullscreenRepeat.style.color = '#1db954';
            else fullscreenRepeat.style.color = 'white';
        }
    });
    progressSlider.addEventListener('input', (e) => {
        if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });
    fullscreenBtn.addEventListener('click', openFullscreen);
    closeFullscreen.addEventListener('click', closeFullscreenMode);
    fullscreenPlayPause.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
    fullscreenPrev.addEventListener('click', prevTrack);
    fullscreenNext.addEventListener('click', nextTrack);
    fullscreenRepeat.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        if (repeatMode === 1 || repeatMode === 2) fullscreenRepeat.style.color = '#1db954';
        else fullscreenRepeat.style.color = 'white';
        if (repeatMode === 1 || repeatMode === 2) repeatBtn.style.color = '#1db954';
        else repeatBtn.style.color = 'white';
    });
    fullscreenShuffle.addEventListener('click', playRandomTrack);
    fullscreenProgress.addEventListener('input', (e) => {
        if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });
    fullscreenVolume.addEventListener('input', (e) => setVolume(e.target.value));
    fullscreenVolumeIcon.addEventListener('click', toggleMute);
    setVolume(0.7);
}

// Глобально доступные функции (для вызова из ui.js)
window.playTrack = playTrack;
window.playRandomTrack = playRandomTrack;
window.getTrackPlays = getTrackPlays;
window.getTracksForPlaylist = getTracksForPlaylist;
window.renderTrackList = null; // будет задано в ui.js
window.preloadAllDurations = null;

initPlayer();
