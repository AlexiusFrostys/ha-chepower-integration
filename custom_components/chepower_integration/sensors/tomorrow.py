from homeassistant.helpers.entity import Entity
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util
import json
from datetime import datetime, timedelta

class ChePowerTomorrowSensor(Entity):
    def __init__(self, logger, queue=None):
        self._queue = queue
        self._state = "Unknown"
        self._attributes = {}
        self._attr_should_poll = False # Disable auto polling
        self._logger = logger

    @property
    def name(self): return "ChePower Tomorrow Sensor"

    @property
    def state(self): return self._state

    @property
    def extra_state_attributes(self): return self._attributes

    async def async_added_to_hass(self):
        async_track_time_change(
            self.hass, 
            self._update_at_time, 
            hour=22, minute=30, second=0
        )

    async def _update_at_time(self, now):
        await self.async_update()
        self.async_write_ha_state() # Redraw card

    async def async_update(self):
        self._logger.info("QUEUE - %s", str(self._queue))
        # date for request (format depends on API; adjust if needed)
        tomorrow = datetime.now() + timedelta(days=1)
        date_str = tomorrow.strftime("%Y-%m-%d")

        # real fetch implementation (kept as a separate method for readability)
        data = await self._fetch_schedule(date_str)
        self._logger.info("Getting tomorrow schedule - done.")
        self._logger.info("Tomorrow API response: %s", json.dumps(data) if data else "None")

        # stubbed response kept for now
        # data = json.loads('{"status":"ok","aData":[{"time_from":"01:00","time_to":"04:30","queue":1},{"time_from":"04:30","time_to":"04:00","queue":2},{"time_from":"04:00","time_to":"05:30","queue":3},{"time_from":"05:30","time_to":"06:00","queue":2},{"time_from":"06:00","time_to":"10:30","queue":1},{"time_from":"10:30","time_to":"11:00","queue":2},{"time_from":"11:00","time_to":"17:00","queue":3},{"time_from":"17:00","time_to":"17:30","queue":2},{"time_from":"17:30","time_to":"22:00","queue":1},{"time_from":"22:00","time_to":"22:30","queue":2},{"time_from":"22:30","time_to":"00:00","queue":3}],"aState":{"1":{"name":"Не відключається","color":"#63aa18"},"2":{"name":"Розмін черги/підчерги","color":"#AFAFAF"},"3":{"name":"Відключення","color":"#E33535"}}}');
        # data = json.loads('{"status": "ok", "aData": [{"time_from": "00:00", "time_to": "06:00", "queue": 1}, {"time_from": "06:00", "time_to": "06:30", "queue": 2}, {"time_from": "06:30", "time_to": "10:00", "queue": 3}, {"time_from": "10:00", "time_to": "10:30", "queue": 2}, {"time_from": "10:30", "time_to": "14:00", "queue": 1}, {"time_from": "14:00", "time_to": "14:30", "queue": 2}, {"time_from": "14:30", "time_to": "17:00", "queue": 3}, {"time_from": "17:00", "time_to": "17:30", "queue": 2}, {"time_from": "17:30", "time_to": "21:00", "queue": 1}, {"time_from": "21:00", "time_to": "21:30", "queue": 2}, {"time_from": "21:30", "time_to": "23:30", "queue": 3}, {"time_from": "23:30", "time_to": "00:00", "queue": 2}], "aState": {"1": {"name": "\u041d\u0435 \u0432\u0456\u0434\u043a\u043b\u044e\u0447\u0430\u0454\u0442\u044c\u0441\u044f", "color": "#63aa18"}, "2": {"name": "\u0420\u043e\u0437\u043c\u0456\u043d \u0447\u0435\u0440\u0433\u0438/\u043f\u0456\u0434\u0447\u0435\u0440\u0433\u0438", "color": "#AFAFAF"}, "3": {"name": "\u0412\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043d\u044f", "color": "#E33535"}}}')
        # self._logger.info("Setting response json stub for tomorrow sensor - done.")
        
        # record fetch time (timezone-aware ISO8601)
        now = dt_util.now()
        fetched_iso = now.isoformat()

        if data is None:
            self._logger.warning("Failed to fetch schedule, data is None")
            # keep state as timestamp of last fetch, put error details into attributes
            self._state = fetched_iso
            self._attributes = {"aData": None, "aState": None, "fetched_at": fetched_iso, "is_error": True, "status": "error"}
        else:
            # set state to timestamp and keep API payload in attributes
            self._state = fetched_iso
            self._attributes = data
            self._attributes["fetched_at"] = fetched_iso
            self._attributes["is_error"] = False


    async def _fetch_schedule(self, date_str: str):
        """Fetch schedule from external API for the configured queue and date.

        Returns parsed JSON on success or None on failure.
        """
        if not self._queue:
            self._logger.debug("No queue selected, skipping remote fetch")
            return None

        url = "https://interruptions.energy.cn.ua/api/info_schedule_part"
        payload = {"queue": self._queue, "curr_dt": date_str}
        headers = {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8",
            "Origin": "https://interruptions.energy.cn.ua",
            "Referer": "https://interruptions.energy.cn.ua/interruptions",
            "User-Agent": "Mozilla/5.0 (Custom HA Integration)"
        }

        session = async_get_clientsession(self.hass)
        try:
            async with session.post(url, json=payload, headers=headers, ssl=False, timeout=10) as resp:
                if resp.status == 200:
                    res = await resp.json()
                    return res
                else:
                    self._logger.error("Error HTTP fetching schedule: %s", resp.status)
        except Exception as e:
            self._logger.error("Error fetching schedule: %s", e)

        return None
