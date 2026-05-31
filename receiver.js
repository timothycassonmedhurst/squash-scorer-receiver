const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const CAST_NAMESPACE = 'urn:x-cast:com.medhurst.squashscorerplus';

// Set up receiver options to prevent timeout
const options = new cast.framework.CastReceiverOptions();

// disableIdleTimeout is the most critical setting for a non-media dashboard.
// By default, the receiver shuts down after 5 minutes of inactivity if no media is playing.
options.disableIdleTimeout = true;

// maxInactivity defines how long (in seconds) the receiver waits for an unresponsive sender.
options.maxInactivity = 86400;

// Enable debug logging to see internal framework activity in the console (via chrome://inspect)
context.setLoggerLevel(cast.framework.LoggerLevel.DEBUG);

// Catch the moment the system decides to shut down the app
context.addEventListener(cast.framework.system.EventType.SHUTDOWN, (event) => {
    console.log('### DIAGNOSTIC: SHUTDOWN EVENT RECEIVED');
});

// Track visibility to see if the HDMI input/device is going to sleep
context.addEventListener(cast.framework.system.EventType.VISIBILITY_CHANGED, (event) => {
    console.log('### DIAGNOSTIC: VISIBILITY CHANGED:', event.isVisible);
});

context.addEventListener(cast.framework.events.EventType.SENDER_CONNECTED, (event) => {
    console.log('### DIAGNOSTIC: SENDER CONNECTED:', event.senderId);
});

context.addEventListener(cast.framework.events.EventType.SENDER_DISCONNECTED, (event) => {
    console.log('### DIAGNOSTIC: SENDER DISCONNECTED:', event.senderId, 'Reason:', event.reason);
});

function updateUI(data) {
    if (!data) return;

    // Helper to safely set text
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = (val !== undefined && val !== null) ? val : (id.startsWith('score') ? '-' : '');
        }
    };

    setText('playerA', data.teamA);
    setText('playerB', data.teamB);
    setText('scoreA', data.scoreA);
    setText('scoreB', data.scoreB);
    setText('matchDuration', data.matchDuration);

    // Handle serving indicator
    const servingA = document.getElementById('servingA');
    const servingB = document.getElementById('servingB');

    if (servingA && servingB) {
        servingA.classList.remove('visible');
        servingB.classList.remove('visible');

        if (data.server) {
            const server = data.server.trim().toLowerCase();
            const pA1 = data.playerA1 ? data.playerA1.trim().toLowerCase() : '';
            const pA2 = data.playerA2 ? data.playerA2.trim().toLowerCase() : '';

            const isTeamAServing = (server === pA1 || (pA2 && server === pA2));

            if (isTeamAServing) {
                servingA.classList.add('visible');
            } else {
                servingB.classList.add('visible');
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

// Start the receiver with the configured options
context.start(options);
