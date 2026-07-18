import { gameState, loadState, updateState } from './state.js';
import { combatState, executeCombatTurn, logMessage, updateHPBars, validateTurnReadiness } from './combat.js';

function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => screen.classList.add('hidden'));

  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove('hidden');
    updateState({ currentScreen: screenId });
  }
}

function init() {
  loadState();
  if (gameState.playerName) {
    updateUI();
    showScreen(gameState.currentScreen === 'screen-registration' ? 'screen-home' : gameState.currentScreen);
  } else {
    showScreen('screen-registration');
  }
  setupEventListeners();
}

function updateUI() {
  const nameFields = ['home-player-name', 'settings-name', 'char-player-name'];
  nameFields.forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) el.tagName === 'INPUT' ? el.value = gameState.playerName : el.textContent = gameState.playerName;
  });

  const winsEl = document.getElementById('char-wins');
  const lossesEl = document.getElementById('char-losses');
  if (winsEl) winsEl.textContent = gameState.wins;
  if (lossesEl) lossesEl.textContent = gameState.losses;

  const currentAvatarImg = document.getElementById('char-current-avatar');
  if (currentAvatarImg) currentAvatarImg.src = gameState.playerAvatar || 'assets/avatars/ren1.png';

  document.querySelectorAll('.avatar-option').forEach(img => {
    img.getAttribute('data-avatar') === gameState.playerAvatar ? img.classList.add('selected') : img.classList.remove('selected');
  });
}

// Функція оновлення текстового індикатора вибору зон на екрані
function updateZonesIndicator() {
  const attackText = document.getElementById('indicator-attack');
  const defendText = document.getElementById('indicator-defend');
  
  if (attackText) {
    attackText.textContent = combatState.selectedAttackZone || 'None';
  }
  if (defendText) {
    defendText.textContent = combatState.selectedDefendZones.length > 0 
      ? combatState.selectedDefendZones.join(', ') 
      : 'None';
  }
}

// Обертка для перевірки готовності ходу з оновленням табла
function checkTurnReadiness() {
  validateTurnReadiness();
  updateZonesIndicator();
}

