import logging
from .sensors.today import ChePowerTodaySensor
from .sensors.tomorrow import ChePowerTomorrowSensor
from .sensors.time_to_outage import ChePowerTimeToOutageSensor
from .sensors.current_state import ChePowerCurrentStateSensor
from .sensors.next_state import ChePowerNextStateSensor
from .sensors.time_to_state_change import ChePowerTimeToStateChangeSensor
from .sensors.current_stage_percent import ChePowerCurrentStagePercentSensor
from .const import CONF_QUEUE

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass, entry, async_add_entities):
    queue = entry.options.get(CONF_QUEUE, entry.data.get(CONF_QUEUE))

    entities = [
        ChePowerTodaySensor(_LOGGER, queue),
        ChePowerTomorrowSensor(_LOGGER, queue),
        ChePowerTimeToOutageSensor(hass, _LOGGER),
        ChePowerCurrentStateSensor(hass, _LOGGER),
        ChePowerNextStateSensor(hass, _LOGGER),
        ChePowerTimeToStateChangeSensor(hass, _LOGGER),
        ChePowerCurrentStagePercentSensor(hass, _LOGGER)
    ]

    async_add_entities(entities, True)