/*
 * ========================================================================
 * 明日方舟天赋养成模拟器 - 主程序
 * 
 * 【版本标记 v1.0 - 基础版本完成】
 * 日期: 2024
 * 功能: 完整的九属性养成系统原型
 * 
 * 特性:
 * - 阿米娅/星熊两名干员数据
 * - 30/50/70级三阶段解锁机制
 * - 加权随机加点算法 (参数n可调)
 * - 资源管理与手动输入
 * 
 * 如需回退，请回到此版本
 * ========================================================================
 */

import type { GameState, Operator } from './types';
import { createInitialOperators, updateOperatorLevel, resetOperator } from './data';
import { upgradeTalent, applyUpgrade, getTotalAddedPoints, getRemainingPointsInStage, getCostPerUpgrade } from './gameLogic';
import { renderApp } from './ui';
import { createInitialGuidanceStones, createInitialCritStones } from './types';
import './style.css';

// 初始状态
const initialState: GameState = {
  talentPoints: 1120,
  selectedOperator: 'amiya',
  operators: createInitialOperators(),
  weightParamN: 0.3,
  guidanceStones: createInitialGuidanceStones(),
  critEnabled: true,
  critRate: 0.2,  // 默认20%
  critStones: createInitialCritStones(),
  nextCritGuaranteed: false,
};

// 全局状态
let state: GameState = { ...initialState };
let lastUpgradedTalent: string | null = null;
let lastIsCrit: boolean = false;
let lastAddedPoints: number = 1;

// 初始化应用
function initApp(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App element not found');
    return;
  }

  render();
  attachEventListeners();
}

// 渲染应用
function render(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = renderApp(state, lastUpgradedTalent, lastIsCrit, lastAddedPoints);
  attachEventListeners();
}

// 绑定事件监听
function attachEventListeners(): void {
  // 天赋点输入框
  const talentPointsInput = document.getElementById('talent-points-input') as HTMLInputElement;
  if (talentPointsInput) {
    talentPointsInput.addEventListener('change', (e) => {
      const newValue = parseInt((e.target as HTMLInputElement).value);
      setTalentPoints(newValue);
    });
  }

  // 权重参数n输入框
  const weightParamNInput = document.getElementById('weight-param-n') as HTMLInputElement;
  if (weightParamNInput) {
    weightParamNInput.addEventListener('change', (e) => {
      const newValue = parseFloat((e.target as HTMLInputElement).value);
      setWeightParamN(newValue);
    });
  }

  // 干员选择
  document.querySelectorAll('.operator-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const operatorId = (e.currentTarget as HTMLElement).dataset.operatorId;
      if (operatorId) {
        selectOperator(operatorId);
      }
    });
  });

  // 等级调整按钮
  document.querySelectorAll('.btn-level').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const delta = parseInt((e.currentTarget as HTMLElement).dataset.delta || '0');
      adjustLevel(delta);
    });
  });

  // 等级输入框
  const levelInput = document.getElementById('level-input') as HTMLInputElement;
  if (levelInput) {
    levelInput.addEventListener('change', (e) => {
      const newLevel = parseInt((e.target as HTMLInputElement).value);
      setLevel(newLevel);
    });
  }

  // 加点按钮
  const upgradeBtn = document.getElementById('btn-upgrade');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', handleUpgrade);
  }

  // 重置按钮
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }

  // 引导石复选框
  document.querySelectorAll('.stone-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const stoneType = (e.currentTarget as HTMLElement).dataset.stoneType;
      const isChecked = (e.target as HTMLInputElement).checked;
      if (stoneType) {
        toggleGuidanceStone(stoneType, isChecked);
      }
    });
  });

  // 暴击开关
  const critEnabledCheckbox = document.getElementById('crit-enabled') as HTMLInputElement;
  if (critEnabledCheckbox) {
    critEnabledCheckbox.addEventListener('change', (e) => {
      const isChecked = (e.target as HTMLInputElement).checked;
      setCritEnabled(isChecked);
    });
  }

  // 暴击概率输入框
  const critRateInput = document.getElementById('crit-rate') as HTMLInputElement;
  if (critRateInput) {
    critRateInput.addEventListener('change', (e) => {
      const newValue = parseInt((e.target as HTMLInputElement).value);
      setCritRate(newValue / 100);  // 转换为小数
    });
  }

  // 暴击石复选框
  document.querySelectorAll('.crit-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const critType = (e.currentTarget as HTMLElement).dataset.critType;
      const isChecked = (e.target as HTMLInputElement).checked;
      if (critType) {
        toggleCritStone(critType, isChecked);
      }
    });
  });
}

