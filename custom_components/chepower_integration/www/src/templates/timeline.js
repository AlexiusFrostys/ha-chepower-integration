const TIMELINE_STYLES = `
  :host {
    display: block;
    height: auto;
  }
  ha-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--card-background-color, white);
    position: relative;
  }
  .timeline-wrapper {
    padding: 12px 16px 16px 16px;
    box-sizing: border-box;
  }

  /* ── Кнопка перезагрузки ── */
  .reload-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    color: #999;
    border: 1px solid #ccc;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    transition: all 0.3s ease;
    box-shadow: none;
    z-index: 100;
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

  /* ── Верхняя панель ── */
  .timeline-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }

  /* Левая плашка состояния */
  .status-card {
    flex: 1;
    min-width: 200px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid transparent;
  }
  .status-card.on {
    background: #e8f5e9;
    border-color: #c8e6c9;
  }
  .status-card.off {
    background: #ffebee;
    border-color: #ffcdd2;
  }
  .status-title {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 4px 0;
  }
  .status-card.on  .status-title { color: #2e7d32; }
  .status-card.off .status-title { color: #c62828; }
  .status-subtitle {
    font-size: 13px;
    color: var(--secondary-text-color, #555);
    margin: 0;
  }
  .status-subtitle b {
    font-size: 15px;
    font-family: monospace;
  }
  .status-card.on  .status-subtitle b { color: #2e7d32; }
  .status-card.off .status-subtitle b { color: #c62828; }

  /* Правый блок статистики */
  .stats-block {
    min-width: 160px;
    padding: 4px 0;
  }
  .stats-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--secondary-text-color, #666);
    margin: 0 0 6px 0;
  }
  .stats-row {
    font-size: 13px;
    color: var(--secondary-text-color, #666);
    margin: 3px 0;
  }
  .stats-row b {
    color: var(--primary-text-color, #333);
    font-weight: bold;
  }

  /* ── Таймлайн ── */
  .timeline-outer {
    position: relative;
    width: 100%;
  }
  .timeline-labels {
    position: relative;
    height: 24px;
  }
  .timeline-label {
    position: absolute;
    font-size: 11px;
    color: var(--secondary-text-color, #666);
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .timeline-label::after {
    content: '▼';
    display: block;
    text-align: center;
    font-size: 8px;
    line-height: 1;
    color: var(--secondary-text-color, #666);
  }
  .timeline-bar {
    position: relative;
    width: 100%;
    height: 64px;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
  }
  .timeline-segment {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .timeline-segment.on  { background-color: #4caf50; }
  .timeline-segment.off { background-color: #f44336; }
  .segment-label {
    font-size: 13px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    white-space: nowrap;
    pointer-events: none;
    padding: 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Линия текущего времени */
  .time-pointer {
    position: absolute;
    top: -26px;
    bottom: 0;
    width: 2px;
    heiight: 90px;
    background: #2196f3;
    z-index: 10;
    display: none;
    border-left: 1px solid #FFF;
    border-right: 1px solid #FFF;
  }
  .time-badge {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: #f9a825;
    color: #1a237e;
    font-size: 13px;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 11;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  }
  #status_card {
    max-width: 400px;
  }
`;

const timelineHtml = `
  <style>${TIMELINE_STYLES}</style>
  <button class="reload-button" id="reload_btn" title="примусове оновлення даних">
    ↻<span class="reload-button-timer" id="reload_timer" style="display:none;">60</span>
  </button>
  <div class="timeline-wrapper">
    <div class="timeline-header">

      <div class="status-card" id="status_card">
        <p class="status-title" id="status_title">—</p>
        <p class="status-subtitle" id="status_subtitle"></p>
      </div>

      <div class="stats-block">
        <p class="stats-row">- загалом без світла: <b id="stat_off">—</b></p>
        <p class="stats-row">- загалом зі світлом: <b id="stat_on">—</b></p>
      </div>

    </div>
    <div class="timeline-outer">
      <div class="timeline-labels" id="timeline_labels"></div>
      <div style="position:relative;">
        <div class="timeline-bar" id="timeline_bar"></div>
        <div class="time-pointer" id="time_pointer">
          <div class="time-badge" id="time_badge"></div>
        </div>
      </div>
    </div>
  </div>
`;

export class TimelineTemplate {
    static render() {
        return timelineHtml;
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

        const totalDayLength = 86400;
        let segments = [];
        let key = 0;

        const aData = stateObj.attributes.aData || [];
        if (!aData.length) {
            container.querySelector('#status_title').textContent = '—';
            container.querySelector('#status_subtitle').textContent = 'Дані відсутні';
            container.querySelector('#stat_off').textContent = '—';
            container.querySelector('#stat_on').textContent = '—';
            container.querySelector('#timeline_bar').innerHTML = '<div>Дані відсутні</div>';
            container.querySelector('#timeline_labels').innerHTML = '';
            if (container._timelineInterval) clearInterval(container._timelineInterval);
            return;
        }

        aData.forEach((item) => {
            const itemState = (item.queue === 1) ? true : false;
            const itemLength = this._getSecondsDiff(item.time_from, item.time_to);

            if (segments[key] === undefined) {
                segments[key] = { state: itemState, start: this._toSeconds(item.time_from), totalLength: 0 };
            }

            if (segments[key].state === itemState) {
                segments[key].totalLength += itemLength;
            } else {
                key++;
                segments[key] = { state: itemState, start: this._toSeconds(item.time_from), totalLength: itemLength };
            }
        });

        this._renderBar(container, segments, totalDayLength);
        this._renderLabels(container, segments, totalDayLength);
        this._renderStats(container, segments);
        this._updateTimePointer(container, segments, totalDayLength);

        if (container._timelineInterval) clearInterval(container._timelineInterval);
        container._timelineInterval = setInterval(() => {
            this._updateTimePointer(container, segments, totalDayLength);
        }, 1000);
    }

