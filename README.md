# ChePower Integration

A Home Assistant custom integration that provides daily power-outage schedules for Chernihiv Oblast (Ukraine) with an interactive Lovelace card visualization.

⚠️ **IMPORTANT SECURITY WARNING** ⚠️

**DO NOT** perform manual data refresh too frequent. The integration applies a built-in rate limit to prevent account suspension. Chernihiv Energy Company (Черниговобленерго) reserves the right to ban users who make excessive requests to their API. Even with the rate limiter, frequent refreshes can trigger their anti-abuse systems. **Use this integration responsibly!**

## Features

- 📊 Displays today's and tomorrow's power-outage schedules for your selected queue
- 🎨 Multiple visualization modes (Circle, Timeline, Text)
- 🔄 Automatic daily updates at midnight
- 🔐 Manual refresh with built-in rate limiting (60-second cooldown)
- 📱 Responsive design that adapts to card size
- 🇺🇦 Full Ukrainian language support

## Installation

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to **Integrations** → **Custom Repositories**
3. Add repository URL: `https://github.com/AlexiusFrostys/ha-chepower-integration`
4. Search for "ChePower" and click **Install**
5. Restart Home Assistant

### Manual Installation

1. Download the latest release
2. Extract to `config/custom_components/chepower_integration/`
3. Restart Home Assistant

## Setup

1. Go to **Settings** → **Devices & Services** → **Integrations**
2. Search for "ChePower" and select the integration
3. Select your **Queue** (1/1, 1/2, 2/1, 2/2, 3/1, 3/2)
4. Complete the setup

## Configuration

The integration stores configuration in a config entry with the following structure:

```yaml
integration: chepower_integration
data:
  queue: "1/1"  # Your selected queue (1/1, 1/2, 2/1, 2/2, 3/1, 3/2)
```

## Lovelace Card Configuration

### Basic Setup

Add to your Lovelace dashboard:

```yaml
type: custom:chepower-card
entity: sensor.chepower_today
header: "Power Outage Schedule"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | Sensor entity ID (e.g., `sensor.chepower_today`) |
| `header` | string | "Графік відключень світла" | Card title |
| `display` | string | `auto` | Display mode (see below) |

### Display Modes

The integration provides three visualization modes, plus an automatic mode that adapts to available space:

#### 1. **Auto Mode** (default)
```yaml
display: auto
```
- Automatically selects between Circle and Timeline based on available width
- **Circle** mode for narrow cards (< 4 columns)
- **Timeline** mode for full-width cards (4+ columns)
- **Recommended** for most users as it provides the best UX

#### 2. **Circle Mode** (Compact)
```yaml
display: circle
```
- **Layout**: Circular progress chart on the left + statistics table on the right
- **Size**: Compact, suitable for small spaces and sidebar cards
- **Features**:
  - Circular SVG chart showing percentage of outages
  - Red percentage = hours without power
  - Green percentage = hours with power
  - Time pointer showing current time on the circle
  - Interval breakdown table below chart
  - Perfect for narrow columns or mobile views
- **Best for**: Dashboard cards in narrow columns, quick overview

#### 3. **Timeline Mode** (Full Width)
```yaml
display: timeline
```
- **Layout**: Horizontal timeline bar spanning full width
- **Size**: Large, recommended for full-width cards
- **Features**:
  - Horizontal stacked bar showing all time segments
  - Green segments = power available
  - Red segments = scheduled outages
  - Time labels with dropdowns (▼) for each boundary
  - Status card showing current state (Світло є / Світло відсутнє)
  - Countdown timer to next change
  - Statistics panel with total hours without/with power
  - Real-time update of current time pointer
- **Best for**: Main dashboard displays, dedicated power-outage card

#### 4. **Text Mode** (List View)
```yaml
display: text
```
- **Layout**: Text list with summary and detailed segments
- **Size**: Flexible, compact
- **Features**:
  - Summary showing total hours without and with power
  - Detailed list of all time intervals
  - Color-coded badges (green/red/gray) for each segment
  - Time intervals at top
  - Scrollable list for many segments
- **Best for**: Minimal displays, integration in complicated dashboards

### Display Mode Examples

#### Full Dashboard with Auto Mode
```yaml
type: grid
columns: 4
cards:
  - type: custom:chepower-card
    entity: sensor.chepower_today
    display: auto  # Will use Timeline (4 columns)
    
  - type: custom:chepower-card
    entity: sensor.chepower_today
    display: auto  # Will use Circle (less than 4 columns in a 2-column layout)
    grid-columns: 2
