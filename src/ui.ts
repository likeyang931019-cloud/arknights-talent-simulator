// 明日方舟天赋养成模拟器 - UI组件
import type { Operator, TalentConfig, GameState, GuidanceStone, TalentType } from './types';
import { TALENT_COMBAT_TYPE, TALENT_NATURE_TYPE, isTalentMatchGuidanceStone, getStageByLevel } from './types';
import { getTotalAddedPoints, getRemainingPointsInStage, getCostPerUpgrade, getCurrentStagePoints, calculateTalentWeight } from './gameLogic';

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
export function renderTalentBar(
  talent: TalentConfig, 
  isUpgraded: boolean, 
  maxTotalMax: number, 
  n: number,
  isHighlighted: boolean = true
): string {
  const percentage = (talent.current / talent.totalMax) * 100;
  const currentPercentage = (talent.currentMax / talent.totalMax) * 100;
  // 进度条总长度按总上限比例缩放
  const barWidthPercentage = (talent.totalMax / maxTotalMax) * 100;
  // 计算权重（新公式）并四舍五入取整
  const weight = Math.round(calculateTalentWeight(talent, n));
  
  return `
    <div class="talent-bar-container ${isHighlighted ? 'highlighted' : 'dimmed'}" data-talent="${talent.name}">
      <div class="talent-header">
        <span class="talent-name">${talent.name}</span>
        <span class="talent-tags">
          <span class="tag tag-combat">${TALENT_COMBAT_TYPE[talent.name]}</span>
          <span class="tag tag-nature">${TALENT_NATURE_TYPE[talent.name]}</span>
        </span>
        <span class="talent-weight" title="随机权重 (n=${n})">权重:${weight}</span>
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
  
  const stageBadge = stage.totalPoints === 0 
    ? '<span class="stage-badge locked">未解锁</span>'
    : `<span class="stage-badge">阶段${stage.totalPoints === 14 ? '1' : stage.totalPoints === 28 ? '2' : '3'}</span>`;
  
  return `
    <div class="operator-card ${isSelected ? 'selected' : ''}" data-operator-id="${operator.id}">
      <div class="operator-avatar">${operator.avatar}</div>
      <div class="operator-info">
        <div class="operator-name">${operator.name}</div>
        <div class="operator-progress">
          <span class="progress-text">${totalAdded}/42</span>
          ${stageBadge}
        </div>
      </div>
    </div>
  `;
}

// 渲染资源面板
export function renderResourcePanel(talentPoints: number, weightParamN: number): string {
  return `
    <div class="resource-panel">
      <div class="resource-item">
        <span class="resource-icon">💎</span>
        <span class="resource-name">天赋点</span>
        <input type="number" id="talent-points-input" class="resource-value-input" value="${talentPoints}" min="0" />
      </div>
      <div class="resource-param">
        <span class="param-formula" title="权重计算公式">Wi=(1/(v+1)^n)×(max-v)×100</span>
        <span class="param-label">参数n</span>
        <input type="number" id="weight-param-n" class="param-input" value="${weightParamN}" min="0" max="10" step="0.1" />
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
  
  // 未解锁阶段
  if (stage.totalPoints === 0) {
    return '未解锁 (需精二30级)';
  }
  
  const stageNum = stage.totalPoints === 14 ? 1 : stage.totalPoints === 28 ? 2 : 3;
  const nextUnlock = stage.totalPoints === 14 ? '50' : stage.totalPoints === 28 ? '70' : '已满';
  return `阶段${stageNum} (可加点至${stage.totalPoints}点${nextUnlock !== '已满' ? `, 下档${nextUnlock}级` : ''})`;
}