function setupEventListeners() {
  // --- РЕЄСТРАЦІЯ ТА НАВІГАЦІЯ ---
  const btnRegister = document.getElementById('btn-register');
  const regInput = document.getElementById('reg-name');

  btnRegister.addEventListener('click', () => {
    const name = regInput.value.trim();
    if (!name) return alert("Please enter your fighter's name!");
    updateState({ playerName: name });
    updateUI();
    showScreen('screen-home');
  });

  document.getElementById('btn-to-settings').addEventListener('click', () => {
    document.getElementById('settings-name').value = gameState.playerName;
    showScreen('screen-settings');
  });

  document.getElementById('btn-to-character').addEventListener('click', () => {
    updateUI();
    showScreen('screen-character');
  });

  document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', (e) => {
      updateState({ playerAvatar: e.target.getAttribute('data-avatar') });
      updateUI();
    });
  });

  document.querySelector('.btn-character-back').addEventListener('click', () => showScreen('screen-home'));

  // --- НАЛАШТУВАННЯ ---
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const newName = document.getElementById('settings-name').value.trim();
    if (!newName) return alert("Fighter's name cannot be empty!");
    updateState({ playerName: newName });
    updateUI();
    alert("Changes saved successfully! 💾");
  });

  document.getElementById('btn-reset-game').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all progress?")) {
      localStorage.clear();
      window.location.reload();
    }
  });

  document.querySelector('.btn-settings-back').addEventListener('click', () => showScreen('screen-home'));

  // --- ЕКРАН БОЮ ---
  const btnStartBattle = document.getElementById('btn-start-battle');
  const btnFightNow = document.getElementById('btn-fight-now');
  const btnBattleBack = document.querySelector('.btn-battle-back');
  const btnEndTurn = document.getElementById('btn-end-turn');
  const combatActions = document.getElementById('combat-actions');
  const enemySelectionBlock = document.querySelector('.enemy-selection');

  btnStartBattle.addEventListener('click', () => {
    document.getElementById('arena-player-avatar').src = gameState.playerAvatar || 'assets/avatars/ren.gif';
    document.getElementById('arena-player-name').textContent = gameState.playerName;
    document.getElementById('arena-enemy-avatar').src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22 x=%2215%22>❓</text></svg>';
    document.getElementById('arena-enemy-name').textContent = 'Choose Opponent';

    if (btnFightNow) {
      btnFightNow.style.display = 'block';
      btnFightNow.disabled = true;
      btnFightNow.style.opacity = '0.5';
    }

    // Динамічний вибір ворогів
    const enemyGrid = document.querySelector('.enemy-grid');
    if (enemyGrid) {
      enemyGrid.innerHTML = '';
      const allCharacters = [
        { name: 'Boss', avatar: 'assets/avatars/boss.gif' },
        { name: 'Cho', avatar: 'assets/avatars/cho.gif' },
        { name: 'Gal', avatar: 'assets/avatars/gal.gif' },
        { name: 'Jon', avatar: 'assets/avatars/jon.gif' },
        { name: 'Lodman', avatar: 'assets/avatars/lodman.gif' },
        { name: 'Ren', avatar: 'assets/avatars/ren.gif' },
        { name: 'Ryuken', avatar: 'assets/avatars/ryuken.gif' }
      ];

      allCharacters.filter(char => char.avatar !== gameState.playerAvatar).forEach(enemy => {
        const img = document.createElement('img');
        img.className = 'enemy-option';
        img.src = enemy.avatar;
        img.addEventListener('click', () => {
          document.getElementById('arena-enemy-avatar').src = enemy.avatar;
          document.getElementById('arena-enemy-name').textContent = enemy.name;
          document.querySelectorAll('.enemy-option').forEach(opt => opt.classList.remove('selected'));
          img.classList.add('selected');
          btnFightNow.disabled = false;
          btnFightNow.style.opacity = '1';
          btnFightNow.style.cursor = 'pointer';
        });
          enemyGrid.appendChild(img);
      });
    }
    showScreen('screen-battle');
  });

  // Натискання кнопки FIGHT!
  btnFightNow.addEventListener('click', () => {
    combatState.currentEnemyName = document.getElementById('arena-enemy-name').textContent;
    combatState.playerHP = 100;
    combatState.enemyHP = 100;
    updateHPBars();
    updateZonesIndicator();

    document.getElementById('battle-log').innerHTML = '';
    logMessage(`⚔️ Battle started! ${gameState.playerName} vs ${combatState.currentEnemyName}!`, 'system');

    enemySelectionBlock.classList.add('hidden');
    combatActions.classList.remove('hidden');
    btnFightNow.style.display = 'none';
    btnBattleBack.style.display = 'none';
  });

  // Обробники кліків по ТАКТИЧНИХ ЗОНАХ АТАКИ
  document.querySelectorAll('.btn-zone-attack').forEach(button => {
    button.addEventListener('click', () => {
      const zone = button.getAttribute('data-zone');
      if (combatState.selectedAttackZone === zone) {
        combatState.selectedAttackZone = '';
        button.classList.remove('selected-attack');
      } else {
        document.querySelectorAll('.btn-zone-attack').forEach(btn => btn.classList.remove('selected-attack'));
        combatState.selectedAttackZone = zone;
        button.classList.add('selected-attack');
      }
      checkTurnReadiness();
    });
  });

  // Обробники кліків по ЗОНАХ ЗАХИСТУ
  document.querySelectorAll('.btn-zone-defend').forEach(button => {
    button.addEventListener('click', () => {
      const zone = button.getAttribute('data-zone');
      const idx = combatState.selectedDefendZones.indexOf(zone);
      if (idx > -1) {
        combatState.selectedDefendZones.splice(idx, 1);
        button.classList.remove('selected-defend');
      } else {
        if (combatState.selectedDefendZones.length >= 2) return;
        combatState.selectedDefendZones.push(zone);
        button.classList.add('selected-defend');
      }
      checkTurnReadiness();
    });
  });

  // Кнопка EXECUTE TURN (Виконати хід)
  if (btnEndTurn) {
    btnEndTurn.addEventListener('click', () => {
      executeCombatTurn((isWin) => {
        // Callback-функція, яка спрацьовує при закінченні бою
        combatActions.classList.add('hidden');
        enemySelectionBlock.classList.remove('hidden');
        btnBattleBack.style.display = 'block';
        btnBattleBack.textContent = 'Return to Menu';
        
        updateState({ wins: gameState.wins + (isWin ? 1 : 0), losses: gameState.losses + (isWin ? 0 : 1) });
        updateUI();
      });
      // Оновлюємо табло після очищення вибору
      updateZonesIndicator();
    });
  }

  // Кнопка Назад з арени
  btnBattleBack.addEventListener('click', () => {
    enemySelectionBlock.classList.remove('hidden');
    combatActions.classList.add('hidden');
    btnFightNow.style.display = 'block';
    btnFightNow.disabled = true;
    btnFightNow.style.opacity = '0.5';
    
    document.querySelectorAll('.btn-zone-attack, .btn-zone-defend, .enemy-option').forEach(opt => {
      opt.classList.remove('selected', 'selected-attack', 'selected-defend');
    });
    
    combatState.selectedAttackZone = '';
    combatState.selectedDefendZones = [];
    checkTurnReadiness();
    btnBattleBack.textContent = 'Back to Menu';
    showScreen('screen-home');
  });
}

document.addEventListener('DOMContentLoaded', init);