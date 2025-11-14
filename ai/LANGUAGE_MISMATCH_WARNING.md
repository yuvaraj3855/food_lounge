# Language Mismatch Warning ⚠️

## Problem Scenario

**User speaks Tamil but passes `language=hi` when sending WAV file**

### What Happens

1. ✅ Service receives `language="hi"` parameter
2. ✅ Routes to IndicConformer (since "hi" is an Indian language)
3. ✅ IndicConformer attempts transcription using **Hindi** model
4. ❌ Audio is actually in **Tamil**
5. ❌ **Result: Poor/incorrect transcription**

### Why This Happens

- **IndicConformer requires explicit language code**
- It doesn't automatically detect the language
- It transcribes using the language you specify
- **Language mismatch = poor accuracy**

## Example

```python
# User speaks Tamil, but passes language="hi"
transcribe_audio(audio_bytes, language="hi")

# What happens:
# - IndicConformer uses Hindi model
# - Tries to transcribe Tamil audio as Hindi
# - Result: Garbled/incorrect text
```

## Solutions

### 1. **Frontend Language Detection** (Recommended)
- Detect language in frontend before sending
- Let user select language
- Or use browser language detection

### 2. **Auto-Detect Language** (Future Enhancement)
- Implement language detection before transcription
- Could use a separate LID (Language Identification) model
- Then route to appropriate STT service

### 3. **Multiple Attempts** (Not Recommended)
- Try multiple languages and pick best result
- Slow and resource-intensive

### 4. **User Education**
- Document that language parameter must match audio
- Show clear warnings in API documentation
- Frontend should validate/confirm language

## Current Behavior

The service will:
- ✅ Accept any language parameter
- ✅ Route to appropriate service (Whisper/IndicConformer)
- ⚠️ **Transcribe using specified language, regardless of actual audio language**
- ⚠️ **Produce poor results if language doesn't match**

## Recommendations

### For Frontend Developers

1. **Language Selection UI:**
   ```typescript
   // Let user select language before recording
   const language = userSelectedLanguage; // "hi", "ta", "en", etc.
   ```

2. **Language Detection:**
   ```typescript
   // Use browser language or detect from user settings
   const detectedLanguage = navigator.language || "hi";
   ```

3. **Validation:**
   ```typescript
   // Warn user if language might not match
   if (userSpeaksTamil && language === "hi") {
     showWarning("Language mismatch detected!");
   }
   ```

### For Backend

The service now includes warnings:
- Prints warning when language parameter is used
- Reminds that language must match audio
- But still processes the request (for flexibility)

## Best Practices

1. ✅ **Always match language parameter to audio language**
2. ✅ **Let user select language in frontend**
3. ✅ **Use language detection if available**
4. ⚠️ **Don't guess the language - ask the user**

## Future Improvements

Possible enhancements:
- [ ] Add language detection endpoint
- [ ] Auto-detect language before transcription
- [ ] Return confidence score for transcription
- [ ] Support multiple language attempts

---

**Status:** Current implementation requires correct language parameter  
**Recommendation:** Frontend should handle language selection/detection


