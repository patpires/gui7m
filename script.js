// Configurações do jogo
const GAME_CONFIG = {
    totalErrors: 7,
    maxWrongAttempts: 10,
    errorRadius: 50, // Raio da área clicável em pixels (aumentado para facilitar)
    hintCooldown: 10000, // 10 segundos entre dicas
    celebrationDuration: 2000
};

// Estado do jogo
let gameState = {
    errorsFound: 0,
    wrongAttempts: 0,
    gameEnded: false,
    hintsUsed: 0,
    lastHintTime: 0,
    foundErrors: new Set(),
    audioEnabled: false
};

// Coordenadas dos erros (em porcentagem da imagem) - baseadas n// Posições dos 7 erros na imagem (coordenadas em porcentagem)
// Baseado na imagem limpa com pontos vermelhos fornecida
const errorPositions = [
    { id: 1, x: 25, y: 8, description: "Seta vermelha no topo esquerdo" },
    { id: 2, x: 30, y: 25, description: "Círculo vermelho centro-esquerda superior" },
    { id: 3, x: 70, y: 18, description: "Círculo vermelho pequeno topo direita" },
    { id: 4, x: 92, y: 30, description: "Círculo vermelho direita superior" },
    { id: 5, x: 25, y: 65, description: "Círculo vermelho pequeno esquerda-centro" },
    { id: 6, x: 78, y: 45, description: "Círculo vermelho grande centro-direita" },
    { id: 7, x: 20, y: 78, description: "Círculo vermelho grande inferior esquerda" }
];;

// Elementos DOM
let elements = {};

// Inicialização do jogo
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    initializeGame();
    setupAccessibility();
});

function initializeElements() {
    elements = {
        interactiveImage: document.getElementById('interactive-image'),
        interactiveContainer: document.querySelector('.interactive-image-container'),
        errorsFoundSpan: document.getElementById('errors-found'),
        wrongAttemptsSpan: document.getElementById('wrong-attempts'),
        Btn: document.getElementById('-btn'),
        hintBtn: document.getElementById('hint-btn'),
        audioToggle: document.getElementById('audio-toggle'),
        backgroundMusic: document.getElementById('background-music'),
        infoBtn: document.getElementById('info-btn'),
        infoModal: document.getElementById('info-modal'),
        closeModal: document.getElementById('close-modal'),
        gameEndModal: document.getElementById('game-end-modal'),
        closeEndModal: document.getElementById('close-end-modal'),
        playAgainBtn: document.getElementById('play-again-btn'),
        feedback: document.getElementById('feedback'),
        gameStatus: document.querySelector('.game-status')
    };
}

function setupEventListeners() {
    // Clique na imagem interativa
    elements.interactiveImage.addEventListener('click', handleImageClick);
    
    // Botões de controle
    elements.resetBtn.addEventListener('click', resetGame);
    elements.hintBtn.addEventListener('click', showHint);
    elements.audioToggle.addEventListener('click', toggleAudio);
    
    // Modais
    elements.infoBtn.addEventListener('click', () => showModal(elements.infoModal));
    elements.closeModal.addEventListener('click', () => hideModal(elements.infoModal));
    elements.closeEndModal.addEventListener('click', () => hideModal(elements.gameEndModal));
    // Dentro da sua função setupEventListeners()
elements.playAgainBtn.addEventListener('click', () => {
    console.log("Botão 'Jogar Novamente' clicado!"); // LOG 3: Confirma que o clique foi registrado

    hideModal(elements.gameEndModal);
    resetGame();
});
    
    // Fechar modais clicando fora
    elements.infoModal.addEventListener('click', (e) => {
        if (e.target === elements.infoModal) hideModal(elements.infoModal);
    });
    elements.gameEndModal.addEventListener('click', (e) => {
        if (e.target === elements.gameEndModal) hideModal(elements.gameEndModal);
    });
    
    // Teclas de atalho
    document.addEventListener('keydown', handleKeyPress);
    
    // Redimensionamento da janela
    window.addEventListener('resize', debounce(updateErrorMarkers, 250));
}

