import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from .const import DOMAIN, CONF_QUEUE

class ChePowerConfigFlow(config_entries.ConfigFlow, domain="chepower_integration"):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Initial configuration: choose queue."""
        if user_input is not None:
            return self.async_create_entry(title="ChePower", data=user_input)

        # available queues: 1/1 .. 6/2
        options = [f"{i}/{j}" for i in range(1, 7) for j in (1, 2)]

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required(CONF_QUEUE, default="1/1"): vol.In(options),
            })
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return ChePowerOptionsFlowHandler(config_entry)


class ChePowerOptionsFlowHandler(config_entries.OptionsFlow):
    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        super().__init__()
        # Мы не присваиваем self.config_entry вручную, super() сделает всё сам

    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        # Now data available via self.config_entry
        options = [f"{i}/{j}" for i in range(1, 7) for j in (1, 2)]
        current_queue = self.config_entry.options.get(
            CONF_QUEUE, self.config_entry.data.get(CONF_QUEUE, "1/1")
        )

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required(CONF_QUEUE, default=current_queue): vol.In(options),
            })
        )