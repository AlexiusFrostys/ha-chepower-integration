import { CircleTemplate } from './templates/circle.js';
import { TimelineTemplate } from './templates/timeline.js';
import { TextTemplate } from './templates/text.js';

export class ChePowerCard extends HTMLElement {
  #fullWidth = false;
  #rendered = false;

  static getStubConfig() {
    return { entity: "", header: "Графік відключень світла", display: 'auto' };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { 
            entity: {
               domain: "sensor",
               integration: "chepower_integration", 
               include_entities: ["sensor.chepower_today_sensor", "sensor.chepower_tomorrow_sensor"]
              } 
          }
        },
        {
          name: "header",
          required: true,
          selector: { text: {} }
        },
        {
          name: "display",
          required: true,
          default: 'auto',
          selector: { select: { options: [
            { value: 'auto', label: 'Автоматично' },
            { value: 'text', label: 'Текстовий вигляд' },
            { value: 'timeline', label: 'Часова шкала (повна ширина)' },
            { value: 'circle', label: 'Коло (компактний)' }
          ] } }
        },
      ],
      computeLabel: (schema) => {
        const labels = {
          entity: "Оберіть сенсор",
          header: "Заголовок картки",
          display: "Вид відображення"
        };
        return labels[schema.name] ?? schema.name;
      },
    };
  }  

  setConfig(config) {
    if (this._config && this._config.entity !== config.entity) {
      this.content = null;
    }
    this._config = config;
    this.#fullWidth = this._getWidthState(config);
  }

  set hass(hass) {
    if (!this._config || !hass) return;

    const {entityId, stateObj} = this._getEntityIdAndStateObj(hass);
    
    if (!entityId || !stateObj) return;

    let presenter;
    if (this._config.display === 'text') {
      presenter = TextTemplate;
    } else if (this._config.display === 'timeline') {
      presenter = TimelineTemplate;
    } else if (this._config.display === 'circle') {
      presenter = CircleTemplate;
    } else {
      presenter = (this.#fullWidth === false) ? CircleTemplate : TimelineTemplate;
    }

    if (this.#rendered === false) {
      this.#rendered = true;
      this.innerHTML = `
        <ha-card header="${this._config.header || 'Графік відключень світла'}">
        ${presenter.render()}
        </ha-card>
      `;      
    }

    this._updateContent(stateObj, presenter);
  }

  _getEntityIdAndStateObj(hass) {
    let result = {};

    const entityId = this._config.entity;

    if (!entityId) {
      result.entityId = false;
      this.innerHTML = `
        <ha-card style="padding: 16px; text-align: center;">
          <ha-alert alert-type="warning">Будь ласка, оберіть сенсор</ha-alert>
        </ha-card>`;
    } else {result.entityId = (entityId === undefined) ? false : entityId;}

    if (result.entityId !== false) {
    const stateObj = hass.states[entityId];

      if (!stateObj) {
        result.stateObj = false;
        this.innerHTML = `
          <ha-card style="padding: 16px;">
            <ha-alert alert-type="error">Сенсор не знайдено: ${entityId}</ha-alert>
          </ha-card>`;
        return result;
      } else {result.stateObj = (stateObj === undefined) ? false : stateObj;}
    } else {result.stateObj = false;}

    return result;
  }

  _getWidthState(config) {
    return ((config.grid_options && config.grid_options.columns === 'full' || config.layout_options && config.layout_options.grid_columns >= 4) === true); 
  }
  
  _updateContent(stateObj, presenter) {
    if (!this._config.entity) {
      return;
    }

    presenter.update(stateObj, this);
  }
}

customElements.define('chepower-card', ChePowerCard);