```

#### Side-by-Side Comparison
```yaml
type: grid
columns: 2
cards:
  - type: custom:chepower-card
    entity: sensor.chepower_today
    display: circle
    header: "Circle View"
    
  - type: custom:chepower-card
    entity: sensor.chepower_today
    display: timeline
    header: "Timeline View"
    grid-columns: 2
```

#### Mobile-Optimized
```yaml
type: custom:chepower-card
entity: sensor.chepower_today
display: text  # Minimal width required
header: "Outages Today"
```

## Manual Data Refresh

### Overview

Each visualization card includes a **refresh button** in the top-right corner that allows you to manually request updated data from the Chernihiv Energy Company API.

### Button Appearance

- **Default state**: Small gray circular button with refresh icon (↻)
- **Hover state**: Lighter gray, indicates interactivity
- **During refresh**: Icon becomes hidden, countdown timer appears (0-60 seconds)
- **After refresh**: Button re-enables with updated data

### How to Use

1. Click the **↻** button in the top-right corner of the card
2. The button becomes disabled and shows a countdown timer (60 → 0 seconds)
3. After 60 seconds, the button re-enables and icon reappears
4. Manual refresh automatically triggers an API call to get fresh schedule data

### Rate Limiting & Timeout

**Rate Limit: 1 request per 60 seconds**

- Manual refresh has a built-in **60-second cooldown**
- After clicking refresh, the button displays a countdown timer
- This prevents accidental rapid-fire requests that could trigger the server's anti-abuse system
- The countdown timer occupies the refresh button space, ensuring users cannot bypass the limiter
- Automatic daily updates at 00:00:01 are **exempt** from this limit

### Why This Matters

The Chernihiv Energy Company API has anti-abuse mechanisms. Requests made too frequently can:
- Trigger IP-based rate limiting
- Result in temporary or permanent account bans
- Prevent the integration from fetching data for all affected users

**The 60-second limit is there to protect your account. Please respect it.**

## Entities

The integration creates the following sensor entities:

### `sensor.chepower_today`
- **Name**: ChePower Today Sensor
- **State**: API response status ("ok" or error message)
- **Attributes**:
  - `aData` (array): List of time intervals with power status
  - `aState` (object): Queue descriptions and colors

### `sensor.chepower_tomorrow`
- **Name**: ChePower Tomorrow Sensor
- **State**: API response status
- **Attributes**: Same structure as today's sensor

### Attribute Structure

```json
{
  "aData": [
    {
      "time_from": "00:00",
      "time_to": "03:00",
      "queue": 1
    },
    {
      "time_from": "03:00",
      "time_to": "06:00",
      "queue": 3
    }
  ],
  "aState": {
    "1": {
      "name": "Не відключається",
      "color": "#63aa18"
    },
    "2": {
      "name": "Розмін черги/підчерги",
      "color": "#AFAFAF"
    },
    "3": {
      "name": "Відключення",
      "color": "#E33535"
    }
  }
}
```

## Automation Examples

### ⚠️ Alert When Power Outage is Happening RIGHT NOW

The key to detecting an outage "right now" is comparing the **current time** with `time_from` and `time_to` values:

```yaml
automation:
  - alias: "Alert: Power Outage Happening Now"
    trigger:
      platform: state
      entity_id: sensor.chepower_today
      attribute: aData
    condition:
      - condition: template
        value_template: >
          {%- set aData = state_attr('sensor.chepower_today', 'aData') -%}
          {%- set now = now() -%}
          {%- set now_minutes = now.hour * 60 + now.minute -%}
          {%- for item in aData -%}
            {%- if item.queue == 3 -%}
              {%- set from_parts = item.time_from.split(':') -%}
              {%- set to_parts = item.time_to.split(':') -%}
              {%- set from_minutes = (from_parts[0] | int) * 60 + (from_parts[1] | int) -%}
              {%- set to_minutes = (to_parts[0] | int) * 60 + (to_parts[1] | int) -%}
              {%- if now_minutes >= from_minutes and now_minutes < to_minutes -%}
                true
              {%- endif -%}
            {%- endif -%}
          {%- endfor -%}
          false
    action:
      service: notify.mobile_app_your_phone
      data:
        title: "⚠️ POWER OUTAGE NOW!"
        message: "Your area is without power right now"
```

**How it works:**
1. Gets current time using `now()` and converts it to minutes since midnight
2. Loops through all `aData` items
3. For each outage period (`queue == 3`), converts `time_from` and `time_to` to minutes
4. Checks if current time falls **between** outage start and end times
5. Returns `true` if current time is within ANY outage period

**Example:**
```
Current time: 14:25 (865 minutes)
aData contains:
  - queue: 3, time_from: "14:00", time_to: "17:30"
    → from_minutes: 840, to_minutes: 1050
    → 865 >= 840 AND 865 < 1050 → TRUE ✓ (Outage is happening now!)
