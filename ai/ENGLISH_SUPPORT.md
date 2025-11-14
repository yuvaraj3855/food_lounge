# English Language Support

## Overview

This document explains English language support across different services.

---

## 1. STT (Speech-to-Text) - IndicConformer

### ⚠️ Limited English Support

**IndicConformer** is specifically designed for **22 Indian languages**, not English.

- ✅ **Indian Languages**: Hindi, Tamil, Telugu, etc. - **Excellent accuracy**
- ⚠️ **English**: **Not well supported** - Lower accuracy expected

### Current Behavior

When you request English (`language="en"`):
- The service will attempt transcription
- **Accuracy will be lower** than for Indian languages
- May produce incorrect or garbled text

### Recommendation for English STT

For English speech → English text, consider:

1. **Use Whisper API** (if available):
   ```bash
   # You had Whisper API at: http://10.10.110.24:40004
   # This would be better for English
   ```

2. **Use a different STT service** specifically for English

3. **Accept lower accuracy** with IndicConformer (not recommended)

---

## 2. Translation - Sarvam

### ✅ Full English Support

**Sarvam Translation** fully supports English:

- ✅ **English → English**: Returns the same text (no-op)
- ✅ **English → Hindi/Tamil/etc.**: Works perfectly
- ✅ **Hindi/Tamil/etc. → English**: Works perfectly

### Examples

```python
# English → English (returns same)
translate("Hello", "English", "English")
# Returns: "Hello"

# English → Hindi
translate("Hello", "Hindi", "English")
# Returns: "नमस्ते"

# Hindi → English
translate("नमस्ते", "English", "Hindi")
# Returns: "Hello"
```

---

## 3. Combined STT + Translation

### English Speech → English Text

**Not Recommended** with current setup:

1. **STT Step**: IndicConformer will have poor accuracy for English
2. **Translation Step**: Would work (English → English)

**Better Approach:**
- Use English-specific STT service (e.g., Whisper API)
- Then translate if needed

---

## Use Cases

| Use Case | Service | Status | Recommendation |
|-----------|---------|--------|----------------|
| **English speech → English text** | IndicConformer | ⚠️ Poor | Use Whisper API |
| **English text → English text** | Translation | ✅ Works | Returns same text |
| **English text → Hindi text** | Translation | ✅ Works | Perfect |
| **Hindi speech → English text** | STT + Translation | ✅ Works | Good accuracy |
| **English speech → Hindi text** | STT + Translation | ⚠️ Poor STT | Use English STT first |

---

## API Endpoints

### For English Text Translation

```bash
POST /translate
{
  "text": "Hello",
  "target_language": "English",
  "source_language": "auto"
}
# Returns: "Hello" (same text)
```

### For English Speech (Not Recommended)

```bash
POST /voice/transcribe?language=en
# ⚠️ Will work but accuracy will be poor
```

---

## Summary

- ✅ **Translation**: Full English support
- ⚠️ **STT**: Limited English support (use Whisper API for English)
- ✅ **Combined**: Works for Indian languages → English, not recommended for English → English

For best results with English:
- Use Whisper API or another English STT service
- Use Sarvam Translation for text translation


