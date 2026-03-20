// Построение бокового меню
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
    if (firstKey) {
        switchPlaylist(firstKey);
    }
}

// Переключение плейлиста
function switchPlaylist(playlistKey) {
    const playlist = playlists[playlistKey];
    if (!playlist) return;

    currentPlaylistKey = playlistKey;
    currentPlaylistTracks = getTracksForPlaylist(playlistKey);
    currentTrackIndex = 0;

    // Обновляем заголовок и обложку
    document.getElementById('playlist-title').innerText = playlistKey;
    document.getElementById('playlist-description').innerText = playlist.description || 'Плейлист для тебя';
    document.getElementById('playlist-cover').src = playlist.cover || 'images/default_playlist.jpg';

    // Отрисовываем список треков
    renderTrackList(currentPlaylistTracks, playlistKey);

    // Активируем пункт меню
    document.querySelectorAll('#playlist-nav li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.playlist === playlistKey) li.classList.add('active');
    });

    // Останавливаем воспроизведение
    const audioElem = document.getElementById('audio');
    if (audioElem) {
        audioElem.pause();
        audioElem.currentTime = 0;
        document.getElementById('play-pause').innerHTML = '<i class="fas fa-play"></i>';
        document.getElementById('current-time').innerText = '0:00';
        document.getElementById('duration').innerText = '0:00';
        document.getElementById('progress').value = 0;
        document.getElementById('current-track-name').innerText = 'Не выбрано';
        document.getElementById('current-artist').innerText = '';
        document.getElementById('current-cover').src = 'images/default_track.jpg';
    }

    // Предзагружаем длительности
    preloadAllDurations(currentPlaylistTracks, playlistKey);
}

// Отрисовка списка треков
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
        trackDiv.addEventListener('click', () => {
            playTrack(idx);
        });
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

// Инициализация
buildPlaylistNav();

// Обработчик кнопки shuffle
document.addEventListener('DOMContentLoaded', () => {
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn && typeof playRandomTrack === 'function') {
        shuffleBtn.addEventListener('click', playRandomTrack);
    }
    // Мобильное меню
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        // Закрывать меню при клике на ссылку (плейлист)
        const navLinks = document.querySelectorAll('#playlist-nav li');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
        // Закрывать меню при клике вне его (опционально)
        document.addEventListener('click', (event) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(event.target) && event.target !== menuToggle) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
});
});
