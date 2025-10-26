# MCP Chrome DevTools Tools Reference

Pełna dokumentacja narzędzi MCP Chrome DevTools dla weryfikacji frontendu.

## Navigation & Page Management

### list_pages()
- Lists all open browser tabs
- Use: Check current page, select active page

### navigate_page(url, timeout)
- Navigate to URL (e.g., "http://localhost:4200/login")
- Timeout: 30000ms recommended for initial load

### select_page(pageIdx)
- Switch context to specific page
- Use when working with multiple tabs

### wait_for(text, timeout)
- Wait until specific text appears on page
- Use: Verify async content loaded (e.g., "Photo Gallery")

---

## State Capture & Inspection

### take_snapshot(verbose)
- Returns accessibility tree with element UIDs
- Use: Quick structural verification (elements present?)
- Fast, text-based, no images

### take_screenshot(uid, fullPage, format, quality)
- Captures visual representation (PNG/JPEG/WebP)
- `fullPage: true` → full page screenshot
- `uid` → screenshot specific element
- Use: Visual regression, layout verification

### evaluate_script(function, args)
- Execute JavaScript in page context
- Use: Check app state, query DOM, validate data
- Example: `() => window['ng']?.getComponent(document.querySelector('app-root'))`

---

## Console & Debugging

### list_console_messages(types, pageIdx, pageSize)
- Get console output (log, error, warn, info, debug)
- `types: ["error", "warn"]` → filter errors only
- Returns: timestamp, type, message, source

### get_console_message(msgid)
- Get detailed info for specific console message
- Use: Deep dive into error stack traces

---

## Network Monitoring

### list_network_requests(resourceTypes, pageIdx, pageSize)
- List all HTTP requests since page load
- `resourceTypes: ["xhr", "fetch"]` → API calls only
- Returns: URL, status code, method, timing

### get_network_request(reqid)
- Detailed info for specific request
- Includes: headers, payload, response body, timing

---

## Interaction & Testing

### click(uid, dblClick)
- Click element by UID (from snapshot)
- Use: Test button clicks, navigation

### fill(uid, value)
- Fill input/textarea/select
- Use: Test form submission

### fill_form(elements)
- Fill multiple form fields at once
- Use: Complete login form, registration

### hover(uid)
- Hover over element
- Use: Test tooltips, hover states

### press_key(key)
- Send keyboard input (supports modifiers)
- Use: Test keyboard shortcuts, Enter key

---

## Emulation & Performance

### resize_page(width, height)
- Change viewport size
- Use: Test responsive layout
  - Mobile: 375x667
  - Tablet: 768x1024
  - Desktop: 1920x1080

### emulate_network(throttlingOption)
- Simulate network conditions
- Options: "No emulation", "Offline", "Slow 3G", "Fast 3G", "Slow 4G", "Fast 4G"
- Use: Test loading states, offline behavior

### emulate_cpu(throttlingRate)
- Slow down CPU execution (1-20x)
- Use: Test on low-end devices

### performance_start_trace(reload, autoStop)
- Start performance recording
- Captures Core Web Vitals (LCP, CLS, FCP)

### performance_stop_trace()
- Stop recording, get metrics
- Returns: LCP, CLS, performance insights

### performance_analyze_insight(insightName)
- Get detailed performance insight
- Examples: "LCPBreakdown", "DocumentLatency"