```

### Simpler: Alert if Outages Exist Today (Any Time)

This triggers if there are ANY outages scheduled, regardless of current time:

```yaml
automation:
  - alias: "Daily Outages Report"
    trigger:
      platform: state
      entity_id: sensor.chepower_today
      attribute: aData
    condition:
      - condition: template
        value_template: >
          {{ state_attr('sensor.chepower_today', 'aData') 
             | selectattr('queue', '==', 3) 
             | list | length > 0 }}
    action:
      service: notify.mobile_app_your_phone
      data:
        title: "📌 Outages Scheduled Today"
        message: "Check the power schedule for today"
```

### Advanced: Alert Before Outage Starts (15 minutes warning)

```yaml
automation:
  - alias: "Power Outage Warning - 15 Minutes Before"
    trigger:
      platform: state
      entity_id: sensor.chepower_today
      attribute: aData
    condition:
      - condition: template
        value_template: >
          {%- set aData = state_attr('sensor.chepower_today', 'aData') -%}
          {%- set now = now() -%}
          {%- set now_minutes = now.hour * 60 + now.minute -%}
          {%- for item in aData -%}
            {%- if item.queue == 3 -%}
              {%- set from_parts = item.time_from.split(':') -%}
              {%- set from_minutes = (from_parts[0] | int) * 60 + (from_parts[1] | int) -%}
              {%- if now_minutes >= from_minutes - 15 and now_minutes < from_minutes -%}
                true
              {%- endif -%}
            {%- endif -%}
          {%- endfor -%}
          false
    action:
      service: notify.mobile_app_your_phone
      data:
        title: "⏰ Power Outage in 15 Minutes"
        message: "Prepare for scheduled power loss"
```

### Update Data Manually at Specific Time

```yaml
automation:
  - alias: "Manual ChePower Refresh"
    trigger:
      platform: time
      at: "06:00:00"
    action:
      service: homeassistant.update_entity
      target:
        entity_id: sensor.chepower_today
```

## API Information

**Endpoint**: Chernihiv Energy Company Public API  
**Update Frequency**: Daily at 00:00:01 and 22:30:00  
**Manual Refresh Limit**: 1 request per 60 seconds  
**Data Format**: JSON  

## Troubleshooting

### "Sensor not found" Error
- Ensure the integration is properly installed and restarted
- Check that the entity ID matches exactly (e.g., `sensor.chepower_today`)

### Data Not Updating
- Check Home Assistant logs for API errors
- Verify your internet connection
- Check if you're affected by the rate limiter (wait 60+ seconds)

### Button Not Responding
- Ensure browser JavaScript is enabled
- Try clearing browser cache and reloading
- Check browser console for JavaScript errors

### Getting Banned
- **STOP** making frequent manual refresh requests immediately
- Wait at least 24 hours before trying again
- Contact Chernihiv Energy Company support for account recovery
- Consider using the automatic update feature instead

## Development

### Project Structure
```
chepower_integration/
├── __init__.py           # Integration setup
├── config_flow.py        # Configuration UI
├── const.py              # Constants
├── sensor.py             # Sensor platform
├── manifest.json         # Integration metadata
├── sensors/
│   ├── today.py          # Today's schedule sensor
│   └── tomorrow.py       # Tomorrow's schedule sensor
└── www/
    ├── chepower-card.js  # Card entry point
    └── src/
        ├── card.js       # Main card class
        └── templates/
            ├── circle.js    # Circle display template
            ├── text.js      # Text display template
            └── timeline.js  # Timeline display template
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Home Assistant Version

**Minimum**: Home Assistant 2026.2.2  
**Frontend Interface**: 20260128.6

## License

This integration is provided as-is for personal use. Not affiliated with Chernihiv Energy Company.

## Disclaimer

⚠️ **This integration is unofficial and provided without warranty.**

- The Chernihiv Energy Company API is subject to change without notice
- Excessive API requests may result in IP blocking or account suspension
- Use at your own risk
- This project is not endorsed by or affiliated with Chernihiv Energy Company

## Support

For issues, questions, or feature requests:

1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Include Home Assistant logs if reporting bugs

## Changelog

### v1.0.0 (Initial Release)
- ✅ Integration setup and config flow
- ✅ Today and Tomorrow sensors
- ✅ Circle, Timeline, and Text display modes
- ✅ Manual refresh with rate limiting
- ✅ Automatic daily updates
- ✅ Full responsive design

---

**Stay safe and respect rate limits!** ⚡

