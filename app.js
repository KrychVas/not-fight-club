import { gameState, loadState, updateState, getPlayerStats } from './state.js';
import { 
  combatState, 
  executeCombatTurn, 
  logMessage, 
  updateHPBars, 
  validateTurnReadiness, 
  enemyProfiles, 
  getEnemyStats, 
  saveCombatState, 
  clearCombatState,
  resetBattleUI
} from './combat.js';
import { ARTIFACTS_DATABASE } from './artifacts.js';
import { soundManager } from './audio.js';

function validateAndGetPlayerName(rawName) {
  const trimmed = rawName ? rawName.trim() : '';
  if (!trimmed) {
    alert("Please enter your fighter's name!");
    return null;
  }
  if (trimmed.length < 2) {
    alert("Name is too short (minimum 2 characters)!");
    return null;
  }
  if (trimmed.length > 15) {
    alert("Name is too long (maximum 15 characters)!");
    return null;
  }
  return trimmed;
}

function hasSavedBattle() {
  const saved = localStorage.getItem('active_combat_state');
  if (!saved) return false;
  try {
    const parsed = JSON.parse(saved);
    return parsed && parsed.isInBattle && parsed.playerHP > 0 && parsed.enemyHP > 0;
  } catch (e) {
    return false;
  }
}

function getArtifactTooltip(artifact) {
  if (!artifact) return '';
  return `${artifact.name} (${artifact.slot.toUpperCase()})\n${artifact.description}`;
}

function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => screen.classList.add('hidden'));

  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove('hidden');
    updateState({ currentScreen: screenId });
  }

  if (screenId === 'screen-home' || screenId === 'screen-settings') {
    soundManager.playBGM('menu');
  } else if (screenId === 'screen-enemy-select' || screenId === 'screen-character') {
    soundManager.playBGM('select');
  } else if (screenId === 'screen-battle') {
    const isBoss = combatState.currentEnemyName === 'Boss';
    soundManager.playBGM(isBoss ? 'boss' : 'battle');
  }

  updateUI();
}

function restoreSavedBattle() {
  const savedCombatRaw = localStorage.getItem('active_combat_state');
  if (!savedCombatRaw) return false;

  try {
    const savedCombat = JSON.parse(savedCombatRaw);
    if (savedCombat && savedCombat.isInBattle) {
      combatState.playerHP = savedCombat.playerHP;
      combatState.enemyHP = savedCombat.enemyHP;
      combatState.enemyMaxHP = savedCombat.enemyMaxHP;
      combatState.currentEnemyName = savedCombat.currentEnemyName;
      combatState.enemyEquipment = savedCombat.enemyEquipment || {};

      prepareBattleArenaUI();

      const battleLog = document.getElementById('battle-log');
      if (battleLog && savedCombat.battleLogHTML) {
        battleLog.innerHTML = savedCombat.battleLogHTML;
        battleLog.scrollTop = battleLog.scrollHeight;
      }

      showScreen('screen-battle');
      return true;
    }
  } catch (err) {
    console.error('Failed to restore combat state:', err);
    clearCombatState();
  }
  return false;
}

function init() {
  loadState();

  if (gameState.theme) {
    document.body.className = gameState.theme;
  }

  setupEventListeners();
  setupKeyboardControls();

  if (gameState.playerName && gameState.currentScreen === 'screen-battle') {
    if (restoreSavedBattle()) {
      return;
    }
  }

  if (gameState.playerName) {
    updateUI();
    showScreen(gameState.currentScreen === 'screen-registration' ? 'screen-home' : gameState.currentScreen);
  } else {
    showScreen('screen-registration');
  }
}

