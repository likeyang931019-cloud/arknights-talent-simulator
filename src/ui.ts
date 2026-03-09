// 明日方舟天赋养成模拟器 - UI组件
import type { Operator, TalentConfig, GameState, GuidanceStone, TalentType, CritStone } from './types';
import { TALENT_COMBAT_TYPE, TALENT_NATURE_TYPE, isTalentMatchGuidanceStone, getStageByLevel } from './types';
import { getTotalAddedPoints, getCostPerUpgrade, getCurrentStagePoints, calculateTalentWeight } from './gameLogic';

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

// 渲染属性条（分段式进度条）
export function renderTalentBar(
  talent: TalentConfig, 
  isUpgraded: boolean, 
  isCrit: boolean,
  addedPoints: number,
  maxTotalMax: number, 
  n: number,
  isHighlighted: boolean = true,
  critEnabled: boolean = true
): string {
  // 根据暴击开关决定是否预留溢出空间
  const showOverflowSlot = critEnabled;
  const displayMax = showOverflowSlot ? talent.totalMax + 1 : talent.totalMax;
  const displayMaxTotal = showOverflowSlot ? maxTotalMax + 1 : maxTotalMax;
  const barWidthPercentage = (displayMax / displayMaxTotal) * 100;
  // 计算权重（新公式）并四舍五入取整
  const weight = Math.round(calculateTalentWeight(talent, n));
  
  // 检查是否超出上限
  const isOverflow = talent.current > talent.totalMax;
  
  // 生成分段式格子（多生成1个用于溢出显示）
  const segments = [];
  for (let i = 0; i < displayMax; i++) {
    const isFilled = i < talent.current;
    const isWithinCurrentStage = i < talent.currentMax;
    const isBeyondStage = i >= talent.currentMax && i < talent.totalMax;
    const isOverflowSlot = i === talent.totalMax; // 最后一个格子是溢出格子
    segments.push({
      isFilled,
      isWithinCurrentStage,
      isBeyondStage,
      isOverflowSlot,
      index: i,
    });
  }
  
  // 暴击时的飘字内容
  const floatingText = isUpgraded 
    ? `<div class="floating-text ${isCrit ? 'crit' : ''}">${isCrit ? '+2' : '+1'}</div>` 
    : '';
  
  // 暴击时，最后addedPoints个格子需要标记
  const upgradedIndices = new Set<number>();
  if (isUpgraded && addedPoints > 0) {
    for (let i = 1; i <= addedPoints; i++) {
      upgradedIndices.add(talent.current - i);
    }
  }
  
  // 数值显示：如果溢出，显示为 "totalMax+"
  const currentValueDisplay = isOverflow ? `${talent.totalMax}+` : talent.current.toString();
  
  return `
    <div class="talent-bar-container ${isHighlighted ? 'highlighted' : 'dimmed'} ${isUpgraded && isCrit ? 'crit-upgrade' : ''} ${isOverflow ? 'overflow' : ''}" data-talent="${talent.name}">
      <div class="talent-header">
        <div class="talent-info-left">
          <span class="talent-name">${talent.name}</span>
          <span class="talent-tags">
            <span class="tag tag-combat">${TALENT_COMBAT_TYPE[talent.name]}</span>
            <span class="tag tag-nature">${TALENT_NATURE_TYPE[talent.name]}</span>
          </span>
          <span class="talent-weight" title="随机权重 (n=${n})">权重:${weight}</span>
        </div>
        <span class="talent-values">
          <span class="current-value ${isUpgraded ? 'upgraded' : ''} ${isCrit ? 'crit' : ''} ${isOverflow ? 'overflow' : ''}">${currentValueDisplay}</span>
          <span class="separator">/</span>
          <span class="current-max">${talent.currentMax}</span>
          <span class="separator">(</span>
          <span class="total-max">${talent.totalMax}${isOverflow ? '+' : ''}</span>
          <span class="separator">)</span>
        </span>
      </div>
      <div class="talent-progress-wrapper segmented ${isUpgraded && isCrit ? 'crit' : ''} ${isOverflow ? 'overflow' : ''}" style="width: ${barWidthPercentage}%">
        <div class="talent-segments">
          ${segments.map((seg, idx) => {
            const isLast = idx === segments.length - 1;
            const isFirst = idx === 0;
            let classes = ['talent-segment'];
            if (seg.isFilled) classes.push('filled');
            else if (seg.isWithinCurrentStage) classes.push('available');
            else if (seg.isBeyondStage) classes.push('locked');
            // 暴击时，最后addedPoints个格子都有特效
            if (isUpgraded && upgradedIndices.has(idx)) {
              classes.push(isCrit ? 'crit-upgraded' : 'upgraded');
            }
            // 溢出格子样式
            if (seg.isOverflowSlot) classes.push('overflow-slot');
            // 溢出格子填充时有特殊样式
            if (seg.isOverflowSlot && seg.isFilled) {
              classes.push('overflow-filled');
            }
            if (isFirst) classes.push('first');
            if (isLast) classes.push('last');
            return `<div class="${classes.join(' ')}"></div>`;
          }).join('')}
        </div>
        ${floatingText}
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
export function renderResourcePanel(talentPoints: number, weightParamN: number, critEnabled: boolean, critRate: number): string {
  return `
    <div class="resource-panel">
      <div class="resource-item">
        <span class="resource-icon">💎</span>
        <span class="resource-name">天赋点</span>
        <input type="number" id="talent-points-input" class="resource-value-input" value="${talentPoints}" min="0" />
      </div>
      <div class="resource-params">
        <div class="resource-param">
          <span class="param-formula" title="权重计算公式">Wi=(1/(v+1)^n)×(max-v)×100</span>
          <span class="param-label">参数n</span>
          <input type="number" id="weight-param-n" class="param-input" value="${weightParamN}" min="0" max="10" step="0.1" />
        </div>
        <div class="crit-control">
          <label class="crit-toggle">
            <input type="checkbox" id="crit-enabled" ${critEnabled ? 'checked' : ''}>
            <span class="crit-toggle-slider"></span>
            <span class="crit-toggle-label">暴击</span>
          </label>
          <div class="crit-rate-control">
            <span class="crit-rate-label">概率</span>
            <input type="number" id="crit-rate" class="crit-rate-input" value="${Math.round(critRate * 100)}" min="0" max="100" step="1" ${!critEnabled ? 'disabled' : ''}>
            <span class="crit-rate-unit">%</span>
          </div>
        </div>
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
        <button class="btn-level" data-delta="-20">-20</button>
        <input type="number" id="level-input" value="${level}" min="1" max="70" />
        <button class="btn-level" data-delta="20">+20</button>
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
  return `阶段${stageNum}${nextUnlock !== '已满' ? ` (下档${nextUnlock}级)` : ''}`;
}

