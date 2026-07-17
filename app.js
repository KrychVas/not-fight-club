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

  // --- ЕКРАН БОЮ (ВИБІР СУПЕРНИКА) ---
  const btnStartBattle = document.getElementById('btn-start-battle');
  const btnFightNow = document.getElementById('btn-fight-now');
  const btnBattleBack = document.querySelector('.btn-battle-back');

  // Клік на кнопку "Start Battle" на головному екрані
  if (btnStartBattle) {
    btnStartBattle.addEventListener('click', () => {
      // 1. Оновлюємо картку гравця на арені перед показом
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
        btnFightNow.disabled = true;
        btnFightNow.style.opacity = '0.5';
        btnFightNow.style.cursor = 'not-allowed';
      }

      // --- ДИНАМІЧНЕ СТВОРЕННЯ СУПЕРНИКІВ БЕЗ ПОВТОРІВ ---
      const enemyGrid = document.querySelector('.enemy-grid');
      if (enemyGrid) {
        enemyGrid.innerHTML = ''; // Очищаємо сітку перед кожним входом

        // Повний список усіх 7 персонажів у грі
        const allCharacters = [
          { name: 'Boss', avatar: 'assets/avatars/boss.gif' },
          { name: 'Cho', avatar: 'assets/avatars/cho.gif' },
          { name: 'Gal', avatar: 'assets/avatars/gal.gif' },
          { name: 'Jon', avatar: 'assets/avatars/jon.gif' },
          { name: 'Lodman', avatar: 'assets/avatars/lodman.gif' },
          { name: 'Ren', avatar: 'assets/avatars/ren.gif' },
          { name: 'Ryuken', avatar: 'assets/avatars/ryuken.gif' }
        ];

        // Фільтруємо список: залишаємо лише тих, чий аватар НЕ збігається з аватаром гравця
        const availableEnemies = allCharacters.filter(char => char.avatar !== gameState.playerAvatar);

        // Перебираємо відфільтрованих ворогів і додаємо їх у HTML
        availableEnemies.forEach(enemy => {
          const img = document.createElement('img');
          img.className = 'enemy-option';
          img.src = enemy.avatar;
          img.alt = enemy.name;
          img.setAttribute('data-enemy-name', enemy.name);
          img.setAttribute('data-enemy-avatar', enemy.avatar);

          // Одразу вішаємо подію кліку на новоствореного ворога
          img.addEventListener('click', () => {
            if (arenaEnemyImg) arenaEnemyImg.src = enemy.avatar;
            if (arenaEnemyName) arenaEnemyName.textContent = enemy.name;

            // Підсвічування обраного ворога
            document.querySelectorAll('.enemy-option').forEach(opt => opt.classList.remove('selected'));
            img.classList.add('selected');

            // Активація кнопки битви
            if (btnFightNow) {
              btnFightNow.disabled = false;
              btnFightNow.style.opacity = '1';
              btnFightNow.style.cursor = 'pointer';
            }
          });

          enemyGrid.appendChild(img);
        });
      }

      // Перемикаємося на екран бою
      showScreen('screen-battle');
    });
  }

  // Кнопка назад з екрану бою в головне меню (Тепер вона працює ЗАВЖДИ незалежно)
  if (btnBattleBack) {
    btnBattleBack.addEventListener('click', () => {
      showScreen('screen-home');
    });
  }

  // Кнопка FIGHT!
  if (btnFightNow) {
    btnFightNow.addEventListener('click', () => {
      alert(`ROUND 1... FIGHT! 👊 `);
    });
  }
} // Кінець функції setupEventListeners

// Запускаємо гру, коли DOM готовий
document.addEventListener('DOMContentLoaded', init);