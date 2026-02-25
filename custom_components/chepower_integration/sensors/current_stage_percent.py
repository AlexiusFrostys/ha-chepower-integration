from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_time_change
from homeassistant.const import EntityCategory
from datetime import datetime

class ChePowerCurrentStagePercentSensor(Entity):
    def __init__(self, hass, logger):
        self.hass = hass
        self._state = None
        self._attributes = {}
        self._attributes["current_queue_state"] = None
        self._attributes["duration_seconds"] = 0
        self._logger = logger
        self._attr_should_poll = False
        self._attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def name(self):
        return "ChePower Current Stage Percent"

    @property
    def state(self):
        return self._state

    @property
    def unit_of_measurement(self):
        return "%"        

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

        i = 0;
        combined = []
        for item in aData:
            queue = 1 if item.get("queue", 1) == 1 else 3
            if i >= len(combined):
                combined.append({"queue": queue, "start": item["time_from"], "end": item["time_to"]})
                continue

            if int(combined[i].get("queue")) != queue:
                i += 1
                combined.append({"queue": queue, "start": item["time_from"], "end": item["time_to"]})
            else:
                combined[i]["end"] = item["time_to"]

        for item in combined:
            if item["end"] == "00:00":
                item["end"] = "24:00"
                
            start = self._time_to_seconds(item["start"])
            end = self._time_to_seconds(item["end"])
            queue = item.get("queue", 1)

            if item["end"] == "24:00":
                tomorrow_check = await self._search_in_tomorrow_data("On" if queue == 1 else "Off")
                if tomorrow_check != 0:
                    end = tomorrow_check

            if start <= current_seconds < end:
                self._state = int(int(current_seconds - start) / ((end - start) / 100))
                self._attributes["current_queue_state"] = "On" if queue == 1 else "Off"
                self._attributes["duration_seconds"] = end - start
                return

    async def _search_in_tomorrow_data(self, current_state) -> int:
        tomorrow_entity = self.hass.states.get("sensor.chepower_tomorrow_sensor")

        for item in tomorrow_entity.attributes.get("aData", []):
            item_state = "On" if item.get("queue", 1) == 1 else "Off"

            if item_state != current_state:
                return self._time_to_seconds("24:00") + self._time_to_seconds(item["time_from"])

        return 0            

    @staticmethod
    def _time_to_seconds(time_str: str) -> int:
        hours, minutes = map(int, time_str.split(":"))
        return hours * 3600 + minutes * 60