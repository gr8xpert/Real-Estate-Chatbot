# RealtySoft Chatbot System - Technical Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [File Descriptions](#file-descriptions)
4. [Database Schema](#database-schema)
5. [Workflows](#workflows)
6. [Web Widget](#web-widget)
7. [Configuration](#configuration)
8. [Deployment Guide](#deployment-guide)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

The RealtySoft Chatbot System is a multi-tenant property search assistant built on n8n workflow automation platform. It provides:

- **AI-powered conversational property search** with NLP parsing
- **Multi-location search** (e.g., "villas in marbella and estepona")
- **Compound property type matching** (e.g., "ground floor apartment")
- **Session persistence** with context-aware search refinement
- **Multi-language support** (English, Spanish, Dutch)
- **Email transcript delivery** at end of conversation
- **Embeddable web widget** for any website

### Key Features

| Feature | Description |
|---------|-------------|
| Smart NLP Parsing | Extracts location, property type, price, bedrooms from natural language |
| Multi-location Search | Search multiple locations simultaneously with grouped results |
| Session Context | Remembers previous searches, allows filter refinement |
| Keyword Aliases | "villa" maps to "Detached Villa", "flat" to "Apartment" |
| Longest Match Priority | "ground floor apartment" matches compound type, not just "Apartment" |
| Cache System | 1-hour in-memory cache + daily database cache refresh |

---

## Architecture

```
+------------------+     +--------------------+     +------------------+
|   Web Widget     |     |  ChatBot Workflow  |     | Property Services|
|   (chatbot.js)   | --> |  (Template.json)   | --> |   (.json)        |
+------------------+     +--------------------+     +------------------+
        |                        |                         |
        |                        v                         v
        |                 +-------------+           +-------------+
        |                 | AI Agent    |           | External    |
        |                 | (OpenRouter)|           | Property API|
        |                 +-------------+           +-------------+
        |                        |                         |
        v                        v                         v
+------------------+     +--------------------+     +------------------+
|   localStorage   |     |    PostgreSQL      |     |  Property Data   |
| (session state)  |     | (chat history,     |     |  (listings)      |
+------------------+     |  search context,   |     +------------------+
                         |  client config)    |
                         +--------------------+
```

### Data Flow

1. **User Input** -> Web Widget captures message
2. **Widget** -> Sends to ChatBot Webhook with session ID
3. **ChatBot** -> Extracts client config, routes to AI Agent
4. **AI Agent** -> Parses intent, calls `search_properties` tool
5. **search_properties** -> Sends parsed request to Property Services
6. **Property Services** -> Validates, fetches from external API, formats results
7. **Response** -> Returns through chain to Widget
8. **Widget** -> Renders property cards with formatting

---

## File Descriptions

### 1. ChatBot - Template.json

**Purpose:** Main chatbot workflow template for each client

**Key Nodes:**

| Node | Function |
|------|----------|
| When chat message received | Webhook trigger for incoming messages |
| Extract Client Config | Extracts CLIENT_ID from configuration |
| Load Client Variables | Fetches client-specific settings from DB |
| Prepare Client Context | Builds context with LOCATION_MAP, TYPE_MAP, caching |
| Route by Action | Routes: sendMessage, store_contact, endChat |
| AI Agent | OpenRouter GPT-4o with system prompt and tools |
| search_properties | Smart NLP tool that parses and searches |
| Check for Events | Detects STORE_USER_DATA, CHAT_END_CONFIRMED markers |
| Route by Event | Routes to save contact, send email, or continue |

**NLP Functions in search_properties:**

```javascript
// Find location - returns best match
function findLocation(query, locationMap)

// Find property type - prioritizes LONGEST match
function findPropertyType(query, typeMap)
  // Includes keyword aliases: villa -> detached villa, flat -> apartment

// Parse price from natural language
function parsePrice(query)
  // Handles: "under 500k", "budget 1m", "between 300k and 600k"

// Parse bedrooms
function parseBedrooms(query)
  // Handles: "3 bed", "exactly 3 bedroom"

// Find multiple locations for multi-search
function findMultipleLocations(query, locationMap)
```

**Multi-location Request Body:**

```javascript
{
  location_id: null,  // null when multiple locations
  location_ids: [67, 214],  // array of location IDs
  location_names: ['Mijas', 'Marbella'],
  search_mode: 'multi',  // 'single' or 'multi'
  // ... other params
}
```

---

### 2. Property Services.json

**Purpose:** Backend workflow for property search API calls and caching

**Key Nodes:**

| Node | Function |
|------|----------|
| Property Search Webhook | POST /webhook/property-search |
| Load Search Context | Gets saved filters from session |
| Merge Request with Context | Combines new request with saved context |
| Save Early Context | Saves merged context before search |
| Load Client Maps | Gets LOCATION_MAP, TYPE_MAP from DB |
| Validate & Lookup IDs | Validates input, resolves string names to IDs |
| Build Query Parameters | Constructs API query params |
| Fetch Properties | Calls external property API (multi-location aware) |
| Format Results | Formats properties as markdown with location grouping |
| Save Search Context | Updates session context after search |

**Cache Refresh Flow (Daily 2 AM):**

1. Schedule Trigger fires
2. Get Active Clients from DB
3. Loop through each client:
   - Fetch Locations from API
   - Fetch Property Types from API
   - Fetch Properties for Features
   - Transform to Maps
   - Update client_variables with new maps

**Multi-location Fetch Logic:**

```javascript
// For multi-location, sequential requests per location
if (searchMode === 'multi' && locationIds.length > 0) {
  const propertiesByLocation = {};
  for (const locId of locationIds) {
    // Fetch properties for this location
    // Tag each property with _search_location_id
    propertiesByLocation[locId] = properties;
  }
  // Return grouped results
}
```

---

### 3. chatbot.js (Widget)

**Version:** 7.1.0

**Purpose:** Embeddable JavaScript widget for websites

**Key Components:**

| Component | Function |
|-----------|----------|
| TranslationManager | Multi-language support (en, nl, es) |
| StorageManager | localStorage for session persistence |
| RealtySoftWidget | Main widget class |

**Property Parsing Features:**

- Detects property listings vs regular messages
- Parses single-location and multi-location responses
- Extracts: title, beds, baths, build size, plot size, ref, price, URL
- Renders styled property cards with "View Property" buttons

**Multi-location Detection:**

```javascript
// Detects location headings: short bold text without property keywords
const isLocationHeading = boldText.length < 25 &&
    !/for sale|apartment|villa|house|penthouse|townhouse/i.test(boldText);

if (hasLocationHeadings) {
    return formatMultiLocationListing(content, lines);
}
```

**Widget Configuration:**

```javascript
initRealtySoftEmbed({
    webhookUrl: 'https://n8n.realtysoft.ai/webhook/xxx',
    webhooks: {
        en: 'https://n8n.realtysoft.ai/webhook/xxx-en',
        es: 'https://n8n.realtysoft.ai/webhook/xxx-es'
    },
    botName: 'Property Assistant',
    primaryColor: '#4f46e5',
    secondaryColor: '#3b82f6',
    welcomeMessage: 'Find your perfect property!',
    welcomeIcon: '🏡',
    avatarUrl: 'https://example.com/bot.jpg',
    requireContact: true,
    chatExpirationDays: 7
});
```

---

### 4. Admin & Utilities.json

**Purpose:** Administrative utilities and sub-workflows

**Sub-workflows:**

#### Client Onboarding (POST /webhook/add-client)

Validates and creates new client configurations:
- Validates required fields (client_id, client_name, api_token, api_base_url)
- Validates formats (lowercase alphanumeric ID, valid URLs, hex colors)
- Creates entries in `clients` and `client_variables` tables

**Request Format:**

```json
{
    "client_id": "costa_casas",
    "client_name": "Costa Casas Real Estate",
    "api_token": "xxx",
    "api_base_url": "https://crm.costacasas.com/api/",
    "email": "info@costacasas.com",
    "variables": {
        "BOT_NAME": "Costa Casas Assistant",
        "PRIMARY_COLOR": "#2563EB",
        "OWNER_EMAIL": "owner@costacasas.com",
        "RAG_WEBSITE": "https://costacasas.com"
    }
}
```

#### Weather Sub-workflow

Called by AI Agent's `get_weather` tool:
- Fetches from WeatherAPI
- Returns formatted weather for any location

#### Email Sub-workflow

Triggered when chat ends:
- Fetches chat history from n8n_chat_histories
- Formats HTML email with contact info and transcript
- Sends via SMTP
- Marks chat as ended in user_contact_details

---

### 5. Realtysoft Email Transcript - GLOBAL MODULE.json

**Purpose:** Standalone global email transcript workflow

**Flow:**

1. Triggered by another workflow (ChatBot's endChat event)
2. Gets chat history from PostgreSQL
3. Formats HTML email (Outlook/Gmail compatible tables)
4. Sends to user
5. Sends copy to owner (if configured)
6. Marks chat as ended
7. On error: logs failure, still marks chat ended

**Input Parameters:**

- sessionId
- owner_email
- user_email
- user_name
- client_id
- user_phone

---

## Database Schema

### Required Tables

```sql
-- Clients table
CREATE TABLE clients (
    client_id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    api_token TEXT NOT NULL,
    api_base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Client variables (JSONB for flexible config)
CREATE TABLE client_variables (
    client_id VARCHAR(50) PRIMARY KEY REFERENCES clients(client_id),
    variables JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Search context (session-based filters)
CREATE TABLE search_context (
    session_id VARCHAR(100) PRIMARY KEY,
    location_name VARCHAR(255),
    property_type VARCHAR(255),
    list_price_min INTEGER DEFAULT 0,
    list_price_max INTEGER DEFAULT 0,
    bedrooms_min INTEGER DEFAULT 0,
    bedrooms_max INTEGER DEFAULT 0,
    bathrooms_min INTEGER DEFAULT 0,
    bathrooms_max INTEGER DEFAULT 0,
    features TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User contact details
CREATE TABLE user_contact_details (
    session_id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    client_id VARCHAR(50),
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    chat_ended BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- n8n chat histories (created by n8n Postgres Chat Memory)
CREATE TABLE n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    message JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Optional: Email transcript logs
CREATE TABLE email_transcript_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    client_id VARCHAR(50),
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### client_variables JSONB Structure

```json
{
    "BOT_NAME": "Property Assistant",
    "PRIMARY_COLOR": "#2563EB",
    "SECONDARY_COLOR": "#1E40AF",
    "OWNER_EMAIL": "owner@example.com",
    "RAG_WEBSITE": "https://example.com",
    "PROP_AUTH_HEADER": "api_token_here",
    "PROP_API_BASE_URL": "https://crm.example.com/api/",
    "PROP_DETAIL_URL": "https://example.com/property/",
    "LOCATION_MAP": {"marbella": 1, "estepona": 2},
    "TYPE_MAP": {"apartment": 1, "villa": 2, "ground floor apartment": 3},
    "FEATURE_MAP": {"pool": 1, "garden": 2},
    "CACHE_UPDATED_AT": "2026-01-22T02:00:00Z"
}
```

---

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| WEATHER_API_KEY | WeatherAPI.com key for weather tool |
| PostgreSQL credentials | Configure in n8n credentials |
| SMTP credentials | Configure in n8n credentials |
| OpenRouter API key | Configure in n8n credentials |

### Creating a New Client

1. **Add client via API:**

```bash
curl -X POST https://n8n.realtysoft.ai/webhook/add-client \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "new_client",
    "client_name": "New Client Real Estate",
    "api_token": "their_api_token",
    "api_base_url": "https://their-crm.com/api/",
    "variables": {
      "BOT_NAME": "New Client Assistant",
      "PRIMARY_COLOR": "#FF5722",
      "OWNER_EMAIL": "owner@newclient.com"
    }
  }'
```

2. **Run cache update** (or wait for daily 2 AM refresh)

3. **Duplicate ChatBot workflow:**
   - Import "ChatBot - Template.json"
   - Update CLIENT_ID in "Extract Client Config" node
   - Update webhook ID
   - Activate workflow

4. **Embed widget on website:**

```html
<script src="https://your-domain.com/chatbot.js"></script>
<script>
    initRealtySoftEmbed({
        webhookUrl: 'https://n8n.realtysoft.ai/webhook/client-webhook-id'
    });
</script>
```

---

## API Reference

### ChatBot Webhook

**Endpoint:** POST /webhook/{client-webhook-id}

**Actions:**

#### sendMessage
```json
{
    "action": "sendMessage",
    "sessionId": "rs_123456_abc",
    "chatInput": "villas in marbella under 500k",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+34 612 345 678"
}
```

#### store_contact
```json
{
    "action": "store_contact",
    "sessionId": "rs_123456_abc",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+34 612 345 678"
}
```

#### endChat
```json
{
    "action": "endChat",
    "sessionId": "rs_123456_abc",
    "chatInput": "bye",
    "name": "John Doe",
    "email": "john@example.com"
}
```

### Property Services Webhook

**Endpoint:** POST /webhook/property-search

**Request:**
```json
{
    "CLIENT_ID": "costa_casas",
    "session_id": "rs_123456_abc",
    "location_name": "Marbella",
    "location_id": 67,
    "location_ids": [67, 214],
    "location_names": ["Marbella", "Mijas"],
    "search_mode": "multi",
    "property_type": "Detached Villa",
    "type_id": 5,
    "list_price_min": 0,
    "list_price_max": 500000,
    "bedrooms_min": 3,
    "bedrooms_max": 0,
    "bathrooms_min": 0,
    "bathrooms_max": 0,
    "pre_parsed": true,
    "PROP_DETAIL_URL": "https://example.com/property/"
}
```

**Response:**
```json
{
    "result": "Here are some Detached Villa in Marbella and Mijas:\n\n**Marbella**\n**Stunning Villa for Sale**\n🛏️ 4 beds | 🚿 3 baths\n📐 350 m² build | 800 m² plot\n🔑 Ref: R5272630\n💰 €450,000\n🔗 [View Property](https://...)\n\n**Mijas**\n..."
}
```

---

## Cache Management (Widget Updates)

When you deploy a new version of `chatbot.js`, browser caches may serve the old version. Here's how to ensure all 100+ websites get the update:

### Option 1: Loader Script (Recommended for Scale)

Instead of embedding `chatbot.js` directly, embed the tiny `chatbot-loader.js`:

**On all client websites:**
```html
<script src="https://your-cdn.com/chatbot-loader.js"></script>
<script>
    initRealtySoftEmbed({ webhookUrl: 'https://...' });
</script>
```

**When deploying updates:**
1. Upload new `chatbot.js` to CDN
2. Edit `chatbot-loader.js` and update the version:
   ```javascript
   var CHATBOT_VERSION = '7.1.2-20260123120000'; // Update this!
   ```
3. Upload `chatbot-loader.js`
4. All sites automatically fetch new version

### Option 2: Version Query String

Tell clients to embed with version parameter:

```html
<script src="https://your-cdn.com/chatbot.js?v=7.1.1"></script>
```

When updating, change the version in all embed codes.

### Option 3: Server Cache Headers

Configure your web server/CDN with appropriate cache headers:

**Nginx:**
```nginx
location /chatbot.js {
    add_header Cache-Control "public, max-age=3600"; # 1 hour
    # Or for no cache:
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**Cloudflare/CDN:**
- Set Page Rules for `*/chatbot.js` with "Cache Level: Bypass" or short TTL
- Purge cache after each deploy

### Debugging Version Issues

Open browser console on any website and run:

```javascript
// Check current loaded version
RealtySoftVersion.check();

// Force reload latest version
RealtySoftVersion.forceReload();

// Clear widget state (localStorage)
RealtySoftVersion.clearCache();
```

### Quick Fix for Existing Sites

If sites show old version, users can:
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Open DevTools > Network > check "Disable cache" > refresh

---

## Deployment Guide

### Prerequisites

- n8n instance (self-hosted or cloud)
- PostgreSQL database
- SMTP server for emails
- OpenRouter API account
- WeatherAPI account (optional)

### Deployment Steps

1. **Set up PostgreSQL tables** (see Database Schema)

2. **Import workflows to n8n:**
   - Property Services.json
   - Admin & Utilities.json
   - Realtysoft Email Transcript - GLOBAL MODULE.json
   - ChatBot - Template.json (per client)

3. **Configure credentials in n8n:**
   - PostgreSQL connection
   - OpenRouter API
   - SMTP account
   - Header Auth (for admin endpoint)

4. **Activate workflows:**
   - Property Services (always active)
   - Admin & Utilities (as needed)
   - Email Transcript (always active)
   - Client ChatBot workflows (per client)

5. **Host chatbot.js:**
   - Upload to CDN or static hosting
   - Update URLs in widget configuration

6. **Test:**
   - Run cache update for test client
   - Test chat via n8n built-in chat
   - Test web widget integration

---

## Troubleshooting

### Common Issues

#### "No properties found" but data exists

1. Check LOCATION_MAP has the location
2. Check TYPE_MAP has the property type
3. Verify cache was updated (check CACHE_UPDATED_AT)
4. Run manual cache refresh

#### Multi-location not working

1. Ensure `search_mode: 'multi'` is being sent
2. Check `location_ids` array has multiple IDs
3. Verify `location_id` is `null` when multi-location
4. Check Property Services "Validate & Lookup IDs" logic

#### Compound type not matching

1. Verify TYPE_MAP contains the compound type
2. Check `findPropertyType()` uses longest match logic
3. Ensure query text is lowercase for matching

#### Widget shows "No properties available"

1. Check browser console for errors
2. Verify webhook URL is correct
3. Check CORS settings on n8n
4. Test webhook directly with curl

#### Email transcript not sending

1. Check SMTP credentials
2. Verify user_email is provided
3. Check email_transcript_logs for errors
4. Verify Email Transcript workflow is active

### Debug Mode

Add to chatbot.js configuration:
```javascript
initRealtySoftEmbed({
    webhookUrl: '...',
    debug: true  // Enables console logging
});
```

### Useful SQL Queries

```sql
-- Check client config
SELECT * FROM client_variables WHERE client_id = 'xxx';

-- Check search context for session
SELECT * FROM search_context WHERE session_id = 'xxx';

-- Check chat history
SELECT * FROM n8n_chat_histories WHERE session_id = 'xxx' ORDER BY id;

-- Check failed emails
SELECT * FROM email_transcript_logs WHERE status = 'failed';

-- Clear stale sessions
DELETE FROM search_context WHERE updated_at < NOW() - INTERVAL '7 days';
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 7.1.0 | 2026-01-22 | Added multi-location support with location groupings |
| 7.0.4 | 2026-01-21 | Fixed compound type matching (longest match priority) |
| 7.0.3 | 2026-01-20 | Added keyword aliases (villa -> detached villa) |
| 7.0.2 | 2026-01-19 | Simplified header, improved property parsing |
| 7.0.0 | 2026-01-15 | Major refactor for n8n backend |

---

## Support

- **Repository:** Contact system administrator
- **Issues:** Track in internal issue tracker
- **Documentation updates:** Edit this file

---

*Generated: January 22, 2026*
*System: RealtySoft Chatbot v7.1.0*
