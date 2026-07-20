import { gameState, loadState, updateState, getPlayerStats } from './state.js';
import { combatState, executeCombatTurn, logMessage, updateHPBars, validateTurnReadiness, enemyProfiles } from './combat.js';
import { ARTIFACTS_DATABASE } from './artifacts.js';

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

  const { maxHP, bonusDamage } = getPlayerStats();
  const hpStatEl = document.getElementById('char-stat-hp');
  const dmgStatEl = document.getElementById('char-stat-dmg');
  if (hpStatEl) hpStatEl.textContent = maxHP;
  if (dmgStatEl) dmgStatEl.textContent = 15 + bonusDamage;

  const currentAvatarImg = document.getElementById('char-current-avatar');
  if (currentAvatarImg) currentAvatarImg.src = gameState.playerAvatar || 'assets/avatars/ren.gif';

  document.querySelectorAll('.avatar-option').forEach(img => {
    img.getAttribute('data-avatar') === gameState.playerAvatar ? img.classList.add('selected') : img.classList.remove('selected');
  });

  renderArtifactsUI();
}

function renderArtifactsUI() {
  const inventoryGrid = document.getElementById('inventory-grid');
  if (!inventoryGrid) return;

  inventoryGrid.innerHTML = '';

  const slots = ['helmet', 'weapon', 'armor', 'boots', 'ring'];
  slots.forEach(slotType => {
    const slotEl = document.querySelector(`.artifact-slot[data-slot="${slotType}"]`);
    if (!slotEl) return;

    const equippedId = gameState.equippedArtifacts ? gameState.equippedArtifacts[slotType] : null;
    const artifact = ARTIFACTS_DATABASE[equippedId];

    if (artifact) {
      slotEl.classList.add('active');
      slotEl.innerHTML = `<img src="${artifact.icon}" alt="${artifact.name}" title="${artifact.name} (${artifact.description})">`;
      slotEl.onclick = () => unequipArtifact(slotType);
    } else {
      slotEl.classList.remove('active');
      const icons = { helmet: '🪖 Helm', weapon: '⚔️ Weapon', armor: '🥋 Armor', boots: '🥾 Boots', ring: '✨ Ring' };
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
      itemEl.title = `${artifact.name}\nSlot: ${artifact.slot}\n${artifact.description}`;
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
  previewBox.style.display = 'none';
  btnConfirm.disabled = true;
  btnConfirm.style.opacity = '0.5';
  btnConfirm.style.cursor = 'not-allowed';

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
    const profile = enemyProfiles[enemy.name] || { baseDamage: 15, attacksCount: 1, defendsCount: 2 };

    const card = document.createElement('div');
    card.className = 'enemy-card-option';
    card.style.cssText = 'background: #222; border: 2px solid #444; border-radius: 6px; padding: 10px; text-align: center; cursor: pointer; transition: all 0.2s;';
    
    card.innerHTML = `
      <img src="${enemy.avatar}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 5px;" alt="${enemy.name}">
      <div style="font-weight: bold; font-size: 14px;">${enemy.name}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.enemy-card-option').forEach(c => c.style.borderColor = '#444');
      card.style.borderColor = '#ff4757';

      combatState.currentEnemyName = enemy.name;
      
      document.getElementById('preview-enemy-name').textContent = enemy.name;
      document.getElementById('preview-enemy-dmg').textContent = profile.baseDamage;
      document.getElementById('preview-enemy-attacks').textContent = profile.attacksCount;
      document.getElementById('preview-enemy-defends').textContent = profile.defendsCount;
      
      previewBox.style.display = 'block';

      btnConfirm.disabled = false;
      btnConfirm.style.opacity = '1';
      btnConfirm.style.cursor = 'pointer';
    });

    enemyGrid.appendChild(card);
  });
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

function setupEventListeners() {
  // Navigation
  document.getElementById('btn-register').addEventListener('click', () => {
    const name = document.getElementById('reg-name').value.trim();
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

  // Settings
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

  // Enemy Select Screen Flow
  document.getElementById('btn-start-battle').addEventListener('click', () => {
    renderEnemySelection();
    showScreen('screen-enemy-select');
  });

  document.querySelector('.btn-enemy-select-back').addEventListener('click', () => showScreen('screen-home'));

  // Start Battle after Confirming Opponent
  document.getElementById('btn-confirm-fight').addEventListener('click', () => {
    const { maxHP } = getPlayerStats();

    combatState.playerHP = maxHP;
    combatState.enemyHP = 100;

    document.getElementById('arena-player-avatar').src = gameState.playerAvatar || 'assets/avatars/ren.gif';
    document.getElementById('arena-player-name').textContent = gameState.playerName;
    document.getElementById('arena-enemy-avatar').src = `assets/avatars/${combatState.currentEnemyName.toLowerCase()}.gif`;
    document.getElementById('arena-enemy-name').textContent = combatState.currentEnemyName;

    updateHPBars();
    updateZonesIndicator();

    document.getElementById('battle-log').innerHTML = '';
    logMessage(`⚔️ Battle started! ${gameState.playerName} (${maxHP} HP) vs ${combatState.currentEnemyName}!`, 'system');

    showScreen('screen-battle');
  });

  // Tactical Zone Selection
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

  // Execute Turn
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

  // Back to Menu from Battle Screen
  document.querySelector('.btn-battle-back').addEventListener('click', () => {
    const arenaContainer = document.querySelector('.arena-container');
    if (arenaContainer && arenaContainer.querySelector('.victory-screen-wrapper')) {
      const { maxHP } = getPlayerStats();
      arenaContainer.innerHTML = `
        <div class="fighter-card player-side">
          <h3>Your Fighter</h3>
          <img id="arena-player-avatar" src="${gameState.playerAvatar || 'assets/avatars/ren.gif'}" alt="Player">
          <div id="arena-player-name" class="fighter-name">${gameState.playerName}</div>
          <div class="hp-bar-container"><div id="player-hp-bar" class="hp-bar"></div></div>
          <div id="player-hp-text" style="font-size: 12px; color: #aaa; margin-top: 2px;">${maxHP} / ${maxHP}</div>
        </div>
        <div id="combat-actions" class="combat-actions">
          <h4>Choose 1 attack and 2 defence zones</h4>
          <div class="zones-columns-wrapper">
            <div class="zone-column">
              <span style="color: #ff4757; font-size: 12px; font-weight: bold; margin-bottom: 5px;">⚡ ATTACK</span>
              <button type="button" class="btn-zone-attack" data-zone="Head">Head 🪖</button>
              <button type="button" class="btn-zone-attack" data-zone="Neck">Neck 🎯</button>
              <button type="button" class="btn-zone-attack" data-zone="Body">Body 🥋</button>
              <button type="button" class="btn-zone-attack" data-zone="Belly">Belly 🔥</button>
              <button type="button" class="btn-zone-attack" data-zone="Legs">Legs 🥾</button>
            </div>
            <div class="zone-divider" style="width: 1px; background: #444; align-self: stretch;"></div>
            <div class="zone-column">
              <span style="color: #2ed573; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🛡️ DEFEND</span>
              <button type="button" class="btn-zone-defend" data-zone="Head">Head 🪖</button>
              <button type="button" class="btn-zone-defend" data-zone="Neck">Neck 🎯</button>
              <button type="button" class="btn-zone-defend" data-zone="Body">Body 🥋</button>
              <button type="button" class="btn-zone-defend" data-zone="Belly">Belly 🔥</button>
              <button type="button" class="btn-zone-defend" data-zone="Legs">Legs 🥾</button>
            </div>
          </div>
          <div id="selected-zones-indicator" style="margin: 5px 0; font-size: 12px; font-weight: bold; color: #eccc68; background: #222; padding: 4px 10px; border-radius: 4px; border: 1px solid #444; text-align: center; width: 90%;">
            🎯 A: <span id="indicator-attack" style="color: #ff4757;">None</span> | 🛡️ D: <span id="indicator-defend" style="color: #2ed573;">None</span>
          </div>
          <button id="btn-end-turn" class="btn-primary" disabled style="margin-top: 10px; width: 100%; max-width: 200px; opacity: 0.5; cursor: not-allowed; background-color: #eccc68; color: #000; padding: 8px;">
            EXECUTE TURN ⚔️
          </button>
        </div>
        <div class="fighter-card enemy-side">
          <h3>Enemy</h3>
          <img id="arena-enemy-avatar" src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22 x=%2215%22>❓</text></svg>" alt="Enemy">
          <div id="arena-enemy-name" class="fighter-name">Enemy</div>
          <div class="hp-bar-container"><div id="enemy-hp-bar" class="hp-bar"></div></div>
          <div id="enemy-hp-text" style="font-size: 12px; color: #aaa; margin-top: 2px;">100 / 100</div>
        </div>
      `;
    }

    combatState.selectedAttackZone = '';
    combatState.selectedDefendZones = [];
    showScreen('screen-home');
  });
}

document.addEventListener('DOMContentLoaded', init);