function prepareBattleArenaUI() {
  const playerAvatarEl = document.getElementById('arena-player-avatar');
  const playerNameEl = document.getElementById('arena-player-name');
  const enemyAvatarEl = document.getElementById('arena-enemy-avatar');
  const enemyNameEl = document.getElementById('arena-enemy-name');

  if (playerAvatarEl) playerAvatarEl.src = gameState.playerAvatar || 'assets/avatars/ren.gif';
  if (playerNameEl) playerNameEl.textContent = gameState.playerName;
  
  if (combatState.currentEnemyName) {
    if (enemyAvatarEl) enemyAvatarEl.src = `assets/avatars/${combatState.currentEnemyName.toLowerCase()}.gif`;
    if (enemyNameEl) enemyNameEl.textContent = combatState.currentEnemyName;
  }

  updateHPBars();
  updateZonesIndicator();
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

  const { maxHP, bonusDamage } = getPlayerStats();
  const hpStatEl = document.getElementById('char-stat-hp');
  const dmgStatEl = document.getElementById('char-stat-dmg');
  if (hpStatEl) hpStatEl.textContent = maxHP;
  if (dmgStatEl) dmgStatEl.textContent = 15 + bonusDamage;

  const currentAvatarImg = document.getElementById('char-current-avatar');
  if (currentAvatarImg && gameState.playerAvatar) {
    currentAvatarImg.src = gameState.playerAvatar;
  }

  if (gameState.playerAvatar) {
    const avatarName = gameState.playerAvatar.split('/').pop().replace('.gif','');
    const heroNameCap = avatarName.charAt(0).toUpperCase() + avatarName.slice(1);
    const heroProfile = enemyProfiles[heroNameCap];
    const charBioEl = document.getElementById('char-player-bio');
    if (charBioEl && heroProfile) {
      charBioEl.textContent = heroProfile.bio;
    }
  }

  const themeSelect = document.getElementById('setting-theme-select');
  if (themeSelect && gameState.theme) {
    themeSelect.value = gameState.theme;
  }

  // Синхронізація чекбоксів налаштувань звуку із реальними значеннями soundManager
  const bgmToggle = document.getElementById('setting-bgm-toggle');
  if (bgmToggle) {
    bgmToggle.checked = soundManager.isBGMMuted;
  }

  const sfxToggle = document.getElementById('setting-sfx-toggle');
  if (sfxToggle) {
    sfxToggle.checked = soundManager.isSFXMuted;
  }

  let continueBtn = document.getElementById('btn-continue-battle');
  const homeScreen = document.getElementById('screen-home');

  if (hasSavedBattle()) {
    if (!continueBtn && homeScreen) {
      continueBtn = document.createElement('button');
      continueBtn.id = 'btn-continue-battle';
      
      continueBtn.className = 'btn-primary btn-menu'; 
      continueBtn.textContent = 'Return to Battle ⚔️';
      
      const startBtn = document.getElementById('btn-start-battle');
      if (startBtn && startBtn.parentNode) {
        startBtn.parentNode.insertBefore(continueBtn, startBtn);
      } else {
        homeScreen.appendChild(continueBtn);
      }

      continueBtn.addEventListener('click', () => {
        restoreSavedBattle();
      });
    } else if (continueBtn) {
      continueBtn.style.display = 'block';
    }
  } else if (continueBtn) {
    continueBtn.style.display = 'none';
  }

  renderPlayerAvatarPicker();
  renderArtifactsUI();
}