// 渲染引导石
export function renderGuidanceStones(
  stones: GuidanceStone[],
  operator: Operator,
  currentStage: number
): string {
  // 阶段1不能使用引导石
  const isStage1 = currentStage === 1;
  
  // 检查干员拥有的属性类型
  const operatorTalents = operator.talents.map(t => t.name);
  const hasCombatType = (type: '攻' | '防' | '辅') => 
    operatorTalents.some(t => TALENT_COMBAT_TYPE[t] === type);
  const hasNatureType = (type: '生理' | '心理') => 
    operatorTalents.some(t => TALENT_NATURE_TYPE[t] === type);
  
  // 检查是否有选中的互斥组
  const combatSelected = stones.find(s => ['攻', '防', '辅'].includes(s.type) && s.selected);
  const natureSelected = stones.find(s => ['生理', '心理'].includes(s.type) && s.selected);
  
  return `
    <div class="guidance-stones-panel">
      <div class="guidance-stones-title">引导石 (阶段2+可用)</div>
      <div class="guidance-stones-list">
        ${stones.map(stone => {
          // 判断该引导石是否适用当前干员
          const hasMatchingTalent = stone.type === '攻' || stone.type === '防' || stone.type === '辅'
            ? hasCombatType(stone.type)
            : hasNatureType(stone.type);
          
          // 判断是否被互斥禁用
          const isMutuallyExcluded = 
            (['攻', '防', '辅'].includes(stone.type) && combatSelected && combatSelected.type !== stone.type) ||
            (['生理', '心理'].includes(stone.type) && natureSelected && natureSelected.type !== stone.type);
          
          // 最终禁用状态
          const isDisabled = isStage1 || !hasMatchingTalent || isMutuallyExcluded || stone.count === 0;
          
          return `
            <label class="guidance-stone-item ${isDisabled ? 'disabled' : ''} ${stone.selected ? 'selected' : ''}" 
                   data-stone-type="${stone.type}">
              <input type="checkbox" class="stone-checkbox" 
                     data-stone-type="${stone.type}"
                     ${stone.selected ? 'checked' : ''} 
                     ${isDisabled ? 'disabled' : ''}>
              <span class="stone-name">${stone.name}</span>
              <span class="stone-count">×${stone.count}</span>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// 渲染养成控制面板
export function renderUpgradePanel(
  operator: Operator, 
  canUpgrade: boolean, 
  stones: GuidanceStone[],
  n: number
): string {
  const cost = getCostPerUpgrade(operator);
  const remaining = getRemainingPointsInStage(operator);
  const totalAdded = getTotalAddedPoints(operator);
  const stage = getStageByLevel(operator.currentLevel);
  
  // 计算当前阶段
  const currentStage = stage.totalPoints === 14 ? 1 : stage.totalPoints === 28 ? 2 : stage.totalPoints === 42 ? 3 : 0;
  
  let statusText = '';
  if (stage.totalPoints === 0) {
    statusText = '需精二30级解锁养成';
  } else if (totalAdded >= 42) {
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
    ${renderGuidanceStones(stones, operator, currentStage)}
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
      
      ${renderResourcePanel(state.talentPoints, state.weightParamN)}
      
      <div class="main-content">
        <aside class="operator-list">
          <h2>干员列表</h2>
          <div class="operators">
            ${state.operators.map(op => renderOperatorCard(op, op.id === state.selectedOperator)).join('')}
          </div>
        </aside>
        
        <main class="operator-detail">
          ${selectedOperator ? renderOperatorDetail(selectedOperator, state.talentPoints, lastUpgradedTalent, state.weightParamN, state.guidanceStones) : renderEmptyState()}
        </main>
      </div>
    </div>
  `;
}

// 渲染干员详情
function renderOperatorDetail(
  operator: Operator, 
  talentPoints: number, 
  lastUpgradedTalent: string | null, 
  n: number,
  guidanceStones: GuidanceStone[]
): string {
  const cost = getCostPerUpgrade(operator);
  const remaining = getRemainingPointsInStage(operator);
  
  // 获取所有选中的引导石
  const selectedStones = guidanceStones.filter(s => s.selected && s.count > 0);
  
  // 检查是否有符合引导石交集条件的属性
  let hasMatchingTalentForStones = true;
  if (selectedStones.length > 0) {
    const upgradableTalents = operator.talents.filter(t => t.current < t.currentMax);
    const matchingTalents = upgradableTalents.filter(t => 
      selectedStones.every(stone => isTalentMatchGuidanceStone(t.name, stone.type))
    );
    hasMatchingTalentForStones = matchingTalents.length > 0;
  }
  
  // 只有天赋点足够、有剩余点数、且有符合引导石条件的属性时才能加点
  const canUpgrade = talentPoints >= cost && remaining > 0 && hasMatchingTalentForStones;
  
  // 计算该干员中最大的总上限，用于进度条比例
  const maxTotalMax = Math.max(...operator.talents.map(t => t.totalMax));
  
  // 获取当前选中的引导石类型（用于高亮显示）
  const selectedStoneTypes = selectedStones.map(s => s.type);
  
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
          ${operator.talents.map(t => {
            // 判断是否被引导石高亮
            const isHighlighted = selectedStoneTypes.length === 0 || 
              selectedStoneTypes.some(stoneType => isTalentMatchGuidanceStone(t.name, stoneType));
            return renderTalentBar(t, t.name === lastUpgradedTalent, maxTotalMax, n, isHighlighted);
          }).join('')}
        </div>
      </div>
      
      ${renderUpgradePanel(operator, canUpgrade, guidanceStones, n)}
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
