// 明日方舟天赋养成模拟器 - UI组件
import type { Operator, TalentConfig, GameState } from './types';
import { getTotalAddedPoints, getRemainingPointsInStage, getCostPerUpgrade, getCurrentStagePoints } from './gameLogic';
import { getStageByLevel } from './types';

// 飘字动画状态
interface FloatingText {
  id: number;
  text: string;
  talentName: string;
}

// 创建飘字元素
export function createFloatingText(text: string, talentName: string): FloatingText {
  return {
    id: Date.now() + Math.random(),
    text,
    talentName,
  };
}

// 渲染属性条
export function renderTalentBar(talent: TalentConfig, isUpgraded: boolean, maxTotalMax: number): string {
  const percentage = (talent.current / talent.totalMax) * 100;
  const currentPercentage = (talent.currentMax / talent.totalMax) * 100;
  // 进度条总长度按总上限比例缩放
  const barWidthPercentage = (talent.totalMax / maxTotalMax) * 100;
  
  return `
    <div class="talent-bar-container" data-talent="${talent.name}">
      <div class="talent-header">
        <span class="talent-name">${talent.name}</span>
        <span class="talent-values">
          <span class="current-value ${isUpgraded ? 'upgraded' : ''}">${talent.current}</span>
          <span class="separator">/</span>
          <span class="current-max">${talent.currentMax}</span>
          <span class="separator">(</span>
          <span class="total-max">${talent.totalMax}</span>
          <span class="separator">)</span>
        </span>
      </div>
      <div class="talent-progress-wrapper" style="width: ${barWidthPercentage}%">
        <div class="talent-progress-bg">
          <div class="talent-progress-current-max" style="width: ${currentPercentage}%"></div>
          <div class="talent-progress-fill ${isUpgraded ? 'upgraded' : ''}" style="width: ${percentage}%"></div>
        </div>
        ${isUpgraded ? `<div class="floating-text">+1</div>` : ''}
      </div>
    </div>
  `;
}

// 渲染干员卡片
export function renderOperatorCard(operator: Operator, isSelected: boolean): string {
  const totalAdded = getTotalAddedPoints(operator);
  const stage = getStageByLevel(operator.currentLevel);
  const stagePoints = getCurrentStagePoints(operator);
  
  return `
    <div class="operator-card ${isSelected ? 'selected' : ''}" data-operator-id="${operator.id}">
      <div class="operator-avatar">${operator.avatar}</div>
      <div class="operator-info">
        <div class="operator-name">${operator.name}</div>
        <div class="operator-progress">
          <span class="progress-text">${totalAdded}/42</span>
          <span class="stage-badge">阶段${stage.totalPoints === 14 ? '1' : stage.totalPoints === 28 ? '2' : '3'}</span>
        </div>
      </div>
    </div>
  `;
}

// 渲染资源面板
export function renderResourcePanel(talentPoints: number): string {
  return `
    <div class="resource-panel">
      <div class="resource-item">
        <span class="resource-icon">💎</span>
        <span class="resource-name">天赋点</span>
        <input type="number" id="talent-points-input" class="resource-value-input" value="${talentPoints}" min="0" />
      </div>
      <div class="resource-controls">
        <button class="btn-add-resource" data-add="100">+100</button>
        <button class="btn-add-resource" data-add="500">+500</button>
        <button class="btn-add-resource" data-add="1000">+1000</button>
      </div>
    </div>
  `;
}

// 渲染等级控制
export function renderLevelControl(level: number): string {
  return `
    <div class="level-control">
      <span class="level-label">精二等级</span>
      <div class="level-input-group">
        <button class="btn-level" data-delta="-10">-10</button>
        <button class="btn-level" data-delta="-1">-1</button>
        <input type="number" id="level-input" value="${level}" min="1" max="70" />
        <button class="btn-level" data-delta="1">+1</button>
        <button class="btn-level" data-delta="10">+10</button>
      </div>
      <span class="stage-info" id="stage-info">${getStageInfo(level)}</span>
    </div>
  `;
}

