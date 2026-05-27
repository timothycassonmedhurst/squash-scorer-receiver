const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

const CAST_NAMESPACE = 'urn:x-cast:com.medhurst.squashscorerplus';

context.addCustomMessageListener(CAST_NAMESPACE, (event) => {
    console.log('Received message:', event.data);
    updateUI(event.data);
});

function updateUI(data) {
    if (typeof data === 'string') {
        data = JSON.parse(data);
    }

    document.getElementById('playerA').innerText = data.teamA || 'Player A';
    document.getElementById('playerB').innerText = data.teamB || 'Player B';
    document.getElementById('scoreA').innerText = data.scoreA;
    document.getElementById('scoreB').innerText = data.scoreB;

    // Handle serving indicator
    const serverSide = data.serverSide; // Left or Right
    const servingA = document.getElementById('servingA');
    const servingB = document.getElementById('servingB');

    servingA.classList.remove('visible');
    servingB.classList.remove('visible');

    // Simplistic logic: if Team A is serving, show on left.
    // In actual app, serverSide logic might be more complex depending on court position.
    // For the TV display, we usually just indicate WHO is serving.
    const isTeamAServing = data.server === data.playerA1 || data.server === data.playerA2;
    if (isTeamAServing) {
        servingA.classList.add('visible');
    } else {
        servingB.classList.add('visible');
    }

    // Update previous games
    const footer = document.getElementById('previousGames');
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

context.start();
