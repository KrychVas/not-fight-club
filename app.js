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
    // Оновлюємо поточний екран у стані та зберігаємо
    updateState({ currentScreen: screenId });
  }
}

// 2. Ініціалізація гри при завантаженні сторінки
function init() {
  loadState();

  // Якщо ім'я гравця вже збережене, скеровуємо на останній активний екран
  if (gameState.playerName) {
    updateUI();
    showScreen(gameState.currentScreen === 'screen-registration' ? 'screen-home' : gameState.currentScreen);
  } else {
    showScreen('screen-registration');
  }

  setupEventListeners();
}

// 3. Оновлення текстових полів на екранах відповідно до стану
function updateUI() {
  const nameFields = ['home-player-name', 'settings-name'];
  
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
    // Перед показом екрану налаштувань, запишемо поточне ім'я в інпут
    document.getElementById('settings-name').value = gameState.playerName;
    showScreen('screen-settings');
  });

  btnToCharacter.addEventListener('click', () => {
    showScreen('screen-character');
  });

  // --- ЕКРАН НАЛАШТУВАНЬ ---
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnResetGame = document.getElementById('btn-reset-game');
  const btnSettingsBack = document.querySelector('.btn-settings-back');
  const settingsInput = document.getElementById('settings-name');

  // Збереження нового імені
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

  // Повна очистка прогресу (Reset)
  btnResetGame.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all progress? This will delete your character!")) {
      localStorage.clear();
      // Перезавантажуємо сторінку, щоб скинути всі змінні в коді
      window.location.reload();
    }
  });

  // Кнопка назад з налаштувань
  btnSettingsBack.addEventListener('click', () => {
    showScreen('screen-home');
  });
}

// Запускаємо гру, коли DOM готовий
document.addEventListener('DOMContentLoaded', init);