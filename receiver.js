const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const CAST_NAMESPACE = 'urn:x-cast:com.medhurst.squashscorerplus';

// Set up receiver options to prevent timeout
const options = new cast.framework.CastReceiverOptions();

// disableIdleTimeout is the most critical setting for a non-media dashboard.
// By default, the receiver shuts down after 5 minutes of inactivity if no media is playing.
options.disableIdleTimeout = true;

// maxInactivity defines how long (in seconds) the receiver stays active without interaction.
// We set this to a very high value (24 hours) to ensure the scoreboard stays visible
// even during long breaks in play.
options.maxInactivity = 86400;

context.addCustomMessageListener(CAST_NAMESPACE, (event) => {
    console.log('Received message:', event.data);
    try {
        let data = event.data;
        if (typeof data === 'string') {
            data = JSON.parse(data);
        }
        updateUI(data);
    } catch (e) {
        console.error('Error handling cast message:', e);
    }
});

function updateUI(data) {
    if (!data) return;

    if (data.event) {
        showEventPopup(data.event, data.side || 'center');
    }

    if (data.timer) {
        updateTimerPopup(data.timer);
    }

    // Helper to safely set text
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = (val !== undefined && val !== null) ? val : (id.startsWith('score') ? '-' : '');
        }
    };

    setText('playerA', data.teamA);
    setText('playerB', data.teamB);
    setText('matchDuration', data.matchDuration);

    if (document.body.classList.contains('timer-active')) {
        return;
    }

    setText('scoreA', data.scoreA);
    setText('scoreB', data.scoreB);
    setText('matchDuration', data.matchDuration);

    // Handle serving indicator and side
    const servingA = document.getElementById('servingA');
    const servingB = document.getElementById('servingB');
    const serverSideA = document.getElementById('serverSideA');
    const serverSideB = document.getElementById('serverSideB');

    if (servingA && servingB) {
        servingA.classList.remove('visible');
        servingB.classList.remove('visible');
        if (serverSideA) serverSideA.innerText = '';
        if (serverSideB) serverSideB.innerText = '';

        if (data.server) {
            const server = data.server.trim().toLowerCase();
            const pA1 = data.playerA1 ? data.playerA1.trim().toLowerCase() : '';
            const pA2 = data.playerA2 ? data.playerA2.trim().toLowerCase() : '';

            const isTeamAServing = (server === pA1 || (pA2 && server === pA2));

            if (isTeamAServing) {
                servingA.classList.add('visible');
                if (serverSideA) serverSideA.innerText = data.serverSide || '';
            } else {
                servingB.classList.add('visible');
                if (serverSideB) serverSideB.innerText = data.serverSide || '';
            }
        }
    }

    // Update previous games
    const footer = document.getElementById('previousGames');
    if (footer) {
        footer.innerHTML = '';
        if (data.previousGames && data.previousGames.length > 0) {
            data.previousGames.forEach((game, index) => {
                const gameDiv = document.createElement('div');
                gameDiv.className = 'game-score-item';
                gameDiv.innerHTML = `
                    <div class="game-label">GAME ${index + 1}</div>
                    <div class="game-score">
                        <span class="score-a">${game.scoreA}</span> - <span class="score-b">${game.scoreB}</span>
                    </div>
                `;
                footer.appendChild(gameDiv);
            });
        }
    }
}

let popupTimeout;
function showEventPopup(message, side) {
    const popup = document.getElementById('eventPopup');
    if (!popup) return;

    popup.innerText = message;

    // Reset classes
    popup.classList.remove('animate-left', 'animate-right', 'animate-center');

    // Trigger reflow to restart animation if needed
    void popup.offsetWidth;

    // Add animation class based on side
    popup.classList.add(`animate-${side}`);

    if (popupTimeout) {
        clearTimeout(popupTimeout);
    }

    popupTimeout = setTimeout(() => {
        popup.classList.remove('animate-left', 'animate-right', 'animate-center');
        popupTimeout = null;
    }, 3000);
}

let localTimerInterval;
let localTimerSeconds = 0;
let isTimerPaused = false;
let isTimerExpired = false;

function updateTimerPopup(timerData) {
    const popup = document.getElementById('timerPopup');
    if (!popup) return;

    if (!timerData.active) {
        stopLocalTimer();
        popup.style.display = 'none';
        document.body.classList.remove('timer-active');
        return;
    }

    popup.style.display = 'flex';
    document.body.classList.add('timer-active');

    const label = document.getElementById('timerLabel');
    if (label) label.innerText = timerData.label || '';

    // Always sync on a message, but we expect fewer messages now
    localTimerSeconds = timerData.seconds;
    isTimerPaused = !!timerData.paused;
    isTimerExpired = !!timerData.expired;

    renderTimer();

    if (isTimerPaused || isTimerExpired) {
        stopLocalTimer();
    } else {
        startLocalTimer();
    }
}

function startLocalTimer() {
    if (localTimerInterval) return;
    localTimerInterval = setInterval(() => {
        if (localTimerSeconds > 0) {
            localTimerSeconds--;
            renderTimer();
        } else {
            stopLocalTimer();
            isTimerExpired = true;
            renderTimer();
        }
    }, 1000);
}

function stopLocalTimer() {
    if (localTimerInterval) {
        clearInterval(localTimerInterval);
        localTimerInterval = null;
    }
}

function renderTimer() {
    const popup = document.getElementById('timerPopup');
    if (!popup) return;

    const mins = Math.floor(localTimerSeconds / 60);
    const secs = localTimerSeconds % 60;

    document.getElementById('minTens').innerText = Math.floor(mins / 10);
    document.getElementById('minUnits').innerText = mins % 10;
    document.getElementById('secTens').innerText = Math.floor(secs / 10);
    document.getElementById('secUnits').innerText = secs % 10;

    popup.classList.toggle('paused', isTimerPaused);
    popup.classList.toggle('expired', isTimerExpired);
}

// Start the receiver with the configured options
context.start(options);