function renderPlayerAvatarPicker() {
  const container = document.getElementById('player-avatar-grid');
  const playerPreviewBox = document.getElementById('selected-player-preview');
  
  if (!container) return;
  container.innerHTML = '';

  if (playerPreviewBox) {
    playerPreviewBox.style.display = !gameState.playerAvatar ? 'none' : 'block';
  }

  const allCharacters = [
    { name: 'Boss', avatar: 'assets/avatars/boss.gif' },
    { name: 'Cho', avatar: 'assets/avatars/cho.gif' },
    { name: 'Gal', avatar: 'assets/avatars/gal.gif' },
    { name: 'Jon', avatar: 'assets/avatars/jon.gif' },
    { name: 'Lodman', avatar: 'assets/avatars/lodman.gif' },
    { name: 'Ren', avatar: 'assets/avatars/ren.gif' },
    { name: 'Ryuken', avatar: 'assets/avatars/ryuken.gif' }
  ];

  allCharacters.forEach(char => {
    const isSelected = gameState.playerAvatar === char.avatar;
    const card = document.createElement('div');
    card.className = 'player-card-option';
    card.style.cssText = `background: #222; border: 2px solid ${isSelected ? '#2ed573' : '#444'}; border-radius: 6px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s;`;
    
    card.innerHTML = `
      <img src="${char.avatar}" style="width: 45px; height: 45px; object-fit: contain; margin-bottom: 2px;" alt="${char.name}">
      <div style="font-weight: bold; font-size: 11px;">${char.name}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.player-card-option').forEach(c => c.style.borderColor = '#444');
      card.style.borderColor = '#2ed573';

      updateState({ playerAvatar: char.avatar });
      updateUI();
    });

    container.appendChild(card);
  });
}

function renderArtifactsUI() {
  const inventoryGrid = document.getElementById('inventory-grid');
  if (!inventoryGrid) return;

  inventoryGrid.innerHTML = '';

  const slots = ['helmet', 'weapon', 'armor', 'boots', 'ring'];
  slots.forEach(slotType => {
    const slotEl = document.querySelector(`.artifact-slot[data-slot="${slotType}"]:not(.enemy-slot)`);
    if (!slotEl) return;

    const equippedId = gameState.equippedArtifacts ? gameState.equippedArtifacts[slotType] : null;
    const artifact = ARTIFACTS_DATABASE[equippedId];

    if (artifact) {
      slotEl.classList.add('active');
      slotEl.title = getArtifactTooltip(artifact);
      slotEl.innerHTML = `<img src="${artifact.icon}" alt="${artifact.name}">`;
      slotEl.onclick = () => unequipArtifact(slotType);
    } else {
      slotEl.classList.remove('active');
      const icons = { helmet: '🪖 Helm', weapon: '⚔️ Weapon', armor: '🥋 Armor', boots: '🥾 Boots', ring: '✨ Ring' };
      slotEl.title = `${slotType.toUpperCase()} slot`;
      slotEl.innerHTML = `<span>${icons[slotType]}</span>`;
      slotEl.onclick = null;
    }
  });

  if (gameState.artifacts && Array.isArray(gameState.artifacts)) {
    gameState.artifacts.forEach(artifactId => {
      const artifact = ARTIFACTS_DATABASE[artifactId];
      if (!artifact) return;

      const isEquipped = gameState.equippedArtifacts && Object.values(gameState.equippedArtifacts).includes(artifactId);
      
      const itemEl = document.createElement('div');
      itemEl.className = `inventory-item ${isEquipped ? 'equipped-now' : ''}`;
      itemEl.title = getArtifactTooltip(artifact);
      itemEl.innerHTML = `<img src="${artifact.icon}" alt="${artifact.name}">`;

      if (!isEquipped) {
        itemEl.addEventListener('click', () => equipArtifact(artifactId));
      }

      inventoryGrid.appendChild(itemEl);
    });
  }
}

function equipArtifact(artifactId) {
  const artifact = ARTIFACTS_DATABASE[artifactId];
  if (!artifact) return;

  const currentEquipped = { ...(gameState.equippedArtifacts || {}) };
  currentEquipped[artifact.slot] = artifactId;

  updateState({ equippedArtifacts: currentEquipped });
  updateUI();
}

function unequipArtifact(slotType) {
  const currentEquipped = { ...(gameState.equippedArtifacts || {}) };
  currentEquipped[slotType] = null;

  updateState({ equippedArtifacts: currentEquipped });
  updateUI();
}

function renderEnemySelection() {
  const enemyGrid = document.getElementById('enemy-select-grid');
  const previewBox = document.getElementById('selected-enemy-preview');
  const btnConfirm = document.getElementById('btn-confirm-fight');
  
  if (!enemyGrid) return;
  enemyGrid.innerHTML = '';
  if (previewBox) previewBox.style.display = 'none';

  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.style.opacity = '0.5';
    btnConfirm.style.cursor = 'not-allowed';
  }

  combatState.enemyEquipment = {};

  const allEnemies = [
    { name: 'Boss', avatar: 'assets/avatars/boss.gif' },
    { name: 'Cho', avatar: 'assets/avatars/cho.gif' },
    { name: 'Gal', avatar: 'assets/avatars/gal.gif' },
    { name: 'Jon', avatar: 'assets/avatars/jon.gif' },
    { name: 'Lodman', avatar: 'assets/avatars/lodman.gif' },
    { name: 'Ren', avatar: 'assets/avatars/ren.gif' },
    { name: 'Ryuken', avatar: 'assets/avatars/ryuken.gif' }
  ];

  allEnemies.filter(e => e.avatar !== gameState.playerAvatar).forEach(enemy => {
    const card = document.createElement('div');
    card.className = 'enemy-card-option';
    card.style.cssText = 'background: #222; border: 2px solid #444; border-radius: 6px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s;';
    
    card.innerHTML = `
      <img src="${enemy.avatar}" style="width: 45px; height: 45px; object-fit: contain; margin-bottom: 2px;" alt="${enemy.name}">
      <div style="font-weight: bold; font-size: 11px;">${enemy.name}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.enemy-card-option').forEach(c => c.style.borderColor = '#444');
      card.style.borderColor = '#ff4757';

      combatState.currentEnemyName = enemy.name;
      combatState.enemyEquipment = {};
      
      const previewAvatar = document.getElementById('preview-enemy-avatar');
      if (previewAvatar) previewAvatar.src = enemy.avatar;
      
      updateEnemyUI();

      if (previewBox) previewBox.style.display = 'block';
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.style.opacity = '1';
        btnConfirm.style.cursor = 'pointer';
      }
    });

    enemyGrid.appendChild(card);
  });
}

