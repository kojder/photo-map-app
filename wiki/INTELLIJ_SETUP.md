# IntelliJ IDEA - Live Templates for Wiki Corrections

**Purpose:** Quick insertion of `<!-- CORR_* -->` markers in Markdown files

---

## 🚀 Quick Setup (3 minutes)

### Step 1: Open Live Templates Settings

**IntelliJ IDEA:**
```
File → Settings → Editor → Live Templates
(or Ctrl+Alt+S → search "Live Templates")
```

### Step 2: Create New Template Group

1. Click **"+"** (Add) → **"Template Group"**
2. Name: **"Wiki Corrections"**
3. Click **OK**

### Step 3: Add Correction Template

1. Select **"Wiki Corrections"** group
2. Click **"+"** → **"Live Template"**
3. Fill in:

**Abbreviation:** `corr`

**Description:** `Insert Wiki correction marker`

**Template text:**
```
<!-- CORR_$NUM$: $INSTRUCTION$ -->
$SELECTION$
<!-- /CORR_$NUM$ -->
```

**Applicable contexts:**
- Click **"Define"** (or **"Change"**)
- Check: **"Markdown"** (or **"Everywhere"** if Markdown not listed)
- Click **OK**

4. Click **"Edit variables"** button
5. Configure variables:

| Variable      | Expression | Default value | Skip if defined |
|---------------|------------|---------------|-----------------|
| NUM           |            | 001           | ☐               |
| INSTRUCTION   |            | instruction   | ☐               |
| SELECTION     |            |               | ☑               |

6. Click **OK** to save

---

## 📝 Usage

### Variant A: Insert with typing

1. Type: `corr` + **Tab**
2. Enter correction number (e.g., `001`)
3. Press **Tab** → Enter instruction (e.g., `delete this`)
4. Press **Tab** → Cursor inside markers

**Example:**
```
corr[Tab] → 001[Tab] → usuń to[Tab]
```

Result:
```markdown
<!-- CORR_001: usuń to -->
█ (cursor here)
<!-- /CORR_001 -->
```

### Variant B: Wrap existing text

1. **Select text** you want to mark for correction
2. Press: **Ctrl+Alt+J** (Surround with Live Template)
3. Type: `corr` + **Enter**
4. Enter number → instruction

**Example:**
```markdown
This text needs to be deleted
```

Select text → Ctrl+Alt+J → corr → Enter → 001 → delete this

Result:
```markdown
<!-- CORR_001: delete this -->
This text needs to be deleted
<!-- /CORR_001 -->
```

---

## 🎯 Advanced: Multiple Templates

You can create shortcuts for common instructions:

### Template: `corrdelete`

**Abbreviation:** `corrdelete`
**Template text:**
```
<!-- CORR_$NUM$: delete this -->
$SELECTION$
<!-- /CORR_$NUM$ -->
```

### Template: `corrshort`

**Abbreviation:** `corrshort`
**Template text:**
```
<!-- CORR_$NUM$: shorten to $COUNT$ sentences -->
$SELECTION$
<!-- /CORR_$NUM$ -->
```

Variables: NUM (default: 001), COUNT (default: 3)

### Template: `corrlist`

**Abbreviation:** `corrlist`
**Template text:**
```
<!-- CORR_$NUM$: rewrite as bullet points -->
$SELECTION$
<!-- /CORR_$NUM$ -->
```

---

## 💡 Pro Tips

### Tip 1: Sequential Numbering

Keep last used number in mind:
- `corr` → 001
- `corr` → 002
- `corr` → 003

Or search last number before adding new:
```
Ctrl+F → search: "CORR_" → find last number
```

### Tip 2: Polish Instructions

Instructions can be in Polish (faster):
```markdown
<!-- CORR_001: usuń to -->
<!-- CORR_002: skróć do 3 zdań -->
<!-- CORR_003: przepisz jako lista -->
```

### Tip 3: Multi-cursor for Multiple Corrections

1. Select first correction text
2. Press **Alt+J** repeatedly to select similar text
3. Press **Ctrl+Alt+J** → corr → Enter
4. All selections wrapped at once!

### Tip 4: Preview Before Commit

IntelliJ has Markdown preview:
- Right sidebar → **"Markdown Preview"**
- Or: **Ctrl+Shift+P** (toggle preview)
- Corrections are invisible (HTML comments)

---

## 🔄 Workflow Summary

1. **Open file** in IntelliJ (e.g., `wiki/pages/01-Home.md`)
2. **Find content** to correct
3. **Select text** (if wrapping) or place cursor (if inserting)
4. **Type:** `corr` + **Tab**
5. **Enter:** number + instruction
6. **Continue** with next correction
7. **Save** file (Ctrl+S)
8. **Tell Claude:** "process corrections"

---

## ✅ Testing Your Setup

Try this in any Markdown file:

1. Create test line: `This is test content`
2. Select it
3. Press **Ctrl+Alt+J**
4. Type: `corr` + **Enter**
5. Enter: `001` + **Tab**
6. Enter: `test instruction` + **Tab**

Expected result:
```markdown
<!-- CORR_001: test instruction -->
This is test content
<!-- /CORR_001 -->
```

If works → **Setup complete!** 🎉

---

## 🆘 Troubleshooting

**Problem:** "corr" doesn't autocomplete

**Solution:**
- Check if template is enabled (Settings → Live Templates → Wiki Corrections → corr)
- Check context: applicable to "Markdown" or "Everywhere"
- Try: Ctrl+J (show all live templates) → find "corr"

**Problem:** Variables not working

**Solution:**
- Edit template → "Edit variables" button
- Verify variable names match template text ($NUM$, $INSTRUCTION$)
- Check default values are set

**Problem:** Can't wrap selection

**Solution:**
- Use **Ctrl+Alt+J** (not Ctrl+J)
- Or: Right-click selection → "Surround With..." → "corr"

---

**Ready to mark corrections!** Open Wiki pages in IntelliJ and start using `corr` + Tab.
