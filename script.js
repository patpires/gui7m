// Configurações do jogo
const GAME_CONFIG = {
    totalErrors: 7,
    maxWrongAttempts: 10,
    errorRadius: 30, // Raio da área clicável em pixels
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

// Coordenadas dos erros (em porcentagem da imagem)
const errorPositions = [
    { id: 1, x: 15, y: 25, description: "Coelho verde no canto superior esquerdo" },
    { id: 2, x: 45, y: 20, description: "Ursinho marrom na área superior central" },
    { id: 3, x: 75, y: 25, description: "Nariz do coelho laranja no lado direito" },
    { id: 4, x: 85, y: 65, description: "Coelho branco no lado direito inferior" },
    { id: 5, x: 65, y: 45, description: "Patinho amarelo no centro-direita" },
    { id: 6, x: 25, y: 55, description: "Cesta de frutas no centro-esquerda" },
    { id: 7, x: 40, y: 75, description: "Laranja na parte inferior" }
];

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
        resetBtn: document.getElementById('reset-btn'),
        hintBtn: document.getElementById('hint-btn'),
        showAnswerBtn: document.getElementById('show-answer-btn'),
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
    elements.showAnswerBtn.addEventListener('click', showAnswer);
    elements.audioToggle.addEventListener('click', toggleAudio);
    
    // Modais
    elements.infoBtn.addEventListener('click', () => showModal(elements.infoModal));
    elements.closeModal.addEventListener('click', () => hideModal(elements.infoModal));
    elements.closeEndModal.addEventListener('click', () => hideModal(elements.gameEndModal));
    elements.playAgainBtn.addEventListener('click', () => {
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
    if (gameState.gameEnded) return;
    
    const rect = elements.interactiveImage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const clickedError = findErrorAtPosition(x, y);
    
    if (clickedError && !gameState.foundErrors.has(clickedError.id)) {
        handleCorrectClick(clickedError, event.clientX - rect.left, event.clientY - rect.top);
    } else {
        handleWrongClick(event.clientX - rect.left, event.clientY - rect.top);
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
    
    // Adicionar marcador visual
    addErrorMarker(error, clickX, clickY);
    
    // Feedback positivo
    showFeedback(`🎉 Erro ${gameState.errorsFound}/7 encontrado!`, 'success');
    playSound('success');
    
    // Animação de celebração
    elements.interactiveContainer.classList.add('celebrate');
    setTimeout(() => elements.interactiveContainer.classList.remove('celebrate'), 600);
    
    updateDisplay();
    
    // Verificar vitória
    if (gameState.errorsFound === GAME_CONFIG.totalErrors) {
        setTimeout(() => endGame(true), 1000);
    }
    
    // Anunciar para leitores de tela
    announceToScreenReader(`Erro encontrado: ${error.description}. ${gameState.errorsFound} de ${GAME_CONFIG.totalErrors} erros encontrados.`);
}

function handleWrongClick(clickX, clickY) {
    gameState.wrongAttempts++;
    
    // Feedback negativo
    showFeedback('❌ Tente novamente!', 'error');
    playSound('error');
    
    // Efeito visual de erro
    showWrongClickEffect(clickX, clickY);
    
    updateDisplay();
    
    // Verificar limite de tentativas
    if (gameState.wrongAttempts >= GAME_CONFIG.maxWrongAttempts) {
        setTimeout(() => endGame(false), 1000);
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

function showAnswer() {
    endGame(false, true);
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
    
    // Configurar modal de fim de jogo
    const successMessage = document.getElementById('success-message');
    const timeoutMessage = document.getElementById('timeout-message');
    
    if (victory) {
        successMessage.style.display = 'block';
        timeoutMessage.style.display = 'none';
        playSound('victory');
        
        // Efeito de celebração
        setTimeout(() => {
            createConfetti();
        }, 500);
    } else {
        successMessage.style.display = 'none';
        timeoutMessage.style.display = 'block';
    }
    
    // Mostrar modal após um breve delay
    setTimeout(() => {
        showModal(elements.gameEndModal);
        announceToScreenReader(victory ? 
            'Parabéns! Você encontrou todos os 7 erros!' : 
            'Fim de jogo. Veja onde estavam os erros.'
        );
    }, showAnswerRequested ? 0 : 1500);
}

function resetGame() {
    gameState = {
        errorsFound: 0,
        wrongAttempts: 0,
        gameEnded: false,
        hintsUsed: 0,
        lastHintTime: 0,
        foundErrors: new Set(),
        audioEnabled: gameState.audioEnabled
    };
    
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