function updateEnemyUI() {
  const profile = enemyProfiles[combatState.currentEnemyName] || {};
  const stats = getEnemyStats();

  const nameEl = document.getElementById('preview-enemy-name');
  if (nameEl) nameEl.textContent = combatState.currentEnemyName;

  const enemyBioEl = document.getElementById('preview-enemy-bio');
  if (enemyBioEl) {
    enemyBioEl.textContent = profile.bio || 'Formidable opponent in the arena.';
  }

  const hpEl = document.getElementById('preview-enemy-hp');
  if (hpEl) hpEl.textContent = stats.maxHP;

  const dmgEl = document.getElementById('preview-enemy-dmg');
  if (dmgEl) dmgEl.textContent = stats.totalDamage;

  renderEnemyArtifactsUI();
}

function renderEnemyArtifactsUI() {
  const enemyInventoryGrid = document.getElementById('enemy-inventory-grid');
  if (!enemyInventoryGrid) return;

  enemyInventoryGrid.innerHTML = '';

  const slots = ['helmet', 'weapon', 'armor', 'boots', 'ring'];
  slots.forEach(slotType => {
    const slotEl = document.querySelector(`.enemy-slot[data-slot="${slotType}"]`);
    if (!slotEl) return;

    const equippedId = combatState.enemyEquipment[slotType];
    const artifact = ARTIFACTS_DATABASE[equippedId];

    if (artifact) {
      slotEl.classList.add('active');
      slotEl.title = getArtifactTooltip(artifact);
      slotEl.innerHTML = `<img src="${artifact.icon}" alt="${artifact.name}">`;
      slotEl.onclick = () => unequipEnemyArtifact(slotType);
    } else {
      slotEl.classList.remove('active');
      const icons = { helmet: '🪖 Helm', weapon: '⚔️ Weapon', armor: '🥋 Armor', boots: '🥾 Boots', ring: '✨ Ring' };
      slotEl.title = `${slotType.toUpperCase()} slot`;
      slotEl.innerHTML = `<span>${icons[slotType]}</span>`;
      slotEl.onclick = null;
    }
  });

  Object.keys(ARTIFACTS_DATABASE).forEach(artifactId => {
    const artifact = ARTIFACTS_DATABASE[artifactId];
    const isEquipped = Object.values(combatState.enemyEquipment).includes(artifactId);

    const itemEl = document.createElement('div');
    itemEl.className = `inventory-item ${isEquipped ? 'equipped-now' : ''}`;
    itemEl.title = getArtifactTooltip(artifact);
    itemEl.innerHTML = `<img src="${artifact.icon}" alt="${artifact.name}">`;

    if (!isEquipped) {
      itemEl.addEventListener('click', () => equipEnemyArtifact(artifactId));
    }

    enemyInventoryGrid.appendChild(itemEl);
  });
}

function equipEnemyArtifact(artifactId) {
  const artifact = ARTIFACTS_DATABASE[artifactId];
  if (!artifact) return;

  combatState.enemyEquipment[artifact.slot] = artifactId;
  updateEnemyUI();
}