// 添加天赋点
function addTalentPoints(amount: number): void {
  state = {
    ...state,
    talentPoints: Math.max(0, state.talentPoints + amount),
  };
  updateResourceDisplay();
  updateUpgradeButton();
}

// 设置天赋点（直接输入）
function setTalentPoints(value: number): void {
  state = {
    ...state,
    talentPoints: Math.max(0, value),
  };
  updateResourceDisplay();
  updateUpgradeButton();
}

// 设置权重参数n
function setWeightParamN(value: number): void {
  state = {
    ...state,
    weightParamN: Math.max(0, value),
  };
  render();
}

// 切换引导石选择
function toggleGuidanceStone(stoneType: string, isSelected: boolean): void {
  const combatTypes = ['攻', '防', '辅'];
  const natureTypes = ['生理', '心理'];
  
  state = {
    ...state,
    guidanceStones: state.guidanceStones.map(stone => {
      // 如果点击的是当前石头，切换状态
      if (stone.type === stoneType) {
        return { ...stone, selected: isSelected };
      }
      
      // 互斥逻辑：攻/防/辅互斥
      if (combatTypes.includes(stoneType) && combatTypes.includes(stone.type)) {
        return { ...stone, selected: false };
      }
      
      // 互斥逻辑：生理/心理互斥
      if (natureTypes.includes(stoneType) && natureTypes.includes(stone.type)) {
        return { ...stone, selected: false };
      }
      
      return stone;
    }),
  };
  
  render();
}

// 设置暴击开关
function setCritEnabled(enabled: boolean): void {
  state = {
    ...state,
    critEnabled: enabled,
  };
  render();
}

// 设置暴击概率
function setCritRate(rate: number): void {
  state = {
    ...state,
    critRate: Math.max(0, Math.min(1, rate)),
  };
  render();
}

// 切换暴击石选择
function toggleCritStone(critType: string, isSelected: boolean): void {
  state = {
    ...state,
    critStones: state.critStones.map(stone => {
      // 暴击石之间互斥，只能选一个
      if (stone.type === critType) {
        return { ...stone, selected: isSelected };
      }
      return { ...stone, selected: false };
    }),
  };
  render();
}

// 选择干员
function selectOperator(operatorId: string): void {
  lastUpgradedTalent = null;
  lastIsCrit = false;
  lastAddedPoints = 1;
  state = {
    ...state,
    selectedOperator: operatorId,
  };
  render();
}

// 调整等级
function adjustLevel(delta: number): void {
  const currentOperator = state.operators.find(o => o.id === state.selectedOperator);
  if (!currentOperator) return;

  const newLevel = Math.max(1, Math.min(70, currentOperator.currentLevel + delta));
  setLevel(newLevel);
}

// 设置等级
function setLevel(level: number): void {
  const clampedLevel = Math.max(1, Math.min(70, level));
  const currentOperator = state.operators.find(o => o.id === state.selectedOperator);
  if (!currentOperator || currentOperator.currentLevel === clampedLevel) return;

  lastUpgradedTalent = null;

  // 更新干员等级和当前上限
  const updatedOperators = state.operators.map(op => {
    if (op.id !== state.selectedOperator) return op;
    return updateOperatorLevel(op, clampedLevel);
  });

  state = {
    ...state,
    operators: updatedOperators,
  };

  render();
}

