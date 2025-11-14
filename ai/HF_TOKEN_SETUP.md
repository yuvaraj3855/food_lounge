# Hugging Face Token Setup

## Quick Setup

1. **Get your token:**
   - Visit: https://huggingface.co/settings/tokens
   - Click "New token"
   - Name it (e.g., "medmentor-ai")
   - Select "Read" access
   - Click "Generate token"
   - Copy the token

2. **Add to `.env` file:**
   ```bash
   HF_TOKEN=hf_your_token_here
   ```

3. **Restart the service:**
   ```bash
   poetry run uvicorn main:app --reload --port 8000 --host 0.0.0.0
   ```

## Alternative: Environment Variable

You can also set it as an environment variable:

```bash
export HF_TOKEN=hf_your_token_here
```

Or:

```bash
export HUGGINGFACE_TOKEN=hf_your_token_here
```

## Verify Token

The service will automatically use the token when loading the model. You should see:

```
✅ Using Hugging Face token for authentication
✅ IndicConformer model loaded on cpu
```

## Troubleshooting

### "Access denied" or "403" error
- Make sure you've accepted the model terms at: https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual
- Verify your token is correct in `.env`
- Check token hasn't expired

### "No HF_TOKEN found" warning
- Add `HF_TOKEN` to your `.env` file
- Or set it as environment variable
- Restart the service

## Security Note

⚠️ **Never commit your `.env` file to git!** It's already in `.gitignore`.


