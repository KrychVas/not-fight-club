import { ARTIFACTS_DATABASE } from './artifacts.js';

const STORAGE_KEY = 'not-fight-club-state';

// Початковий стан гри
const defaultState = {
  playerName: '',
  playerAvatar: 'assets/avatars/ren.gif',
  wins: 0,
  losses: 0,
  currentScreen: 'screen-registration',

  gold: 250,
  
  // Додаємо ВСІ артефакти з нашої бази даних в інвентар
  artifacts: Object.keys(ARTIFACTS_DATABASE), 
  
  equippedArtifacts: {
    weapon: null,
    armor: null,
    helmet: null,
    boots: null,
    ring: null
  }
};

export let gameState = { ...defaultState };

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameState = { ...defaultState, ...parsed };
      // Гарантуємо, що нові артефакти з бази підтягнуться, якщо масив був застарілим
      if (!gameState.artifacts || gameState.artifacts.length < 10) {
        gameState.artifacts = Object.keys(ARTIFACTS_DATABASE);
      }
    } catch (e) {
      console.error("Error reading localStorage state:", e);
      gameState = { ...defaultState };
    }
  } else {
    gameState = { ...defaultState };
  }
  return gameState;
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

export function updateState(newData) {
  gameState = { ...gameState, ...newData };
  saveState();
}

// --- ФУНКЦІЯ ОБЧИСЛЕННЯ ПІДСУМКОВИХ ХАРАКТЕРИСТИК (З УРАХУВАННЯМ АРТЕФАКТІВ) ---
export function getPlayerStats() {
  let maxHP = 100;
  let bonusDamage = 0;

  if (gameState.equippedArtifacts) {
    Object.values(gameState.equippedArtifacts).forEach(artifactId => {
      if (artifactId && ARTIFACTS_DATABASE[artifactId]) {
        const item = ARTIFACTS_DATABASE[artifactId];
        if (item.bonusHP) maxHP += item.bonusHP;
        if (item.bonusDamage) bonusDamage += item.bonusDamage;
      }
    });
  }

  return { maxHP, bonusDamage };
}