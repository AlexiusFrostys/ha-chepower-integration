from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_time_change
from datetime import datetime

class ChePowerTimeToOutageSensor(Entity):
    def __init__(self, hass, logger):
        self.hass = hass
        self._state = None
        self._logger = logger
        self._attr_should_poll = False
        self._attr_entity_category = "diagnostic"

    @property
    def name(self):
        return "ChePower Time to Outage"

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
        await self.async_update()
        self.async_write_ha_state()        

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

        # Search for the next outage (queue 2 or 3) that hasn't started yet
        next_outage = None
        for i, item in enumerate(aData):
            start = self._time_to_seconds(item["time_from"])
            queue = item.get("queue", 1)
            
            # Check if this is an outage (queue 2 or 3) and if it starts in the future
            if queue != 1 and start > current_seconds:
                if queue == 2 and aData[i-1]["queue"] == 3:
                    continue
                next_outage = start
                break

        if next_outage is None:
            next_outage = await self._search_in_tomorrow_data()

        if next_outage is None:
            self._state = None
        else:
            seconds_left = next_outage - current_seconds
            minutes = seconds_left // 60
            self._state = self._format_time(seconds_left)

    async def _search_in_tomorrow_data(self) -> int:
        tomorrow_entity = self.hass.states.get("sensor.chepower_tomorrow_sensor")
        if not tomorrow_entity or not tomorrow_entity.attributes.get("aData"):
            return None

        aData = tomorrow_entity.attributes["aData"]
        for item in aData:
            if item["time_to"] == "00:00":
                item["time_to"] = "24:00"
            start = self._time_to_seconds(item["time_from"])
            queue = item.get("queue", 1)
            if queue != 1:
                return self._time_to_seconds("24:00") + start

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