from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_time_change
from datetime import datetime

class ChePowerTimeToStateChangeSensor(Entity):
    def __init__(self, hass, logger):
        self.hass = hass
        self._state = None
        self._logger = logger
        self._attr_should_poll = False
        self._attr_entity_category = "diagnostic"

    @property
    def name(self):
        return "ChePower Time to next State Change"

    @property
    def state(self):
        return self._state

    async def async_added_to_hass(self):
        # Refresh every minute to keep the time to outage updated
        async_track_time_change(
            self.hass,
            self._update_time_to_outage,
            minute=range(0, 60),
            second=0
        )

    async def _update_time_to_outage(self, now):
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

        current_state = None
        for item in aData:
            if item["time_to"] == "00:00":
                item["time_to"] = "24:00"
                
            if self._time_to_seconds(item["time_from"]) <= current_seconds < self._time_to_seconds(item["time_to"]):
                current_state = "On" if item.get("queue", 1) == 1 else "Off"
                break

        next_state = None
        for i, item in enumerate(aData):
            start = self._time_to_seconds(item["time_from"])
            item_state = "On" if item.get("queue", 1) == 1 else "Off"

            if start > current_seconds:
                if item_state == current_state:
                    continue  # Skip if the state is the same as current
                next_state = start
                break

        if next_state is None:
            next_state = await self._search_in_tomorrow_data(current_state)

        if next_state is None:
            self._state = None
        else:
            seconds_left = next_state - current_seconds
            minutes = seconds_left // 60
            self._state = self._format_time(seconds_left)

    async def _search_in_tomorrow_data(self, current_state) -> int:
        tomorrow_entity = self.hass.states.get("sensor.chepower_tomorrow_sensor")
        if not tomorrow_entity or not tomorrow_entity.attributes.get("aData"):
            return None

        aData = tomorrow_entity.attributes["aData"]
        for item in aData:
            item_state = "On" if item.get("queue", 1) == 1 else "Off"

            if item_state != current_state:
                return self._time_to_seconds("24:00") + self._time_to_seconds(item["time_from"])
        
        return None


    @staticmethod
    def _time_to_seconds(time_str: str) -> int:
        hours, minutes = map(int, time_str.split(":"))
        return hours * 3600 + minutes * 60

    @staticmethod
    def _format_time(seconds: int) -> str:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h:02d}:{m:02d}"