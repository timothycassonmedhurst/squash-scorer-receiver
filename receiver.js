const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const CAST_NAMESPACE = 'urn:x-cast:com.medhurst.squashscorerplus';

// Customize player behavior to prevent timeout when video is playing
playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    loadRequestData => {
        if (loadRequestData.media && loadRequestData.media.contentId) {
            loadRequestData.media.streamType = cast.framework.messages.StreamType.BUFFERED;
        }
        return loadRequestData;
    }
);

// Set up receiver options to prevent timeout
const options = new cast.framework.CastReceiverOptions();
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
