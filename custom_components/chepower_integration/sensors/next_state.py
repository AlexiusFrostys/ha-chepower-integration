from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_time_change
from datetime import datetime

class ChePowerNextStateSensor(Entity):
    def __init__(self, hass, logger):
        self.hass = hass
        self._state = None
        self._logger = logger
        self._attr_should_poll = False
        self._attr_entity_category = "diagnostic"

    @property
    def name(self):
        return "ChePower Next State"

    @property
    def state(self):
        return self._state

    async def async_added_to_hass(self):
        # Refresh every minute to keep the time to outage updated
        async_track_time_change(
            self.hass,
            self._update_current_state,
            minute=range(0, 60),
            second=0
        )
        await self.async_update()
        self.async_write_ha_state()

    async def _update_current_state(self, now):
        await self.async_update()
        self.async_write_ha_state()

    async def async_update(self):
        # Getting today's schedule from the today sensor's attributes
        today_entity = self.hass.states.get("sensor.chepower_today_sensor")
        if not today_entity or not today_entity.attributes.get("aData"):
            self._state = None
            return

        aData = today_entity.attributes["aData"]
        now = datetime.now()
        current_seconds = now.hour * 3600 + now.minute * 60 + now.second

        for item in aData:
            if item["time_to"] == "00:00":
                item["time_to"] = "24:00"
                
            start = self._time_to_seconds(item["time_from"])
            end = self._time_to_seconds(item["time_to"])
            queue = item.get("queue", 1)

            if start <= current_seconds < end:
                self._state = "Off" if queue == 1 else "On"
                return

    @staticmethod
    def _time_to_seconds(time_str: str) -> int:
        hours, minutes = map(int, time_str.split(":"))
        return hours * 3600 + minutes * 60