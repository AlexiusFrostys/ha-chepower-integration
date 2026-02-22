const CARD_STYLES = `
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
  .card-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 16px;
    gap: 20px;
    flex-wrap: wrap;
  }
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
  .chart-container {
    flex: 0 0 120px;
    height: 120px;
    position: relative;
  }
  .info-table {
    flex: 1;
    min-width: 150px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  td {
    padding: 8px 0;
    border-bottom: 1px solid var(--divider-color);
    white-space: nowrap;
  }
  circle { fill: none; stroke-width: 4; transform: rotate(-90deg); transform-origin: 50% 50%; }
  .bg { stroke: var(--secondary-background-color); }
  .progress { stroke: var(--orange-color, #ff9800); stroke-linecap: butt; transition: stroke-dasharray 0.6s ease; }
  .percentage { font-size: 0.6em; font-weight: bold; fill: var(--primary-text-color); }
  #off_light_text{fill: #cd0000;}
  #on_light_text{fill: #009800;}
  /* Контейнер для всех интервалов */
  .time-container-flex {
    display: flex;
    flex-wrap: wrap;     /* Разрешает перенос на новую строку, если не влезает */
    gap: 4px;            /* Расстояние между плашками */
    padding: 5px 0;
  }

  /* Стили самих плашек (пример) */
  .label-state-on, .label-state-off {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap; /* Чтобы время внутри одной плашки не разрывалось */
    display: inline-block;
  }

  .label-state-on {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  .label-state-off {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
  }
`;

const circleHtml = `
          <style>${CARD_STYLES}</style>
          <div class="card-content">
            <button class="reload-button" id="reload_btn" title="примусове оновлення даних" style="--tooltip: 'примусове оновлення даних';">
              ↻<span class="reload-button-timer" id="reload_timer" style="display:none;">60</span>
            </button>
            <div class="chart-container">
              <svg viewBox="0 0 36 36" id="svg_view_box">
                <circle class="bg" cx="18" cy="18" r="16"></circle>
                <text x="18" y="17.5" class="percentage" text-anchor="middle" id="off_light_text">0%</text>
                <text x="18" y="25.5" class="percentage" text-anchor="middle" id="on_light_text">0%</text>
                <line id="time_pointer" x1="18" y1="6" x2="18" y2="4" stroke="#0fdadc" stroke-width="1" stroke-linecap="round" />
              </svg>
            </div>
            <div class="info-table" id="data_table"></div>
          </div>
`;

export class CircleTemplate {
    static render() {
        return circleHtml;
    }

    static update(stateObj, container) {
      // Inti reload button
      const reloadBtn = container.querySelector('#reload_btn');
      if (reloadBtn && !reloadBtn._reloadInitialized) {
        reloadBtn._reloadInitialized = true;
        reloadBtn.addEventListener('click', (e) => {
          this._handleReload(e, stateObj, container);
        });
      }

      const svg = container.querySelector('#svg_view_box');
      const totalDayLength = 86400;
      const circumference = 2 * Math.PI * 16;
      let total = 0;
      let segments = [];

      const aData = stateObj.attributes.aData || [];
      if (!aData.length) {
        container.querySelector('#off_light_text').textContent = '—';
        container.querySelector('#on_light_text').textContent = '—';
        svg.querySelectorAll('.progress').forEach(el => el.remove());
        container.querySelector('#data_table').innerHTML = '<div>Дані відсутні</div>';
        return;
      }

      let key = 0;
      aData.forEach((item) => {
        const itemState = (item.queue === 1) ? true : false;
        const itemLength = this._getSecondsDiff(item.time_from, item.time_to);

        if (segments[key] === undefined) {
          segments[key] = {"state": itemState, "start": this._toSeconds(item.time_from), "totalLength": 0};
        }

        if (segments[key].state === itemState) {
          segments[key].totalLength += itemLength;
        } else {
          key++;
          segments[key] = {"state": itemState, "start": this._toSeconds(item.time_from), "totalLength": itemLength};
        }

        if (itemState === false) {
          total += itemLength;
        }
      });

      let infoLabels = '';
      svg.querySelectorAll('.progress').forEach(el => el.remove());
      segments.forEach((segment) => {
        const sectorLength = (segment.totalLength / totalDayLength) * circumference;
        const offset = (segment.start / totalDayLength) * circumference;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('class', 'progress');
        circle.setAttribute('cx', '18');
        circle.setAttribute('cy', '18');
        circle.setAttribute('r', '16');
        
        circle.style.fill = 'none';
        circle.style.stroke = (segment.state === true) ? '#009800' : '#cd0000';
        circle.style.strokeDasharray = `${sectorLength} ${circumference}`;
        circle.style.strokeDashoffset = -offset;

        svg.insertBefore(circle, svg.querySelector('.percentage'));

        infoLabels += '<div class="label-state-' + ((segment.state == true) ? 'on' : 'off') + '">' + this._formatTimeInterval(segment.start) + ' - ' + this._formatTimeInterval(segment.start + segment.totalLength) + '</div>';
      });

      const offLightPercent = Math.min(Math.round((total / totalDayLength) * 100), 100);
      container.querySelector('#off_light_text').textContent = `${offLightPercent}%`;
      container.querySelector('#on_light_text').textContent = `${100 - offLightPercent}%`;
      container.querySelector('#data_table').innerHTML = `
          <table>
              <tr><td><b>Час без світла:</b></td><td style="text-align:right">&nbsp;${this._formatTimeInterval(total)}</td></tr>
              <tr><td collspan=2><div class="time-container-flex">${infoLabels}</div></td></tr>
          </table>
      `;    
      this._updateTimePointer(container);

      setInterval(() => {
          this._updateTimePointer(container);
      }, 1000);        
    }

    static _updateTimePointer(container) {
        const pointer = container.querySelector('#time_pointer');
        if (!pointer) return;

        const now = new Date();
        const secondsSinceDayStart = 
            (now.getHours() * 3600) + 
            (now.getMinutes() * 60) + 
            now.getSeconds();
        const degrees = (secondsSinceDayStart / 86400) * 360;

        pointer.setAttribute('transform', `rotate(${degrees}, 18, 18)`);
    }    

    static _addTimeLabel(svg, seconds, radius) {      
      const angle = (seconds / 86400) * 2 * Math.PI - Math.PI / 2;

      const x = 18 + radius * Math.cos(angle);
      const y = 18 + radius * Math.sin(angle);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('class', 'time-label');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.style.fontSize = '3.5px';
      text.style.fill = '#666';
      text.textContent = this._formatTimeInterval(seconds);

      svg.appendChild(text);
    }    

    static _getSecondsDiff(start, end) {
      if (end === '00:00') {
        end = '24:00'
      }
      const diff = this._toSeconds(start) - this._toSeconds(end);
      
      return Math.abs(diff);
    }

    static _formatTimeInterval(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const hDisplay = String(hours).padStart(2, '0');
      const mDisplay = String(minutes).padStart(2, '0');

      return `${hDisplay}:${mDisplay}`;
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