from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig 
from .const import DOMAIN

async def update_listener(hass, entry):
    await hass.config_entries.async_reload(entry.entry_id)

async def async_setup_entry(hass, entry):
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path="/chepower-local", 
            path=hass.config.path("custom_components/chepower_integration/www"), 
            cache_headers=False
        )
    ])
    
    add_extra_js_url(hass, "/chepower-local/chepower-card.js")
    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])
    entry.async_on_unload(entry.add_update_listener(update_listener))

    return True

async def async_unload_entry(hass, entry):
    return await hass.config_entries.async_unload_platforms(entry, ["sensor"])