function initializeGame() {
    resetGame();
    updateDisplay();
    
    // Aguardar carregamento da imagem
    if (elements.interactiveImage.complete) {
        setupErrorDetection();
    } else {
        elements.interactiveImage.addEventListener('load', setupErrorDetection);
    }
}

function setupErrorDetection() {
    // Configurar área clicável da imagem
    elements.interactiveImage.style.cursor = 'crosshair';
    
    // Adicionar indicador visual sutil
    elements.interactiveContainer.setAttribute('data-game-active', 'true');
}

function handleImageClick(event) {

console.log("Clique na imagem. O jogo terminou? Resposta:", gameState.gameEnded); // LOG 4: A verificação final

    // Se o jogo terminou, não faça nada
    if (gameState.gameEnded) {
        console.log("Ação de clique ignorada porque o jogo já terminou.");
        return;
    }

    
    
    
    
    const rect = elements.interactiveImage.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Verificar se o clique está dentro da imagem
    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) {
        return; // Clique fora da imagem
    }
    
    const x = (clickX / rect.width) * 100;
    const y = (clickY / rect.height) * 100;
    
    // Debug: mostrar coordenadas clicadas
    console.log(`Clique em: x=${x.toFixed(1)}%, y=${y.toFixed(1)}%`);
    console.log(`Dimensões da imagem: ${rect.width}x${rect.height}`);
    console.log(`Posição do clique: ${clickX}, ${clickY}`);
    
    const clickedError = findErrorAtPosition(x, y);
    
    if (clickedError) {
        console.log(`Erro encontrado: ${clickedError.id} - ${clickedError.description}`);
    }
    
    if (clickedError && !gameState.foundErrors.has(clickedError.id)) {
        handleCorrectClick(clickedError, clickX, clickY);
    } else {
        handleWrongClick(clickX, clickY);
    }
}

function findErrorAtPosition(x, y) {
    return errorPositions.find(error => {
        const distance = Math.sqrt(
            Math.pow(x - error.x, 2) + Math.pow(y - error.y, 2)
        );
        return distance <= (GAME_CONFIG.errorRadius / elements.interactiveImage.offsetWidth) * 100;
    });
}

