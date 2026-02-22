import logging
from .sensors.today import ChePowerTodaySensor
from .sensors.tomorrow import ChePowerTomorrowSensor
from .const import CONF_QUEUE

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass, entry, async_add_entities):
    queue = entry.options.get(CONF_QUEUE, entry.data.get(CONF_QUEUE))

    entities = [
        ChePowerTodaySensor(_LOGGER, queue),
        ChePowerTomorrowSensor(_LOGGER, queue)
    ]

    async_add_entities(entities, True)