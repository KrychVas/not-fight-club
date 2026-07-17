import { gameState, loadState, updateState } from './state.js';

// 1. Функція перемикання екранів
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.classList.add('hidden');
  });

  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove('hidden');
    updateState({ currentScreen: screenId });
  }
}

// 2. Ініціалізація гри при завантаженні сторінки
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

// 3. Оновлення інтерфейсу відповідно до стану (Ім'я, Статистика, Аватар)
function updateUI() {
  // Оновлюємо текстові поля з іменем
  const nameFields = ['home-player-name', 'settings-name', 'char-player-name'];
  nameFields.forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) {
      if (el.tagName === 'INPUT') {
        el.value = gameState.playerName;
      } else {
        el.textContent = gameState.playerName;
      }
    }
  });

  // Оновлюємо статистику перемог і поразок
  const winsEl = document.getElementById('char-wins');
  const lossesEl = document.getElementById('char-losses');
  if (winsEl) winsEl.textContent = gameState.wins;
  if (lossesEl) lossesEl.textContent = gameState.losses;

  // Оновлюємо поточний аватар на сторінці персонажа
  const currentAvatarImg = document.getElementById('char-current-avatar');
  if (currentAvatarImg) {
    currentAvatarImg.src = gameState.playerAvatar || 'assets/avatars/ren1.png';
  }

  // Підсвічуємо вибрану іконку в галереї аватарок
  const avatarOptions = document.querySelectorAll('.avatar-option');
  avatarOptions.forEach(img => {
    if (img.getAttribute('data-avatar') === gameState.playerAvatar) {
      img.classList.add('selected');
    } else {
      img.classList.remove('selected');
    }
  });
}

// 4. Обробка кліків та дій користувача
function setupEventListeners() {
  // --- ЕКРАН РЕЄСТРАЦІЇ ---
  const btnRegister = document.getElementById('btn-register');
  const regInput = document.getElementById('reg-name');

  btnRegister.addEventListener('click', () => {
    const name = regInput.value.trim();
    if (name === '') {
      alert("Please enter your fighter's name!");
      return;
    }
    updateState({ playerName: name });
    updateUI();
    showScreen('screen-home');
  });

  // --- НАВІГАЦІЯ З ГОЛОВНОГО ЕКРАНУ ---
  const btnToSettings = document.getElementById('btn-to-settings');
  const btnToCharacter = document.getElementById('btn-to-character');

  btnToSettings.addEventListener('click', () => {
    document.getElementById('settings-name').value = gameState.playerName;
    showScreen('screen-settings');
  });

  btnToCharacter.addEventListener('click', () => {
    updateUI(); // Оновлюємо картинки перед показом екрана
    showScreen('screen-character');
  });

  // --- ЕКРАН ПЕРСОНАЖА (Вибір аватарок) ---
  const avatarOptions = document.querySelectorAll('.avatar-option');
  avatarOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const selectedUrl = e.target.getAttribute('data-avatar');
      updateState({ playerAvatar: selectedUrl });
      updateUI();
    });
  });

  const btnCharacterBack = document.querySelector('.btn-character-back');
  if (btnCharacterBack) {
    btnCharacterBack.addEventListener('click', () => {
      showScreen('screen-home');
    });
  }

  // --- ЕКРАН НАЛАШТУВАНЬ ---
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnResetGame = document.getElementById('btn-reset-game');
  const btnSettingsBack = document.querySelector('.btn-settings-back');
  const settingsInput = document.getElementById('settings-name');

  btnSaveSettings.addEventListener('click', () => {
    const newName = settingsInput.value.trim();
    if (newName === '') {
      alert("Fighter's name cannot be empty!");
      return;
    }
    updateState({ playerName: newName });
    updateUI();
    alert("Changes saved successfully! 💾");
  });

  btnResetGame.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all progress? This will delete your character!")) {
      localStorage.clear();
      window.location.reload();
    }
  });

  btnSettingsBack.addEventListener('click', () => {
    showScreen('screen-home');
  });