function handleCorrectClick(error, clickX, clickY) {
    gameState.errorsFound++;
    gameState.foundErrors.add(error.id);
    
    // Efeitos visuais para acerto
    createRippleEffect(clickX, clickY);
    createSparkleParticles(clickX, clickY);
    
    // Adicionar marcador visual
    addErrorMarker(error, clickX, clickY);
    
    // Feedback positivo melhorado
    const messages = [
        `🎉 Excelente! Erro ${gameState.errorsFound}/7 encontrado!`,
        `⭐ Muito bem! Mais um erro descoberto!`,
        `🌟 Parabéns! Você está indo muito bem!`,
        `🎯 Perfeito! Continue assim!`,
        `✨ Fantástico! Erro encontrado!`
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showFeedback(randomMessage, 'success');
    
    // Efeito sonoro
    playSound('success');
    
    // Animação de celebração na imagem
    elements.interactiveContainer.classList.add('celebrate');
    setTimeout(() => elements.interactiveContainer.classList.remove('celebrate'), 600);
    
    // Efeito de progresso visual
    updateProgressIndicator();
    
    // Vibração em dispositivos móveis (se suportado)
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    updateDisplay();
    
    // Verificar vitória
    if (gameState.errorsFound === GAME_CONFIG.totalErrors) {
        setTimeout(() => {
            createVictoryFireworks();
            endGame(true);
        }, 1000);
    }
    
    // Anunciar para leitores de tela
    announceToScreenReader(`Erro encontrado: ${error.description}. ${gameState.errorsFound} de ${GAME_CONFIG.totalErrors} erros encontrados.`);
}

function handleWrongClick(clickX, clickY) {
    gameState.wrongAttempts++;
    
    // Efeitos visuais para erro
    createErrorEffect(clickX, clickY);
    
    // Feedback negativo melhorado
    const errorMessages = [
        '❌ Ops! Tente novamente!',
        '🔍 Quase lá! Continue procurando!',
        '💪 Não desista! Você consegue!',
        '🎯 Foque bem e tente de novo!',
        '🔎 Olhe com mais atenção!'
    ];
    const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    showFeedback(randomMessage, 'error');
    
    // Efeito sonoro
    playSound('error');
    
    // Efeito de vibração para erro (mais sutil)
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
    
    // Animação de shake na imagem
    elements.interactiveImage.style.animation = 'errorShake 0.6s ease-in-out';
    setTimeout(() => {
        elements.interactiveImage.style.animation = '';
    }, 600);
    
    updateDisplay();
    
    // Verificar limite de tentativas
    if (gameState.wrongAttempts >= GAME_CONFIG.maxWrongAttempts) {
        setTimeout(() => endGame(false), 1000);
    } else if (gameState.wrongAttempts >= GAME_CONFIG.maxWrongAttempts - 2) {
        // Aviso quando restam poucas tentativas
        showStatusMessage(`⚠️ Cuidado! Restam apenas ${GAME_CONFIG.maxWrongAttempts - gameState.wrongAttempts} tentativas!`);
    }
    
    // Anunciar para leitores de tela
    announceToScreenReader(`Tentativa incorreta. ${gameState.wrongAttempts} de ${GAME_CONFIG.maxWrongAttempts} tentativas erradas.`);
}

function addErrorMarker(error, x, y) {
    const marker = document.createElement('div');
    marker.className = 'error-marker';
    marker.textContent = gameState.errorsFound;
    marker.style.left = `${x - 15}px`;
    marker.style.top = `${y - 15}px`;
    marker.setAttribute('aria-label', `Erro ${gameState.errorsFound} encontrado: ${error.description}`);
    
    elements.interactiveContainer.appendChild(marker);
    
    // Animação de entrada
    setTimeout(() => marker.style.animation = 'pulse 1s infinite', 100);
}

function showWrongClickEffect(x, y) {
    const effect = document.createElement('div');
    effect.className = 'wrong-click-effect';
    effect.style.cssText = `
        position: absolute;
        left: ${x - 20}px;
        top: ${y - 20}px;
        width: 40px;
        height: 40px;
        border: 3px solid #FF6B6B;
        border-radius: 50%;
        pointer-events: none;
        animation: wrongClick 0.8s ease-out forwards;
        z-index: 100;
    `;
    
    // Adicionar animação CSS se não existir
    if (!document.querySelector('#wrong-click-animation')) {
        const style = document.createElement('style');
        style.id = 'wrong-click-animation';
        style.textContent = `
            @keyframes wrongClick {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    elements.interactiveContainer.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function showHint() {
    const now = Date.now();
    if (now - gameState.lastHintTime < GAME_CONFIG.hintCooldown) {
        const remainingTime = Math.ceil((GAME_CONFIG.hintCooldown - (now - gameState.lastHintTime)) / 1000);
        showFeedback(`💡 Próxima dica em ${remainingTime}s`, 'info');
        return;
    }
    
    const unfoundErrors = errorPositions.filter(error => !gameState.foundErrors.has(error.id));
    if (unfoundErrors.length === 0) return;
    
    const randomError = unfoundErrors[Math.floor(Math.random() * unfoundErrors.length)];
    
    // Mostrar dica visual temporária
    showHintMarker(randomError);
    
    gameState.hintsUsed++;
    gameState.lastHintTime = now;
    
    showFeedback(`💡 Dica: ${randomError.description}`, 'info');
    announceToScreenReader(`Dica: procure por ${randomError.description}`);
}

function showHintMarker(error) {
    const rect = elements.interactiveImage.getBoundingClientRect();
    const x = (error.x / 100) * elements.interactiveImage.offsetWidth;
    const y = (error.y / 100) * elements.interactiveImage.offsetHeight;
    
    const hint = document.createElement('div');
    hint.className = 'hint-marker';
    hint.style.cssText = `
        position: absolute;
        left: ${x - 25}px;
        top: ${y - 25}px;
        width: 50px;
        height: 50px;
        border: 4px dashed #FFD700;
        border-radius: 50%;
        pointer-events: none;
        animation: hintPulse 2s ease-in-out;
        z-index: 50;
    `;
    
    // Adicionar animação CSS se não existir
    if (!document.querySelector('#hint-animation')) {
        const style = document.createElement('style');
        style.id = 'hint-animation';
        style.textContent = `
            @keyframes hintPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.2); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    elements.interactiveContainer.appendChild(hint);
    setTimeout(() => hint.remove(), 2000);
}

function endGame(victory, showAnswerRequested = false) {
    gameState.gameEnded = true;
    
    // Mostrar todos os erros não encontrados
    errorPositions.forEach(error => {
        if (!gameState.foundErrors.has(error.id)) {
            const rect = elements.interactiveImage.getBoundingClientRect();
            const x = (error.x / 100) * elements.interactiveImage.offsetWidth;
            const y = (error.y / 100) * elements.interactiveImage.offsetHeight;
            addErrorMarker(error, x, y);
        }
    });
    
    // Configurar modal de fim de jogo baseado no resultado
    const successMessage = document.getElementById('success-message');
    const timeoutMessage = document.getElementById('timeout-message');
    
    if (victory) {
        // Configurar mensagem de vitória
        successMessage.style.display = 'block';
        timeoutMessage.style.display = 'none';
        
        // Atualizar título do modal para vitória
        const modalTitle = elements.gameEndModal.querySelector('h2');
        if (modalTitle) {
            modalTitle.textContent = '🎉 Parabéns!';
            modalTitle.style.color = '#4CAF50';
        }
        
        playSound('victory');
        
        // Efeito de celebração
        setTimeout(() => {
            createConfetti();
        }, 500);
    } else {
        // Configurar mensagem de derrota
        successMessage.style.display = 'none';
        timeoutMessage.style.display = 'block';
        
        // Atualizar título do modal para derrota
        const modalTitle = elements.gameEndModal.querySelector('h2');
        if (modalTitle) {
            modalTitle.textContent = '😔 Que pena!';
            modalTitle.style.color = '#F44336';
        }
        
        playSound('defeat');
    }
    
    // Mostrar modal após um breve delay
    setTimeout(() => {
        showModal(elements.gameEndModal);
        announceToScreenReader(victory ? 
            'Parabéns! Você encontrou todos os 7 erros!' : 
            'Fim de jogo. Você esgotou suas tentativas. Veja onde estavam os erros.'
        );
    }, showAnswerRequested ? 0 : 1500);
}

function resetGame() {
    console.log("Função resetGame() chamada."); // LOG 1: Confirma que a função foi chamada

    // 1. Redefinir o estado do jogo
    gameState = {
        errorsFound: 0,
        wrongAttempts: 0,
        gameEnded: false, // <-- PONTO MAIS CRÍTICO!
        hintsUsed: 0,
        lastHintTime: 0,
        foundErrors: new Set(),
        audioEnabled: gameState.audioEnabled // Mantém a preferência de áudio do usuário
    };
    
    // 2. Remover todos os marcadores visuais do jogo anterior
    document.querySelectorAll('.error-marker, .hint-marker, .wrong-click-effect').forEach(el => el.remove());
    
    // 3. Garantir que a imagem seja clicável novamente
    // Pode haver um estilo CSS que desativa cliques no fim do jogo
    elements.interactiveImage.style.pointerEvents = 'auto';
    elements.interactiveContainer.classList.remove('game-over-overlay'); // Se você usa uma classe de overlay
    
    // 4. Atualizar a interface do usuário para os valores iniciais
    updateDisplay();
    
    // 5. Anunciar para leitores de tela que o jogo recomeçou
    announceToScreenReader('Jogo reiniciado. Encontre os 7 erros na imagem da direita.');

    console.log("Estado do jogo após o reset:", gameState); // LOG 2: Verifica se gameEnded é false
}
    
    // Remover marcadores existentes
    document.querySelectorAll('.error-marker, .hint-marker, .wrong-click-effect').forEach(el => el.remove());
    
    updateDisplay();
    announceToScreenReader('Jogo reiniciado. Encontre os 7 erros na imagem da direita.');
}

