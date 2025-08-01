class Game {
    constructor() {
        this.timeLeft = 120;
        this.score = 0;
        this.towerHealth = 1000;
        this.isGameOver = false;
        this.timer = null;
        this.elixir = 10;
        this.maxElixir = 10;
        this.elixirRegenInterval = null;

        this.initializeElements();
        this.initializeEventListeners();
        this.startGame();
    }

    initializeElements() {
        this.timeElement = document.getElementById('time');
        this.scoreElement = document.getElementById('score');
        this.towerHealthElement = document.getElementById('tower-health');
        this.gameOverModal = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');
        this.cards = document.querySelectorAll('.card');
    }

    initializeEventListeners() {
        this.cards.forEach(card => {
            card.addEventListener('click', () => this.playCard(card));
            // 드래그 앤 드롭 이벤트
            card.addEventListener('dragstart', (e) => this.onDragStart(e, card));
            card.addEventListener('dragend', (e) => this.onDragEnd(e, card));
            // 툴팁 이벤트
            card.addEventListener('mouseenter', (e) => this.showCardTooltip(e, card));
            card.addEventListener('mousemove', (e) => this.moveCardTooltip(e));
            card.addEventListener('mouseleave', () => this.hideCardTooltip());
        });

        this.restartButton.addEventListener('click', () => this.restartGame());

        // 배틀필드 드롭 이벤트
        const battlefield = document.getElementById('battlefield');
        battlefield.addEventListener('dragover', (e) => this.onDragOver(e));
        battlefield.addEventListener('dragleave', (e) => this.onDragLeave(e));
        battlefield.addEventListener('drop', (e) => this.onDrop(e));
    }

    startGame() {
        this.timer = setInterval(() => this.updateTimer(), 1000);
        this.elixirRegenInterval = setInterval(() => this.regenerateElixir(), 1000);
    }

    updateTimer() {
        this.timeLeft--;
        this.timeElement.textContent = this.timeLeft;

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    regenerateElixir() {
        if (this.elixir < this.maxElixir) {
            this.elixir++;
            this.updateElixirDisplay();
        }
    }

    updateElixirDisplay() {
        const elixirBar = document.getElementById('elixir-bar');
        const elixirValue = document.getElementById('elixir-value');
        if (elixirBar) {
            elixirBar.style.width = (this.elixir / this.maxElixir * 100) + '%';
        }
        if (elixirValue) {
            elixirValue.textContent = this.elixir;
        }
    }

    playCard(card) {
        if (this.isGameOver) return;

        const cost = parseInt(card.querySelector('.card-cost').textContent);
        if (this.elixir >= cost) {
            this.elixir -= cost;
            this.updateElixirDisplay();
            this.deployCard(card.dataset.card);
        } else {
            // 엘릭서 부족 시 카드 흔들림 효과
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 400);
        }
    }

    onDragStart(e, card) {
        if (this.isGameOver) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('cardType', card.dataset.card);
        e.dataTransfer.setData('cardCost', card.querySelector('.card-cost').textContent);
        card.classList.add('dragging');
    }

    onDragEnd(e, card) {
        card.classList.remove('dragging');
    }

    onDragOver(e) {
        e.preventDefault();
        const battlefield = document.getElementById('battlefield');
        battlefield.classList.add('drag-over');
    }

    onDragLeave(e) {
        const battlefield = document.getElementById('battlefield');
        battlefield.classList.remove('drag-over');
    }

    onDrop(e) {
        e.preventDefault();
        const battlefield = document.getElementById('battlefield');
        battlefield.classList.remove('drag-over');
        const cardType = e.dataTransfer.getData('cardType');
        const cardCost = parseInt(e.dataTransfer.getData('cardCost'));
        // 드롭 위치 계산
        const rect = battlefield.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.playCardByDrop(cardType, cardCost, x, y);
    }

    playCardByDrop(cardType, cost, x, y) {
        if (this.isGameOver) return;
        if (this.elixir >= cost) {
            this.elixir -= cost;
            this.updateElixirDisplay();
            this.deployCardAt(cardType, x, y);
        } else {
            // 엘릭서 부족 시 카드 흔들림 효과
            const card = Array.from(this.cards).find(c => c.dataset.card === cardType);
            if (card) {
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 400);
            }
        }
    }

    deployCard(cardType) {
        const battlefield = document.querySelector('.battlefield');
        const card = document.createElement('div');
        card.className = `deployed-card ${cardType}`;
        
        // 카드 타입에 따른 데미지 설정
        let damage = 0;
        switch(cardType) {
            case 'witch':
                damage = 100;
                break;
            case 'prince':
                damage = 150;
                break;
            case 'log':
                damage = 50;
                break;
            case 'hog':
                damage = 120;
                break;
        }

        // 카드 배치 및 타워 공격 애니메이션
        card.style.left = '0';
        battlefield.appendChild(card);

        setTimeout(() => {
            this.attackTower(damage);
            battlefield.removeChild(card);
        }, 2000);
    }

    deployCardAt(cardType, x, y) {
        const battlefield = document.getElementById('battlefield');
        const tower = document.getElementById('enemy-tower');
        const card = document.createElement('div');
        card.className = `deployed-card ${cardType}`;
        card.style.left = (x - 30) + 'px';
        card.style.top = (y - 30) + 'px';

        // 타워(성) 위치 계산
        const bfRect = battlefield.getBoundingClientRect();
        const towerRect = tower.getBoundingClientRect();
        const endX = (towerRect.left + towerRect.width / 2) - bfRect.left - 30;
        const endY = (towerRect.top + towerRect.height / 2) - bfRect.top - 30;

        // 곡선 이동 및 흔들림 효과를 위한 동적 keyframes 생성
        const animName = `move-to-tower-${Date.now()}`;
        const styleSheet = document.createElement('style');
        styleSheet.innerHTML = `@keyframes ${animName} {\n0% { left: ${(x-30)}px; top: ${(y-30)}px; transform: rotate(-8deg) scale(1.1); }\n20% { transform: translateY(-30px) rotate(8deg) scale(1.13); }\n40% { transform: translateY(-50px) rotate(-6deg) scale(1.15); }\n60% { transform: translateY(-30px) rotate(6deg) scale(1.13); }\n80% { transform: translateY(-10px) rotate(-4deg) scale(1.1); }\n100% { left: ${endX}px; top: ${endY}px; transform: rotate(0deg) scale(1); }\n}`;
        document.head.appendChild(styleSheet);
        card.style.animation = `${animName} 2s cubic-bezier(0.6,1.5,0.4,1) forwards`;

        battlefield.appendChild(card);

        // 카드 타입에 따른 데미지 설정
        let damage = 0;
        switch(cardType) {
            case 'witch': damage = 100; break;
            case 'prince': damage = 150; break;
            case 'log': damage = 50; break;
            case 'hog': damage = 120; break;
        }

        setTimeout(() => {
            this.attackTower(damage);
            battlefield.removeChild(card);
            document.head.removeChild(styleSheet);
        }, 2000);
    }

    attackTower(damage) {
        this.towerHealth -= damage;
        this.towerHealthElement.textContent = this.towerHealth;
        this.score += damage;
        this.scoreElement.textContent = this.score;

        if (this.towerHealth <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.isGameOver = true;
        clearInterval(this.timer);
        clearInterval(this.elixirRegenInterval);
        
        this.finalScoreElement.textContent = this.score;
        this.gameOverModal.style.display = 'flex';
    }

    restartGame() {
        this.timeLeft = 120;
        this.score = 0;
        this.towerHealth = 1000;
        this.isGameOver = false;
        this.elixir = 10;

        this.timeElement.textContent = this.timeLeft;
        this.scoreElement.textContent = this.score;
        this.towerHealthElement.textContent = this.towerHealth;
        this.gameOverModal.style.display = 'none';

        this.startGame();
    }

    showCardTooltip(e, card) {
        const tooltip = document.getElementById('card-tooltip');
        tooltip.textContent = card.getAttribute('data-desc');
        tooltip.classList.add('active');
        this.moveCardTooltip(e);
    }

    moveCardTooltip(e) {
        const tooltip = document.getElementById('card-tooltip');
        tooltip.style.left = (e.clientX + 16) + 'px';
        tooltip.style.top = (e.clientY - 10) + 'px';
    }

    hideCardTooltip() {
        const tooltip = document.getElementById('card-tooltip');
        tooltip.classList.remove('active');
    }
}

// 게임 시작
window.onload = () => {
    new Game();
}; 