// --- ЕКРАН БОЮ (ВИБІР СУПЕРНИКА ТА АКТИВНИЙ БІЙ) ---
  const btnStartBattle = document.getElementById('btn-start-battle');
  const btnFightNow = document.getElementById('btn-fight-now');
  const btnBattleBack = document.querySelector('.btn-battle-back');
  
  const btnAttack = document.getElementById('btn-attack');
  const btnDefend = document.getElementById('btn-defend');
  const combatActions = document.getElementById('combat-actions');
  const enemySelectionBlock = document.querySelector('.enemy-selection');
  const battleLog = document.getElementById('battle-log');

  // Змінні для збереження поточного HP в пам'яті
  let playerHP = 100;
  let enemyHP = 100;
  let currentEnemyName = '';
  let isPlayerDefending = false; // Чи стоїть гравець у блоці

  // Функція для додавання записів у лог бою
  function logMessage(text, type = 'system') {
    if (!battleLog) return;
    const msg = document.createElement('div');
    msg.className = `log-message log-${type}`;
    msg.textContent = text;
    battleLog.appendChild(msg);
    battleLog.scrollTop = battleLog.scrollHeight; // Автоскрол вниз
  }

  // Функція оновлення смужок HP на екрані
  function updateHPBars() {
    const pBar = document.getElementById('player-hp-bar');
    const pText = document.getElementById('player-hp-text');
    const eBar = document.getElementById('enemy-hp-bar');
    const eText = document.getElementById('enemy-hp-text');

    if (pBar && pText) {
      pBar.style.width = `${playerHP}%`;
      pText.textContent = `${playerHP} / 100`;
      pBar.className = 'hp-bar';
      if (playerHP <= 20) pBar.classList.add('danger');
      else if (playerHP <= 50) pBar.classList.add('warning');
    }

    if (eBar && eText) {
      eBar.style.width = `${enemyHP}%`;
      eText.textContent = `${enemyHP} / 100`;
      eBar.className = 'hp-bar';
      if (enemyHP <= 20) eBar.classList.add('danger');
      else if (enemyHP <= 50) eBar.classList.add('warning');
    }
  }

  // Клік на кнопку "Start Battle" на головному екрані
  if (btnStartBattle) {
    btnStartBattle.addEventListener('click', () => {
      // 1. Оновлюємо картку гравця на arena перед показом
      const arenaPlayerImg = document.getElementById('arena-player-avatar');
      const arenaPlayerName = document.getElementById('arena-player-name');
      
      if (arenaPlayerImg) arenaPlayerImg.src = gameState.playerAvatar || 'assets/avatars/ren.gif';
      if (arenaPlayerName) arenaPlayerName.textContent = gameState.playerName;

      // 2. Скидаємо картку ворога до дефолту
      const arenaEnemyImg = document.getElementById('arena-enemy-avatar');
      const arenaEnemyName = document.getElementById('arena-enemy-name');
      if (arenaEnemyImg) arenaEnemyImg.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22 x=%2215%22>❓</text></svg>';
      if (arenaEnemyName) arenaEnemyName.textContent = 'Choose Opponent';

      // 3. Блокуємо кнопку FIGHT!
      if (btnFightNow) {
        btnFightNow.style.display = 'block';
        btnFightNow.disabled = true;
        btnFightNow.style.opacity = '0.5';
        btnFightNow.style.cursor = 'not-allowed';
      }

      // --- ДИНАМІЧНЕ СТВОРЕННЯ СУПЕРНИКІВ БЕЗ ПОВТОРІВ ---
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

        const availableEnemies = allCharacters.filter(char => char.avatar !== gameState.playerAvatar);

        availableEnemies.forEach(enemy => {
          const img = document.createElement('img');
          img.className = 'enemy-option';
          img.src = enemy.avatar;
          img.alt = enemy.name;
          img.setAttribute('data-enemy-name', enemy.name);
          img.setAttribute('data-enemy-avatar', enemy.avatar);

          img.addEventListener('click', () => {
            if (arenaEnemyImg) arenaEnemyImg.src = enemy.avatar;
            if (arenaEnemyName) arenaEnemyName.textContent = enemy.name;

            document.querySelectorAll('.enemy-option').forEach(opt => opt.classList.remove('selected'));
            img.classList.add('selected');

            if (btnFightNow) {
              btnFightNow.disabled = false;
              btnFightNow.style.opacity = '1';
              btnFightNow.style.cursor = 'pointer';
            }
          });

          enemyGrid.appendChild(img);
        });
      }

      showScreen('screen-battle');
    });
  }

  // Натискання на кнопку FIGHT! (Початок бою)
  if (btnFightNow) {
    btnFightNow.addEventListener('click', () => {
      currentEnemyName = document.getElementById('arena-enemy-name').textContent;

      // 1. Скидаємо HP до 100%
      playerHP = 100;
      enemyHP = 100;
      isPlayerDefending = false;
      updateHPBars();

      // 2. Очищаємо лог і пишемо стартове повідомлення
      if (battleLog) battleLog.innerHTML = '';
      logMessage(`⚔️ Battle started! ${gameState.playerName} vs ${currentEnemyName}!`, 'system');

      // 3. Міняємо інтерфейс
      if (enemySelectionBlock) enemySelectionBlock.classList.add('hidden');
      if (combatActions) combatActions.classList.remove('hidden');
      
      btnFightNow.style.display = 'none';
      if (btnBattleBack) btnBattleBack.style.display = 'none'; // Ховаємо кнопку "Назад" на час бою
    });
  }

  // Функція для ходу ворога (ШІ)
  function enemyTurn() {
    if (enemyHP <= 0) return; // Якщо ворог уже програв, він не б'є

    setTimeout(() => {
      // Рандомний удар ворога від 8 до 18 демеджу
      let damage = Math.floor(Math.random() * 11) + 8; 

      if (isPlayerDefending) {
        damage = Math.floor(damage / 2); // Зменшуємо шкоду вдвічі, якщо гравець у блоці
        logMessage(`🛡️ ${gameState.playerName} blocks the attack! Damage reduced.`, 'player');
        isPlayerDefending = false; // Скидаємо блок після ходу
      }

      playerHP = Math.max(0, playerHP - damage);
      updateHPBars();
      logMessage(`💥 ${currentEnemyName} hits back for ${damage} HP!`, 'enemy');

      // Перевірка на програш гравця
      if (playerHP <= 0) {
        logMessage(`💀 You lost! ${currentEnemyName} celebrates victory.`, 'system');
        endBattle(false);
      }
    }, 800); // Невелика затримка для реалістичності покроковості
  }

  // Кнопка АТАКА
  if (btnAttack) {
    btnAttack.addEventListener('click', () => {
      const damage = Math.floor(Math.random() * 13) + 10; // 10-22 демеджу
      enemyHP = Math.max(0, enemyHP - damage);
      updateHPBars();
      logMessage(`👊 ${gameState.playerName} hits opponent for ${damage} HP!`, 'player');

      if (enemyHP <= 0) {
        logMessage(`🏆 VICTORY! ${gameState.playerName} defeated ${currentEnemyName}!`, 'system');
        endBattle(true);
      } else {
        enemyTurn(); // Якщо ворог живий, він б'є у відповідь
      }
    });
  }

  // Кнопка ЗАХИСТ
  if (btnDefend) {
    btnDefend.addEventListener('click', () => {
      isPlayerDefending = true;
      logMessage(`🛡️ ${gameState.playerName} prepares to defend next turn.`, 'player');
      enemyTurn(); 
    });
  }

   // Функція завершення бою
  function endBattle(isWin) {
    // 1. Ховаємо бойові кнопки
    if (combatActions) combatActions.classList.add('hidden');

    // 2. Повертаємо блок вибору ворогів, щоб можна було грати знову
    if (enemySelectionBlock) enemySelectionBlock.classList.remove('hidden');

    // 3. Повертаємо кнопку "Назад" та робимо її активною
    if (btnBattleBack) {
      btnBattleBack.style.display = 'block';
      btnBattleBack.textContent = 'Return to Menu';
    }

    // 4. Оновлюємо статистику в gameState
    if (isWin) {
      updateState({ wins: gameState.wins + 1 });
    } else {
      updateState({ losses: gameState.losses + 1 });
    }
    
    // Оновлюємо інтерфейс головного меню та картки персонажа новими даними
    updateUI(); 
  }

  // Кнопка назад з екрану бою в головне меню
  if (btnBattleBack) {
    btnBattleBack.addEventListener('click', () => {
      // 1. Повертаємо відображення блоку вибору ворогів
      if (enemySelectionBlock) enemySelectionBlock.classList.remove('hidden');
      
      // 2. Скидаємо кнопку FIGHT!: показуємо її, але блокуємо, поки не оберуть нового ворога
      if (btnFightNow) {
        btnFightNow.style.display = 'block';
        btnFightNow.disabled = true;
        btnFightNow.style.opacity = '0.5';
        btnFightNow.style.cursor = 'not-allowed';
      }
      
      // 3. Очищаємо підсвічування раніше обраного ворога в сітці
      document.querySelectorAll('.enemy-option').forEach(opt => opt.classList.remove('selected'));
      
      // 4. Скидаємо текст кнопки назад на дефолтний
      btnBattleBack.textContent = 'Back to Menu';
      
      // 5. Повертаємося на головний екран
      showScreen('screen-home');
    });
  } 
  }// Кінець функції setupEventListeners

// Запускаємо гру, коли DOM готовий
document.addEventListener('DOMContentLoaded', init);