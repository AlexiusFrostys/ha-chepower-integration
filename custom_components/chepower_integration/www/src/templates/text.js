const TEXT_STYLES = `
  :host { display: block; }
  .text-wrapper { 
    padding: 8px 12px; 
    box-sizing: border-box; 
    font-family: var(--ha-font-family, Roboto, Arial); 
    position: relative;
  }
  .summary { 
    display:flex; 
    gap:12px; 
    align-items:center; 
    margin-bottom:8px; 
    font-size:13px;
    justify-content: space-between;
  }
  .summary .label { color: var(--secondary-text-color, #666); }
  .summary .value { font-weight: bold; }
  .segment { padding: 6px 0; border-bottom: 1px dashed rgba(0,0,0,0.06); font-size:13px; display:flex; justify-content:space-between; align-items:center; }
  .segment .times { color: var(--secondary-text-color, #666); }
  .state-badge { display: inline-block; padding: 2px 8px; border-radius: 8px; color: #fff; font-weight: 600; font-size:12px; }
  .state-on { background: #4caf50; }
  .state-off { background: #e33535; }
  .state-mid { background: #9e9e9e; }
  .compact { max-height: 240px; overflow:auto; }
  .reload-button {
    background: transparent;
    color: #999;
    border: 1px solid #ccc;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    transition: all 0.3s ease;
    flex-shrink: 0;
    padding: 0;
  }
  .reload-button:hover:not(:disabled) {
    border-color: #999;
    color: #666;
  }
  .reload-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .reload-button.timer-active {
    color: transparent;
  }
  .reload-button-timer {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 19px;
    font-weight: bold;
    color: #999;
    min-width: 20px;
    text-align: center;
    display: none;
  }
`;

const textHtml = `
  <style>${TEXT_STYLES}</style>
  <div class="text-wrapper">
    <div class="summary">
      <div><span class="label">Без світла (сьогодні):</span> <span id="total_off" class="value">—</span></div>
      <div><span class="label">Із світлом:</span> <span id="total_on" class="value">—</span></div>
      <button class="reload-button" id="reload_btn" title="примусове оновлення даних">
        ↻<span class="reload-button-timer" id="reload_timer" style="display:none;">60</span>
      </button>
    </div>
    <div id="text_content" class="compact">—</div>
  </div>
`;

export class TextTemplate {
  static render() {
    return textHtml;
  }

  static update(stateObj, container) {
    // Init reload button
    const reloadBtn = container.querySelector('#reload_btn');
    if (reloadBtn && !reloadBtn._reloadInitialized) {
      reloadBtn._reloadInitialized = true;
      reloadBtn.addEventListener('click', (e) => {
        this._handleReload(e, stateObj, container);
      });
    }

    const el = container.querySelector('#text_content');
    const totalOffEl = container.querySelector('#total_off');
    const totalOnEl = container.querySelector('#total_on');
    if (!el || !totalOffEl || !totalOnEl) return;

    const segments = stateObj.attributes.aData || [];
    const states = stateObj.attributes.aState || {};

    if (!segments.length) {
      el.innerHTML = '<div>Дані відсутні</div>';
      totalOffEl.textContent = '—';
      totalOnEl.textContent = '—';
      return;
    }

    let totalOff = 0;
    let totalOn = 0;

    const rows = segments.map((s) => {
      const q = s.queue;
      const stateInfo = states[q] || {};
      const name = stateInfo.name || (q === 3 ? 'Відключення' : 'Світло');
      const cls = (q === 3) ? 'state-off' : (q === 1 ? 'state-on' : 'state-mid');

      const start = this._toSeconds(s.time_from);
      const end = this._toSeconds(s.time_to === '00:00' ? '24:00' : s.time_to);
      const len = Math.max(0, end - start);

      if (q === 3) totalOff += len; else totalOn += len;

      return `<div class="segment"><div class="times">${s.time_from} — ${s.time_to}</div><div><span class="state-badge ${cls}">${name}</span></div></div>`;
    });

    totalOffEl.textContent = this._formatTimeInterval(totalOff);
    totalOnEl.textContent = this._formatTimeInterval(totalOn);
    el.innerHTML = rows.join('');
  }

  static _toSeconds(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 3600 + (minutes || 0) * 60;
  }

  static _formatTimeInterval(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}г ${minutes}хв`;
  }

  static _handleReload(e, stateObj, container) {
    e.preventDefault();
    const btn = container.querySelector('#reload_btn');
    if (btn.disabled) return;

    const entityId = stateObj.entity_id;
    if (!entityId) return;

    // Call Home Assistant service to update the entity
    const hass = this._getHass(container);
    if (hass) {
      hass.callService('homeassistant', 'update_entity', { entity_id: entityId });
    }

    // Disable the button and start the timer
    this._disableButtonWithTimer(container, 60);
  }

  static _disableButtonWithTimer(container, seconds) {
    const btn = container.querySelector('#reload_btn');
    const timerEl = container.querySelector('#reload_timer');
    if (!btn || !timerEl) return;

    btn.disabled = true;
    btn.classList.add('timer-active');
    timerEl.textContent = seconds;
    timerEl.style.display = 'block';

    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      timerEl.textContent = remaining;

      if (remaining <= 0) {
        clearInterval(interval);
        btn.disabled = false;
        btn.classList.remove('timer-active');
        timerEl.style.display = 'none';
      }
    }, 1000);
  }

  static _getHass(container) {
    let el = container;
    while (el) {
      if (el.hass) return el.hass;
      el = el.parentElement;
    }
    return null;
  }
}