function updateDisplay() {
    elements.errorsFoundSpan.textContent = gameState.errorsFound;
    elements.wrongAttemptsSpan.textContent = gameState.wrongAttempts;
    
    // Atualizar cores baseadas no progresso
    const progressPercentage = (gameState.errorsFound / GAME_CONFIG.totalErrors) * 100;
    elements.gameStatus.style.background = `linear-gradient(90deg, 
        var(--soft-mint) 0%, 
        var(--soft-peach) ${progressPercentage}%, 
        var(--text-light) ${progressPercentage}%)`;
}

function showFeedback(message, type = 'info') {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback ${type}`;
    elements.feedback.style.display = 'block';
    
    setTimeout(() => {
        elements.feedback.style.display = 'none';
    }, 2000);
}

function toggleAudio() {
    gameState.audioEnabled = !gameState.audioEnabled;
    
    if (gameState.audioEnabled) {
        elements.backgroundMusic.play().catch(e => {
            console.log('Não foi possível reproduzir o áudio:', e);
            gameState.audioEnabled = false;
        });
        elements.audioToggle.textContent = '🔊 Música';
        elements.audioToggle.setAttribute('aria-label', 'Desativar música de fundo');
    } else {
        elements.backgroundMusic.pause();
        elements.audioToggle.textContent = '🔇 Música';
        elements.audioToggle.setAttribute('aria-label', 'Ativar música de fundo');
    }
}

function playSound(type) {
    if (!gameState.audioEnabled) return;
    
    // Criar sons sintéticos para feedback
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
        case 'success':
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            break;
        case 'error':
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
            oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.1); // G3
            break;
        case 'victory':
            // Sequência de vitória mais longa
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, index) => {
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.15);
            });
            break;
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function showModal(modal) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    
    // Focar no primeiro elemento focável
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

function hideModal(modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

function handleKeyPress(event) {
    switch (event.key) {
        case 'Escape':
            // Fechar modais abertos
            if (elements.infoModal.style.display === 'block') {
                hideModal(elements.infoModal);
            }
            if (elements.gameEndModal.style.display === 'block') {
                hideModal(elements.gameEndModal);
            }
            break;
        case 'r':
        case 'R':
            if (event.ctrlKey || event.metaKey) return; // Não interferir com refresh
            resetGame();
            break;
        case 'h':
        case 'H':
            showHint();
            break;
        case 'm':
        case 'M':
            toggleAudio();
            break;
    }
}

function setupAccessibility() {
    // Configurar navegação por teclado
    elements.interactiveImage.setAttribute('tabindex', '0');
    elements.interactiveImage.setAttribute('role', 'button');
    elements.interactiveImage.setAttribute('aria-label', 'Imagem interativa do jogo dos 7 erros. Use as setas para navegar e Enter para clicar.');
    
    // Adicionar suporte a navegação por teclado na imagem
    let focusX = 50, focusY = 50; // Posição inicial do foco (centro)
    
    elements.interactiveImage.addEventListener('keydown', (event) => {
        if (gameState.gameEnded) return;
        
        const step = 5; // Passo de movimento em porcentagem
        
        switch (event.key) {
            case 'ArrowUp':
                focusY = Math.max(0, focusY - step);
                event.preventDefault();
                break;
            case 'ArrowDown':
                focusY = Math.min(100, focusY + step);
                event.preventDefault();
                break;
            case 'ArrowLeft':
                focusX = Math.max(0, focusX - step);
                event.preventDefault();
                break;
            case 'ArrowRight':
                focusX = Math.min(100, focusX + step);
                event.preventDefault();
                break;
            case 'Enter':
            case ' ':
                // Simular clique na posição atual do foco
                const rect = elements.interactiveImage.getBoundingClientRect();
                const clickX = (focusX / 100) * rect.width;
                const clickY = (focusY / 100) * rect.height;
                
                const mockEvent = {
                    clientX: rect.left + clickX,
                    clientY: rect.top + clickY
                };
                
                handleImageClick(mockEvent);
                event.preventDefault();
                break;
        }
        
        // Atualizar indicador visual de foco (se necessário)
        updateFocusIndicator(focusX, focusY);
    });
}

function updateFocusIndicator(x, y) {
    // Remover indicador anterior
    const existingIndicator = document.querySelector('.focus-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    // Criar novo indicador
    const indicator = document.createElement('div');
    indicator.className = 'focus-indicator';
    indicator.style.cssText = `
        position: absolute;
        left: ${(x / 100) * elements.interactiveImage.offsetWidth - 10}px;
        top: ${(y / 100) * elements.interactiveImage.offsetHeight - 10}px;
        width: 20px;
        height: 20px;
        border: 2px solid #FFD700;
        border-radius: 50%;
        pointer-events: none;
        z-index: 200;
        animation: focusPulse 1s infinite;
    `;
    
    // Adicionar animação se não existir
    if (!document.querySelector('#focus-animation')) {
        const style = document.createElement('style');
        style.id = 'focus-animation';
        style.textContent = `
            @keyframes focusPulse {
                0%, 100% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
    
    elements.interactiveContainer.appendChild(indicator);
}

function updateErrorMarkers() {
    // Reposicionar marcadores após redimensionamento
    const markers = document.querySelectorAll('.error-marker');
    markers.forEach((marker, index) => {
        const errorId = parseInt(marker.textContent);
        const error = errorPositions.find(e => gameState.foundErrors.has(e.id) && 
            Array.from(gameState.foundErrors).indexOf(e.id) + 1 === errorId);
        
        if (error) {
            const x = (error.x / 100) * elements.interactiveImage.offsetWidth;
            const y = (error.y / 100) * elements.interactiveImage.offsetHeight;
            marker.style.left = `${x - 15}px`;
            marker.style.top = `${y - 15}px`;
        }
    });
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

function createConfetti() {
    const colors = ['#FF8C42', '#8FBC8F', '#FFD700', '#FF6B6B', '#9B59B6'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            z-index: 10000;
            pointer-events: none;
            animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
    
    // Adicionar animação de confetti se não existir
    if (!document.querySelector('#confetti-animation')) {
        const style = document.createElement('style');
        style.id = 'confetti-animation';
        style.textContent = `
            @keyframes confettiFall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Função utilitária para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}



// Funções para efeitos visuais aprimorados

function createRippleEffect(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x - 25}px`;
    ripple.style.top = `${y - 25}px`;
    ripple.style.width = '50px';
    ripple.style.height = '50px';
    
    elements.interactiveContainer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);
}

function createSparkleParticles(centerX, centerY) {
    const colors = ['#FFD700', '#FF8C42', '#8FBC8F', '#FF6B6B', '#9B59B6'];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'sparkle-particle';
        
        const angle = (360 / particleCount) * i;
        const distance = 30 + Math.random() * 20;
        const x = centerX + Math.cos(angle * Math.PI / 180) * distance;
        const y = centerY + Math.sin(angle * Math.PI / 180) * distance;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDelay = `${i * 0.1}s`;
        
        elements.interactiveContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

function createErrorEffect(x, y) {
    const errorEffect = document.createElement('div');
    errorEffect.className = 'error-effect';
    errorEffect.style.left = `${x - 20}px`;
    errorEffect.style.top = `${y - 20}px`;
    
    elements.interactiveContainer.appendChild(errorEffect);
    setTimeout(() => errorEffect.remove(), 800);
}

function createVictoryFireworks() {
    const fireworksContainer = document.createElement('div');
    fireworksContainer.className = 'victory-celebration';
    document.body.appendChild(fireworksContainer);
    
    const colors = ['#FFD700', '#FF8C42', '#8FBC8F', '#FF6B6B', '#9B59B6', '#00BCD4'];
    const fireworkCount = 20;
    
    for (let i = 0; i < fireworkCount; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'victory-firework';
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.background = colors[Math.floor(Math.random() * colors.length)];
            firework.style.animationDelay = `${Math.random() * 0.5}s`;
            
            fireworksContainer.appendChild(firework);
            setTimeout(() => firework.remove(), 2000);
        }, i * 100);
    }
    
    setTimeout(() => fireworksContainer.remove(), 3000);
}

function updateProgressIndicator() {
    let progressBar = document.querySelector('.progress-indicator');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'progress-indicator';
        elements.gameStatus.appendChild(progressBar);
    }
    
    const progressPercentage = (gameState.errorsFound / GAME_CONFIG.totalErrors) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}

function showStatusMessage(message) {
    let statusMsg = document.querySelector('.status-message');
    if (!statusMsg) {
        statusMsg = document.createElement('div');
        statusMsg.className = 'status-message';
        document.body.appendChild(statusMsg);
    }
    
    statusMsg.textContent = message;
    statusMsg.style.display = 'block';
    
    setTimeout(() => {
        statusMsg.style.display = 'none';
    }, 3000);
}

function showHintEffect(error) {
    const rect = elements.interactiveImage.getBoundingClientRect();
    const x = (error.x / 100) * elements.interactiveImage.offsetWidth;
    const y = (error.y / 100) * elements.interactiveImage.offsetHeight;
    
    const hintEffect = document.createElement('div');
    hintEffect.className = 'click-hint';
    hintEffect.style.left = `${x - 30}px`;
    hintEffect.style.top = `${y - 30}px`;
    hintEffect.style.width = '60px';
    hintEffect.style.height = '60px';
    
    elements.interactiveContainer.appendChild(hintEffect);
    setTimeout(() => hintEffect.remove(), 3000);
}

// Atualizar função showHint para usar o novo efeito visual
function showHint() {
    const now = Date.now();
    if (now - gameState.lastHintTime < GAME_CONFIG.hintCooldown) {
        const remainingTime = Math.ceil((GAME_CONFIG.hintCooldown - (now - gameState.lastHintTime)) / 1000);
        showFeedback(`💡 Próxima dica em ${remainingTime}s`, 'hint');
        return;
    }
    
    const unfoundErrors = errorPositions.filter(error => !gameState.foundErrors.has(error.id));
    if (unfoundErrors.length === 0) return;
    
    const randomError = unfoundErrors[Math.floor(Math.random() * unfoundErrors.length)];
    
    // Mostrar dica visual temporária melhorada
    showHintEffect(randomError);
    
    gameState.hintsUsed++;
    gameState.lastHintTime = now;
    
    const hintMessages = [
        `💡 Dica: ${randomError.description}`,
        `🔍 Procure por: ${randomError.description}`,
        `👀 Observe: ${randomError.description}`,
        `🎯 Foque em: ${randomError.description}`
    ];
    const randomHintMessage = hintMessages[Math.floor(Math.random() * hintMessages.length)];
    
    showFeedback(randomHintMessage, 'hint');
    announceToScreenReader(`Dica: procure por ${randomError.description}`);
}

// Melhorar função showFeedback
function showFeedback(message, type = 'info') {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback ${type}`;
    elements.feedback.style.display = 'block';
    
    // Duração baseada no tipo
    const duration = type === 'success' ? 3000 : type === 'error' ? 2500 : 2000;
    
    setTimeout(() => {
        elements.feedback.style.display = 'none';
    }, duration);
}

// Melhorar função updateDisplay
function updateDisplay() {
    elements.errorsFoundSpan.textContent = gameState.errorsFound;
    elements.wrongAttemptsSpan.textContent = gameState.wrongAttempts;
    
    // Atualizar cores baseadas no progresso
    const progressPercentage = (gameState.errorsFound / GAME_CONFIG.totalErrors) * 100;
    elements.gameStatus.style.background = `linear-gradient(90deg, 
        var(--soft-mint) 0%, 
        var(--soft-peach) ${progressPercentage}%, 
        var(--text-light) ${progressPercentage}%)`;
    
    // Adicionar classe de destaque quando próximo do limite
    if (gameState.wrongAttempts >= GAME_CONFIG.maxWrongAttempts - 3) {
        elements.wrongAttemptsSpan.style.color = 'var(--primary-red)';
        elements.wrongAttemptsSpan.style.fontWeight = 'bold';
    } else {
        elements.wrongAttemptsSpan.style.color = '';
        elements.wrongAttemptsSpan.style.fontWeight = '';
    }
    
    // Atualizar indicador de progresso
    updateProgressIndicator();
}

