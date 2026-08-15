import { ARTIFACTS_DATABASE } from './artifacts.js';

const STORAGE_KEY = 'not-fight-club-state';

const defaultState = {
  playerName: '',
  playerAvatar: null, 
  wins: 0,
  losses: 0,
  currentScreen: 'screen-registration',

  gold: 250,
  
  artifacts: Object.keys(ARTIFACTS_DATABASE), 
  
  equippedArtifacts: {
    weapon: null,
    armor: null,
    helmet: null,
    boots: null,
    ring: null
  }
};

export let gameState = JSON.parse(JSON.stringify(defaultState));

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameState = { 
        ...defaultState, 
        ...parsed,
        equippedArtifacts: {
          ...defaultState.equippedArtifacts,
          ...(parsed.equippedArtifacts || {})
        }
      };
      
      if (!gameState.artifacts || gameState.artifacts.length < 10) {
        gameState.artifacts = Object.keys(ARTIFACTS_DATABASE);
      }
    } catch (e) {
      console.error("Error reading localStorage state:", e);
      gameState = JSON.parse(JSON.stringify(defaultState));
    }
  } else {
    gameState = JSON.parse(JSON.stringify(defaultState));
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

export function getPlayerStats() {
  let maxHP = 100;
  let bonusDamage = 0;

  if (gameState.equippedArtifacts) {
    Object.values(gameState.equippedArtifacts).forEach(artifactId => {
      if (artifactId && ARTIFACTS_DATABASE[artifactId]) {
        const item = ARTIFACTS_DATABASE[artifactId];
        
        const hp = item.bonusHP ?? item.stats?.hp ?? 0;
        const dmg = item.bonusDamage ?? item.stats?.damage ?? 0;

        maxHP += hp;
        bonusDamage += dmg;
      }
    });
  }

  return { maxHP, bonusDamage };
}