function unequipEnemyArtifact(slotType) {
  delete combatState.enemyEquipment[slotType];
  updateEnemyUI();
}

function updateZonesIndicator() {
  const attackText = document.getElementById('indicator-attack');
  const defendText = document.getElementById('indicator-defend');
  
  if (attackText) attackText.textContent = combatState.selectedAttackZone || 'None';
  if (defendText) {
    defendText.textContent = combatState.selectedDefendZones.length > 0 
      ? combatState.selectedDefendZones.join(', ') 
      : 'None';
  }
}

function checkTurnReadiness() {
  validateTurnReadiness();
  updateZonesIndicator();
}

function toggleAttackZone(zone) {
  const btn = document.querySelector(`.btn-zone-attack[data-zone="${zone}"]`);
  if (!btn) return;
  if (combatState.selectedAttackZone === zone) {
    combatState.selectedAttackZone = '';
    btn.classList.remove('selected-attack');
  } else {
    document.querySelectorAll('.btn-zone-attack').forEach(b => b.classList.remove('selected-attack'));
    combatState.selectedAttackZone = zone;
    btn.classList.add('selected-attack');
  }
  checkTurnReadiness();
}

function toggleDefendZone(zone) {
  const btn = document.querySelector(`.btn-zone-defend[data-zone="${zone}"]`);
  if (!btn) return;
  const idx = combatState.selectedDefendZones.indexOf(zone);
  if (idx > -1) {
    combatState.selectedDefendZones.splice(idx, 1);
    btn.classList.remove('selected-defend');
  } else {
    if (combatState.selectedDefendZones.length >= 2) return;
    combatState.selectedDefendZones.push(zone);
    btn.classList.add('selected-defend');
  }
  checkTurnReadiness();
}

function setupKeyboardControls() {
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      if (e.key === 'Enter') {
        const regScreen = document.getElementById('screen-registration');
        const setScreen = document.getElementById('screen-settings');
        
        if (regScreen && !regScreen.classList.contains('hidden')) {
          document.getElementById('btn-register')?.click();
        } else if (setScreen && !setScreen.classList.contains('hidden')) {
          document.getElementById('btn-save-settings')?.click();
        }
      }
      return;
    }

    const battleScreen = document.getElementById('screen-battle');
    const isBattleScreen = battleScreen && !battleScreen.classList.contains('hidden');
    if (!isBattleScreen) return;

    const zones = ['Head', 'Neck', 'Body', 'Belly', 'Legs'];

    const digitMap = {
      'Digit1': 0, 'Numpad1': 0,
      'Digit2': 1, 'Numpad2': 1,
      'Digit3': 2, 'Numpad3': 2,
      'Digit4': 3, 'Numpad4': 3,
      'Digit5': 4, 'Numpad5': 4
    };

    if (e.code in digitMap) {
      toggleAttackZone(zones[digitMap[e.code]]);
    }

    const defendCodeMap = {
      'KeyQ': 0, 'KeyW': 1, 'KeyE': 2, 'KeyR': 3, 'KeyT': 4
    };

    if (e.code in defendCodeMap) {
      toggleDefendZone(zones[defendCodeMap[e.code]]);
    }

    if (e.code === 'Space' || e.code === 'Enter') {
      const btnEndTurn = document.getElementById('btn-end-turn');
      if (btnEndTurn && !btnEndTurn.disabled) {
        e.preventDefault();
        btnEndTurn.click();
      }
    }
  });
}