// 处理加点
function handleUpgrade(): void {
  if (!state.selectedOperator) return;

  const operator = state.operators.find(o => o.id === state.selectedOperator);
  if (!operator) return;

  // 检查是否可以加点
  const cost = getCostPerUpgrade(operator);
  if (state.talentPoints < cost) {
    showToast('天赋点不足！', 'error');
    return;
  }

  const remaining = getRemainingPointsInStage(operator);
  if (remaining <= 0) {
    showToast('当前阶段已加满，请提升等级！', 'warning');
    return;
  }

  // 执行加点
  const result = upgradeTalent(state, state.selectedOperator);
  
  if (result.success && result.upgradedTalent) {
    lastUpgradedTalent = result.upgradedTalent;
    lastIsCrit = result.isCrit || false;
    lastAddedPoints = result.addedPoints || 1;
    state = applyUpgrade(state, result, state.selectedOperator);
    
    updateResourceDisplay();
    render();
    
    const stoneMsg = result.consumedStone ? ` (消耗引导石-${result.consumedStone})` : '';
    const critMsg = result.isCrit ? ' 暴击！' : '';
    showToast(`${operator.name} 的 ${result.upgradedTalent} 提升了${critMsg}！${stoneMsg}`, 'success');
    
    // 清除飘字动画状态
    setTimeout(() => {
      lastUpgradedTalent = null;
      lastIsCrit = false;
      lastAddedPoints = 1;
    }, 1000);
  } else {
    showToast(result.message, 'error');
  }
}

// 处理重置
function handleReset(): void {
  if (!state.selectedOperator) return;

  const operator = state.operators.find(o => o.id === state.selectedOperator);
  if (!operator) return;

  const totalAdded = getTotalAddedPoints(operator);
  if (totalAdded === 0) {
    showToast('该干员还没有养成进度', 'info');
    return;
  }

  // 返还天赋点（返还比例可以根据需求调整，这里全额返还）
  let refundedPoints = 0;
  if (totalAdded <= 14) {
    refundedPoints = totalAdded * 10;
  } else if (totalAdded <= 28) {
    refundedPoints = 14 * 10 + (totalAdded - 14) * 20;
  } else {
    refundedPoints = 14 * 10 + 14 * 20 + (totalAdded - 28) * 50;
  }

  const updatedOperators = state.operators.map(op => {
    if (op.id !== state.selectedOperator) return op;
    return resetOperator(op);
  });

  lastUpgradedTalent = null;
  state = {
    ...state,
    talentPoints: state.talentPoints + refundedPoints,
    operators: updatedOperators,
    // 一键清零后引导石回退到初始状态（每种10个）
    guidanceStones: createInitialGuidanceStones(),
    // 一键清零后暴击石回退到初始状态（每种5个）
    critStones: createInitialCritStones(),
  };

  render();
  showToast(`已重置养成进度，返还 ${refundedPoints} 天赋点，引导石和暴击石已回退`, 'success');
}

// 更新资源显示
function updateResourceDisplay(): void {
  const resourceValue = document.getElementById('talent-points');
  if (resourceValue) {
    resourceValue.textContent = state.talentPoints.toString();
  }
}

// 更新加点按钮状态
function updateUpgradeButton(): void {
  const upgradeBtn = document.getElementById('btn-upgrade') as HTMLButtonElement;
  if (!upgradeBtn || !state.selectedOperator) return;

  const operator = state.operators.find(o => o.id === state.selectedOperator);
  if (!operator) return;

  const cost = getCostPerUpgrade(operator);
  const remaining = getRemainingPointsInStage(operator);
  const canUpgrade = state.talentPoints >= cost && remaining > 0;

  upgradeBtn.disabled = !canUpgrade;
  upgradeBtn.classList.toggle('disabled', !canUpgrade);
}

// 显示提示
function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
  // 移除现有的toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const colors = {
    success: '#4cd137',
    error: '#e84118',
    warning: '#fbc531',
    info: '#00a8ff',
  };

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #2f3640;
    border: 2px solid ${colors[type]};
    color: white;
    padding: 15px 30px;
    border-radius: 10px;
    font-size: 1rem;
    z-index: 1000;
    animation: slideDown 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);
