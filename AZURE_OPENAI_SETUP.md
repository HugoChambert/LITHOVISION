# Azure OpenAI Setup Guide

This application uses Microsoft Azure OpenAI Service (which powers Copilot Designer) for AI-powered image editing and stone replacement.

## Prerequisites

You need an Azure account with access to Azure OpenAI Service.

## Setup Steps

### 1. Create Azure OpenAI Resource

1. Go to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Azure OpenAI"
4. Click "Create"
5. Fill in the required information:
   - Subscription
   - Resource group
   - Region (choose a region that supports DALL-E)
   - Name for your resource
   - Pricing tier
6. Click "Review + Create" then "Create"

### 2. Deploy DALL-E Model

1. Navigate to your Azure OpenAI resource
2. Go to "Model deployments" or use Azure OpenAI Studio
3. Click "Create new deployment"
4. Select "DALL-E 3" or "DALL-E 2" from the model list
5. Give it a deployment name (e.g., "dall-e-3")
6. Click "Create"

### 3. Get Your API Credentials

1. In your Azure OpenAI resource, go to "Keys and Endpoint"
2. Copy the following values:
   - **Endpoint**: Your Azure OpenAI endpoint URL (e.g., `https://your-resource.openai.azure.com`)
   - **Key**: One of the two keys provided (Key 1 or Key 2)

### 4. Configure Environment Variables

You need to set the following environment variables in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to Settings > Edge Functions
3. Add the following secrets:

```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT=dall-e-3
```

Replace the values with your actual Azure OpenAI credentials.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL | `https://my-resource.openai.azure.com` |
| `AZURE_OPENAI_KEY` | Your Azure OpenAI API key | `abc123...` |
| `AZURE_OPENAI_DEPLOYMENT` | The name of your DALL-E deployment | `dall-e-3` |

## Testing the Integration

Once configured, the application will automatically use Azure OpenAI for:
- Intelligent stone replacement in images
- Realistic lighting and shadow preservation
- Material texture matching
- Perspective-aware editing

## Pricing

Azure OpenAI pricing varies by region and model. Check the [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) page for current rates.

Typical costs:
- DALL-E 3: ~$0.04 per image (1024x1024)
- DALL-E 2: ~$0.02 per image (1024x1024)

## Troubleshooting

### Error: "Azure OpenAI credentials not configured"
- Make sure you've set all three environment variables in Supabase
- Verify the variable names are exactly as specified above
- Restart the edge function after updating environment variables

### Error: "Azure OpenAI API error: 404"
- Check that your deployment name is correct
- Verify your endpoint URL is complete and correct
- Ensure the deployment is active in Azure OpenAI Studio

### Error: "Access denied" or "401 Unauthorized"
- Verify your API key is correct
- Check that your Azure subscription is active
- Ensure your API key hasn't expired

## Alternative: OpenAI API

If you prefer to use OpenAI's API directly instead of Azure, you can modify the edge function to use:

```typescript
const apiUrl = "https://api.openai.com/v1/images/edits";
headers: {
  "Authorization": `Bearer ${OPENAI_API_KEY}`,
}
```

And set the environment variable:
```bash
OPENAI_API_KEY=sk-...
```