function setupEventListeners() {
  document.getElementById('btn-register')?.addEventListener('click', () => {
    const rawName = document.getElementById('reg-name')?.value;
    const validatedName = validateAndGetPlayerName(rawName);
    if (!validatedName) return;

    updateState({ playerName: validatedName });
    soundManager.playBGM('menu');
    updateUI();
    showScreen('screen-home');
  });

  document.getElementById('btn-to-settings')?.addEventListener('click', () => {
    const settingsInput = document.getElementById('settings-name');
    if (settingsInput) settingsInput.value = gameState.playerName;
    showScreen('screen-settings');
  });

  document.getElementById('btn-to-character')?.addEventListener('click', () => {
    const playerPreviewBox = document.getElementById('selected-player-preview');
    if (playerPreviewBox) {
      playerPreviewBox.style.display = gameState.playerAvatar ? 'block' : 'none';
    }
    updateUI();
    showScreen('screen-character');
  });

  document.querySelector('.btn-character-back')?.addEventListener('click', () => showScreen('screen-home'));

  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    const rawName = document.getElementById('settings-name')?.value;
    const validatedName = validateAndGetPlayerName(rawName);
    if (!validatedName) return;

    updateState({ playerName: validatedName });
    updateUI();
    alert("Changes saved successfully! 💾");
  });

  const sfxToggle = document.getElementById('setting-sfx-toggle');
  if (sfxToggle) {
    sfxToggle.addEventListener('change', (e) => soundManager.toggleSFX(e.target.checked));
  }

  const bgmToggle = document.getElementById('setting-bgm-toggle');
  if (bgmToggle) {
    bgmToggle.addEventListener('change', (e) => soundManager.toggleBGM(e.target.checked));
  }

  const themeSelect = document.getElementById('setting-theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      document.body.className = e.target.value;
      updateState({ theme: e.target.value });
    });
  }

  document.getElementById('btn-reset-game')?.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all progress?")) {
      clearCombatState();
      localStorage.clear();
      window.location.reload();
    }
  });

  document.querySelector('.btn-settings-back')?.addEventListener('click', () => showScreen('screen-home'));

  document.getElementById('btn-start-battle')?.addEventListener('click', () => {
    renderEnemySelection();
    showScreen('screen-enemy-select');
  });

  document.querySelector('.btn-enemy-select-back')?.addEventListener('click', () => showScreen('screen-home'));

  document.getElementById('btn-confirm-fight')?.addEventListener('click', () => {
    clearCombatState();

    if (typeof resetBattleUI === 'function') {
      resetBattleUI();
    }

    const winnerBanner = document.querySelector('.winner-banner') || document.getElementById('victory-overlay');
    if (winnerBanner) {
      winnerBanner.classList.add('hidden');
      winnerBanner.style.display = 'none';
    }

    const actionControls = document.getElementById('battle-controls') || document.querySelector('.battle-controls');
    if (actionControls) {
      actionControls.style.display = 'block';
      actionControls.classList.remove('hidden');
    }

    combatState.selectedAttackZone = '';
    combatState.selectedDefendZones = [];
    document.querySelectorAll('.btn-zone-attack').forEach(b => b.classList.remove('selected-attack'));
    document.querySelectorAll('.btn-zone-defend').forEach(b => b.classList.remove('selected-defend'));

    const { maxHP } = getPlayerStats();
    const enemyStats = getEnemyStats();

    combatState.playerHP = maxHP;
    combatState.enemyHP = enemyStats.maxHP;
    combatState.enemyMaxHP = enemyStats.maxHP;

    prepareBattleArenaUI();

    const battleLog = document.getElementById('battle-log');
    if (battleLog) battleLog.innerHTML = '';
    logMessage(`⚔️ Battle started! ${gameState.playerName} (${maxHP} HP) vs ${combatState.currentEnemyName} (${enemyStats.maxHP} HP)!`, 'system');

    saveCombatState();
    showScreen('screen-battle');
  });

  document.querySelectorAll('.btn-zone-attack').forEach(button => {
    button.addEventListener('click', () => toggleAttackZone(button.getAttribute('data-zone')));
  });

  document.querySelectorAll('.btn-zone-defend').forEach(button => {
    button.addEventListener('click', () => toggleDefendZone(button.getAttribute('data-zone')));
  });

  const btnEndTurn = document.getElementById('btn-end-turn');
  if (btnEndTurn) {
    btnEndTurn.addEventListener('click', () => {
      executeCombatTurn((isWin) => {
        updateState({ wins: gameState.wins + (isWin ? 1 : 0), losses: gameState.losses + (isWin ? 0 : 1) });
        updateUI();
      });
      updateZonesIndicator();
    });
  }

  document.querySelector('.btn-battle-back')?.addEventListener('click', () => {
    saveCombatState();
    
    combatState.selectedAttackZone = '';
    combatState.selectedDefendZones = [];
    
    showScreen('screen-home');
  });
}

document.addEventListener('DOMContentLoaded', init);