function getStageInfo(level: number): string {
  const stage = getStageByLevel(level);
  const stageNum = stage.totalPoints === 14 ? 1 : stage.totalPoints === 28 ? 2 : 3;
  return `阶段${stageNum} (可加点至${stage.totalPoints}点)`;
}

// 渲染养成控制面板
export function renderUpgradePanel(operator: Operator, canUpgrade: boolean): string {
  const cost = getCostPerUpgrade(operator);
  const remaining = getRemainingPointsInStage(operator);
  const totalAdded = getTotalAddedPoints(operator);
  
  let statusText = '';
  if (totalAdded >= 42) {
    statusText = '已满级';
  } else if (remaining <= 0) {
    statusText = '请提升等级';
  } else {
    statusText = `本阶段剩余${remaining}点`;
  }

  return `
    <div class="upgrade-panel">
      <div class="upgrade-status">${statusText}</div>
      <button class="btn-upgrade ${!canUpgrade ? 'disabled' : ''}" id="btn-upgrade" ${!canUpgrade ? 'disabled' : ''}>
        <span class="btn-text">加点</span>
        <span class="btn-cost">-${cost}</span>
      </button>
      <button class="btn-reset" id="btn-reset">🔄 一键清零</button>
    </div>
  `;
}

// 渲染主应用
export function renderApp(state: GameState, lastUpgradedTalent: string | null): string {
  const selectedOperator = state.operators.find(o => o.id === state.selectedOperator);
  
  return `
    <div class="arknights-talent-simulator">
      <header class="app-header">
        <h1>🎮 明日方舟天赋养成模拟器</h1>
        <p class="subtitle">全新养成机制原型验证</p>
      </header>
      
      ${renderResourcePanel(state.talentPoints)}
      
      <div class="main-content">
        <aside class="operator-list">
          <h2>干员列表</h2>
          <div class="operators">
            ${state.operators.map(op => renderOperatorCard(op, op.id === state.selectedOperator)).join('')}
          </div>
        </aside>
        
        <main class="operator-detail">
          ${selectedOperator ? renderOperatorDetail(selectedOperator, state.talentPoints, lastUpgradedTalent) : renderEmptyState()}
        </main>
      </div>
    </div>
  `;
}

// 渲染干员详情
function renderOperatorDetail(operator: Operator, talentPoints: number, lastUpgradedTalent: string | null): string {
  const cost = getCostPerUpgrade(operator);
  const canUpgrade = talentPoints >= cost && getRemainingPointsInStage(operator) > 0;
  // 计算该干员中最大的总上限，用于进度条比例
  const maxTotalMax = Math.max(...operator.talents.map(t => t.totalMax));
  
  return `
    <div class="detail-card">
      <div class="detail-header">
        <div class="detail-avatar">${operator.avatar}</div>
        <div class="detail-title">
          <h2>${operator.name}</h2>
          <div class="detail-stats">
            <span class="stat">总进度: ${getTotalAddedPoints(operator)}/42</span>
            <span class="stat">消耗倍率: ${cost === 10 ? '1x' : cost === 20 ? '2x' : '5x'}</span>
          </div>
        </div>
      </div>
      
      ${renderLevelControl(operator.currentLevel)}
      
      <div class="talents-section">
        <h3>天赋属性</h3>
        <div class="talents-list">
          ${operator.talents.map(t => renderTalentBar(t, t.name === lastUpgradedTalent, maxTotalMax)).join('')}
        </div>
      </div>
      
      ${renderUpgradePanel(operator, canUpgrade)}
    </div>
  `;
}

// 渲染空状态
function renderEmptyState(): string {
  return `
    <div class="empty-state">
      <div class="empty-icon">👆</div>
      <p>请选择左侧干员查看详情</p>
    </div>
  `;
}