    static _renderBar(container, segments, totalDayLength) {
        const bar = container.querySelector('#timeline_bar');
        bar.innerHTML = '';

        segments.forEach((segment) => {
            const widthPct = (segment.totalLength / totalDayLength) * 100;
            const hours = Math.floor(segment.totalLength / 3600);
            const minutes = Math.floor((segment.totalLength % 3600) / 60);

            const el = document.createElement('div');
            el.className = 'timeline-segment ' + (segment.state ? 'on' : 'off');
            el.style.width = widthPct + '%';
            if (widthPct >= 5) {
                el.innerHTML = `<span class="segment-label">${hours}г. ${minutes} хв.</span>`;
            }
            bar.appendChild(el);
        });
    }

    static _renderLabels(container, segments, totalDayLength) {
        const labelsEl = container.querySelector('#timeline_labels');
        labelsEl.innerHTML = '';

        const boundaries = new Set();
        segments.forEach(seg => {
            boundaries.add(seg.start);
            boundaries.add(seg.start + seg.totalLength);
        });

        boundaries.forEach((seconds) => {
            const label = document.createElement('span');
            label.className = 'timeline-label';
            label.style.left = ((seconds / totalDayLength) * 100) + '%';
            label.textContent = seconds === totalDayLength ? '00:00' : this._formatTimeInterval(seconds);
            labelsEl.appendChild(label);
        });
    }

    static _renderStats(container, segments) {
        let totalOn = 0;
        let totalOff = 0;
        segments.forEach(seg => {
            if (seg.state) totalOn += seg.totalLength;
            else totalOff += seg.totalLength;
        });

        container.querySelector('#stat_on').textContent  = this._formatTimeInterval(totalOn);
        container.querySelector('#stat_off').textContent = this._formatTimeInterval(totalOff);
    }

    static _updateTimePointer(container, segments, totalDayLength) {
        const pointer     = container.querySelector('#time_pointer');
        const badge       = container.querySelector('#time_badge');
        const statusCard  = container.querySelector('#status_card');
        const statusTitle = container.querySelector('#status_title');
        const statusSub   = container.querySelector('#status_subtitle');
        if (!pointer || !badge) return;

        const now = new Date();
        const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        // Timeline
        pointer.style.display = 'block';
        pointer.style.left = ((seconds / totalDayLength) * 100) + '%';
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        badge.textContent = `${hh}:${mm}:${ss}`;

        // Current state and time to next change
        let currentSeg = null;
        let nextSeg    = null;
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (seconds >= seg.start && seconds < seg.start + seg.totalLength) {
                currentSeg = seg;
                if (i + 1 < segments.length) nextSeg = segments[i + 1];
                break;
            }
        }

        if (!currentSeg) {
            statusCard.className = 'status-card';
            statusTitle.textContent = '—';
            statusSub.innerHTML = '';
            return;
        }

        statusCard.className = 'status-card ' + (currentSeg.state ? 'on' : 'off');

        if (currentSeg.state) {
            statusTitle.textContent = 'Світло є';
            if (nextSeg) {
                const secsLeft = (currentSeg.start + currentSeg.totalLength) - seconds;
                const nextTime = this._formatTimeInterval(currentSeg.start + currentSeg.totalLength);
                statusSub.innerHTML = `До вимкнення світла о ${nextTime} лишилося: <b>${this._formatCountdown(secsLeft)}</b>`;
            } else {
                statusSub.innerHTML = '';
            }
        } else {
            statusTitle.textContent = 'Світло відсутнє';
            if (nextSeg) {
                const secsLeft = (currentSeg.start + currentSeg.totalLength) - seconds;
                const nextTime = this._formatTimeInterval(currentSeg.start + currentSeg.totalLength);
                statusSub.innerHTML = `До увімкнення світла о ${nextTime} лишилося: <b>${this._formatCountdown(secsLeft)}</b>`;
            } else {
                statusSub.innerHTML = '';
            }
        }
    }

    /** HH:MM:SS for countdown */
    static _formatCountdown(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return String(h).padStart(2, '0') + ':' +
               String(m).padStart(2, '0') + ':' +
               String(s).padStart(2, '0');
    }

    static _getSecondsDiff(start, end) {
        if (end === '00:00') end = '24:00';
        return Math.abs(this._toSeconds(start) - this._toSeconds(end));
    }

    static _formatTimeInterval(totalSeconds) {
        const hours   = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    }

    static _toSeconds(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60;
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