// 渲染暴击石（方案A：单独面板）
export function renderCritStones(
  critStones: CritStone[],
  totalAdded: number,
  critEnabled: boolean
): string {
  // 检查是否有选中的暴击石
  const selectedStone = critStones.find(s => s.selected);
  const selectedIsInhibitor = selectedStone?.isInhibitor ?? false;
  const hasNormalStoneSelected = selectedStone && !selectedStone.isInhibitor;
  
  return `
    <div class="crit-stones-panel ${!critEnabled ? 'disabled' : ''}">
      <div class="crit-stones-title">⚡ 暴击石 ${!critEnabled ? '(暴击已关闭)' : ''}</div>
      <div class="crit-stones-list">
        ${critStones.map(stone => {
          // 检查是否可用（需要暴击开启）
          let isAvailable = critEnabled && totalAdded >= stone.minPoints && totalAdded <= stone.maxPoints;
          
          // 互斥逻辑：抑制暴击石与普通暴击石互斥
          if (isAvailable) {
            if (stone.isInhibitor && hasNormalStoneSelected) {
              // 抑制暴击石：普通暴击石选中时禁用
              isAvailable = false;
            } else if (!stone.isInhibitor && selectedIsInhibitor) {
              // 普通暴击石：抑制暴击石选中时禁用
              isAvailable = false;
            }
          }
          
          const isDisabled = !isAvailable || stone.count === 0;
          
          // 图标映射
          const iconMap: Record<string, string> = {
            '初级': '🟠',
            '高级': '🔴',
            '抑制': '🔵'
          };
          
          return `
            <label class="crit-stone-item ${isDisabled ? 'disabled' : ''} ${stone.selected ? 'selected' : ''} ${stone.isInhibitor ? 'inhibitor' : ''}" 
                   data-crit-type="${stone.type}">
              <input type="checkbox" class="crit-checkbox" 
                     data-crit-type="${stone.type}"
                     ${stone.selected ? 'checked' : ''} 
                     ${isDisabled ? 'disabled' : ''}>
              <span class="stone-icon">${iconMap[stone.type]}</span>
              <span class="stone-name">${stone.name}</span>
              <span class="stone-count">×${stone.count}</span>
              <span class="stone-range">(${stone.minPoints}-${stone.maxPoints === 999 ? '∞' : stone.maxPoints}点)</span>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
export function renderGuidanceStones(
  stones: GuidanceStone[],
  operator: Operator,
  totalAdded: number
): string {
  // 必须已加14点后才可使用引导石
  const canUseStones = totalAdded >= 14;
  
  // 计算引导石消耗倍数：14-27点1倍，28点以上2倍
  const stoneCostMultiplier = totalAdded >= 28 ? 2 : 1;
  
  // 检查干员拥有的属性类型
  const operatorTalents = operator.talents.map(t => t.name);
  const hasCombatType = (type: '攻' | '防' | '辅') => 
    operatorTalents.some(t => TALENT_COMBAT_TYPE[t] === type);
  const hasNatureType = (type: '生理' | '心理') => 
    operatorTalents.some(t => TALENT_NATURE_TYPE[t] === type);
  
  // 检查是否有选中的互斥组
  const combatSelected = stones.find(s => ['攻', '防', '辅'].includes(s.type) && s.selected);
  const natureSelected = stones.find(s => ['生理', '心理'].includes(s.type) && s.selected);
  
  // 消耗倍数显示文本
  const costText = stoneCostMultiplier > 1 ? `（消耗×${stoneCostMultiplier}）` : '';
  
  return `
    <div class="guidance-stones-panel">
      <div class="guidance-stones-title">引导石 (加14点后可用)${costText}</div>
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
          
          // 检查数量是否足够（28点以上需要2个）
          const hasEnoughCount = stone.count >= stoneCostMultiplier;
          
          // 最终禁用状态（未加14点前不能使用，或数量不足）
          const isDisabled = !canUseStones || !hasMatchingTalent || isMutuallyExcluded || !hasEnoughCount;
          
          // 如果选中，显示消耗数量
          const costDisplay = stone.selected ? `-${stoneCostMultiplier}` : '';
          
          return `
            <label class="guidance-stone-item ${isDisabled ? 'disabled' : ''} ${stone.selected ? 'selected' : ''} ${!hasEnoughCount ? 'insufficient' : ''}" 
                   data-stone-type="${stone.type}">
              <input type="checkbox" class="stone-checkbox" 
                     data-stone-type="${stone.type}"
                     ${stone.selected ? 'checked' : ''} 
                     ${isDisabled ? 'disabled' : ''}>
              <span class="stone-name">${stone.name}</span>
              <span class="stone-count">×${stone.count}${costDisplay}</span>
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
  critStones: CritStone[],
  critEnabled: boolean,
  n: number
): string {
  const cost = getCostPerUpgrade(operator);
  
  // 检查是否有属性未达上限（等级只影响上限，不影响可加多少点）
  const hasUpgradableTalent = operator.talents.some(t => t.current < t.totalMax);
  const totalAdded = getTotalAddedPoints(operator);
  const stage = getStageByLevel(operator.currentLevel);
  
  let statusText = '';
  if (stage.totalPoints === 0) {
    statusText = '需精二30级解锁养成';
  } else if (totalAdded >= 42) {
    statusText = '已满级';
  } else if (!hasUpgradableTalent) {
    statusText = '所有属性已达上限';
  } else {
    statusText = '可继续加点';
  }

  return `
    <div class="upgrade-panel">
      <div class="upgrade-status">${statusText}</div>
      <button class="btn-upgrade ${!canUpgrade ? 'disabled' : ''}" id="btn-upgrade" ${!canUpgrade ? 'disabled' : ''}>
        <span class="btn-text">加点</span>
        <span class="btn-cost">-${cost}</span>
      </button>
      <button class="btn-reset" id="btn-reset">🔄 一键重置（源石x1）</button>
    </div>
    <div class="stones-container">
      ${renderGuidanceStones(stones, operator, totalAdded)}
      ${renderCritStones(critStones, totalAdded, critEnabled)}
    </div>
  `;
}

// 渲染主应用
export function renderApp(state: GameState, lastUpgradedTalent: string | null, lastIsCrit: boolean = false, lastAddedPoints: number = 1): string {
  const selectedOperator = state.operators.find(o => o.id === state.selectedOperator);
  
  return `
    <div class="arknights-talent-simulator">
      <header class="app-header">
        <h1>🎮 明日方舟天赋养成模拟器</h1>
      </header>
      
      ${renderResourcePanel(state.talentPoints, state.weightParamN, state.critEnabled, state.critRate)}
      
      <div class="main-content">
        <aside class="operator-list">
          <h2>干员列表</h2>
          <div class="operators">
            ${state.operators.map(op => renderOperatorCard(op, op.id === state.selectedOperator)).join('')}
          </div>
        </aside>
        
        <main class="operator-detail">
          ${selectedOperator ? renderOperatorDetail(selectedOperator, state.talentPoints, lastUpgradedTalent, lastIsCrit, lastAddedPoints, state.weightParamN, state.guidanceStones, state.critStones, state.critEnabled) : renderEmptyState()}
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
  lastIsCrit: boolean,
  lastAddedPoints: number,
  n: number,
  guidanceStones: GuidanceStone[],
  critStones: CritStone[],
  critEnabled: boolean
): string {
  const cost = getCostPerUpgrade(operator);
  
  // 检查是否有属性未达上限（等级只影响上限，不影响可加多少点）
  const hasUpgradableTalent = operator.talents.some(t => t.current < t.totalMax);
  
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
  
  // 只有天赋点足够、有未达上限属性、且有符合引导石条件的属性时才能加点
  const canUpgrade = talentPoints >= cost && hasUpgradableTalent && hasMatchingTalentForStones;
  
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
            // 判断是否被引导石高亮（交集：必须同时符合所有选中的引导石）
            const isHighlighted = selectedStoneTypes.length === 0 || 
              selectedStoneTypes.every(stoneType => isTalentMatchGuidanceStone(t.name, stoneType));
            return renderTalentBar(t, t.name === lastUpgradedTalent, t.name === lastUpgradedTalent && lastIsCrit, lastAddedPoints, maxTotalMax, n, isHighlighted, critEnabled);
          }).join('')}
        </div>
      </div>
      
      ${renderUpgradePanel(operator, canUpgrade, guidanceStones, critStones, critEnabled, n)}
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
