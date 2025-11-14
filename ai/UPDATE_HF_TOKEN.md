# Update Your Hugging Face Token

## Quick Update

Your `.env` file currently has a placeholder token. Update it with your actual token:

```bash
# In ai/.env file, replace:
HF_TOKEN=your_huggingface_token_here

# With your actual token:
HF_TOKEN=hf_your_actual_token_here
```

## Steps

1. **Open `.env` file:**
   ```bash
   cd ai
   nano .env  # or use your preferred editor
   ```

2. **Find the line:**
   ```bash
   HF_TOKEN=your_huggingface_token_here
   ```

3. **Replace with your actual token:**
   ```bash
   HF_TOKEN=hf_your_actual_token_here
   ```

4. **Save and restart the service**

## Verify Token is Set

After updating, test:

```bash
cd ai
poetry run python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('Token:', os.getenv('HF_TOKEN')[:10] + '...' if os.getenv('HF_TOKEN') else 'Not set')"
```

## Service Will Now Work

Once the token is set correctly, the service will:
- ✅ Authenticate with Hugging Face
- ✅ Download the model automatically
- ✅ Load IndicConformer successfully

You should see:
```
✅ Using Hugging Face token for authentication
✅ IndicConformer model loaded on cpu
```


