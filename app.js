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
}

// Запускаємо гру, коли DOM готовий
document.addEventListener('DOMContentLoaded', init);