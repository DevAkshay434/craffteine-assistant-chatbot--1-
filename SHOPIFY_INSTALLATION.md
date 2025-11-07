# 🛍️ Shopify Installation Guide
## Craffteine Formula Builder - Private App Embedding

This guide will help you embed the Craffteine Formula Builder into your Shopify store using an iframe.

---

## 📋 Prerequisites

1. **Deploy Your Replit App**
   - Click the **"Deploy"** button in Replit
   - Choose **"Autoscale"** deployment
   - Wait for deployment to complete
   - Copy your deployment URL (e.g., `https://your-app.replit.app`)

---

## 🚀 Installation Methods

### Method 1: Shopify Page (Recommended for Dedicated Page)

**Best for:** Creating a dedicated "Build Your Formula" page

1. Go to **Shopify Admin** → **Online Store** → **Pages**
2. Click **"Add page"** or edit an existing page
3. Click **"Show HTML"** button (in the editor toolbar)
4. Paste this code:

```html
<div style="width: 100%; max-width: 1200px; margin: 0 auto; padding: 20px;">
    <iframe 
        src="YOUR_REPLIT_APP_URL?embed=true&theme=light"
        width="100%"
        height="750"
        frameborder="0"
        allow="clipboard-write"
        style="border: none; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);"
    ></iframe>
</div>
```

5. **Replace** `YOUR_REPLIT_APP_URL` with your deployed Replit URL
6. Click **"Save"** and **"Publish"**

**Example URL to use:**
```
https://your-app.replit.app?embed=true&theme=light
```

---

### Method 2: Custom Liquid Section (Advanced - Reusable)

**Best for:** Adding the builder to multiple pages easily

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **"Actions"** → **"Edit code"**
3. Under **"Sections"**, click **"Add a new section"**
4. Name it `formula-builder.liquid`
5. Paste this code:

```liquid
<div class="formula-builder-section" style="padding: 40px 0;">
    <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        {% if section.settings.heading != blank %}
            <h2 style="text-align: center; font-size: 32px; margin-bottom: 30px; color: #7c3aed;">
                {{ section.settings.heading }}
            </h2>
        {% endif %}
        
        <iframe 
            src="{{ section.settings.app_url }}?embed=true&theme=light"
            width="100%"
            height="{{ section.settings.iframe_height }}"
            frameborder="0"
            allow="clipboard-write"
            style="border: none; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); display: block; margin: 0 auto;"
        ></iframe>
    </div>
</div>

{% schema %}
{
    "name": "Formula Builder",
    "settings": [
        {
            "type": "text",
            "id": "heading",
            "label": "Section Heading",
            "default": "Build Your Custom Formula"
        },
        {
            "type": "url",
            "id": "app_url",
            "label": "Replit App URL",
            "info": "Enter your deployed Replit app URL (without ?embed=true)"
        },
        {
            "type": "range",
            "id": "iframe_height",
            "label": "Height (px)",
            "min": 500,
            "max": 1000,
            "step": 50,
            "default": 750
        }
    ],
    "presets": [
        {
            "name": "Formula Builder",
            "category": "Custom"
        }
    ]
}
{% endschema %}
```

6. Click **"Save"**
7. Go to **Online Store** → **Customize** (theme editor)
8. Add the **"Formula Builder"** section to any page
9. Configure the app URL in the section settings
10. Click **"Save"** to publish

---

### Method 3: Product Page Integration

**Best for:** Embedding directly on product pages

1. Go to **Products** → Select your product
2. In the description editor, click **"Show HTML"**
3. Paste this code where you want the builder to appear:

```html
<div style="margin: 40px 0;">
    <h3 style="text-align: center; font-size: 28px; margin-bottom: 20px; color: #7c3aed;">
        Customize Your Formula
    </h3>
    <iframe 
        src="YOUR_REPLIT_APP_URL?embed=true&theme=light"
        width="100%"
        height="750"
        frameborder="0"
        allow="clipboard-write"
        style="border: none; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);"
    ></iframe>
</div>
```

4. Replace `YOUR_REPLIT_APP_URL` with your deployed URL
5. Click **"Save"**

---

## 🎨 Customization Options

### Change Height
Adjust the `height` value in pixels:
```html
height="600"   <!-- Shorter -->
height="900"   <!-- Taller -->
```

### Theme Options
- **Light theme (default):** `?embed=true&theme=light`
- **Dark theme:** `?embed=true&theme=dark`

### Remove Rounded Corners
Delete this part from the style:
```
border-radius: 16px;
```

### Full Width (No Max Width)
Remove the max-width constraint:
```html
<div style="width: 100%; padding: 20px;">
    <!-- iframe here -->
</div>
```

### Adjust Shadow
Modify the box-shadow value:
```css
box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);  /* Subtle */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);  /* Strong */
```

---

## 🔧 Deployment Steps (Replit)

1. In your Replit project, click **"Deploy"** in the top right
2. Select **"Autoscale"** deployment type
3. Wait for the deployment to complete
4. Copy the deployment URL (e.g., `https://your-app-name.replit.app`)
5. Use this URL in your Shopify iframe code

---

## 📱 Mobile Responsiveness

The app is fully responsive and works great on mobile devices. The iframe will automatically adjust to fit the screen size.

---

## 🔒 Security & Privacy

- This is a **private app** for single-store use
- The app runs on Replit's secure infrastructure
- All OpenAI API calls are made server-side
- No customer data is stored

---

## ⚙️ Environment Variables

Make sure your `.env` file contains:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

This is configured in Replit Secrets and is secure.

---

## 🆘 Troubleshooting

### Issue: iframe not displaying
- **Solution:** Make sure you replaced `YOUR_REPLIT_APP_URL` with your actual deployment URL
- **Solution:** Ensure your Replit app is deployed and running

### Issue: Blank screen in iframe
- **Solution:** Check that the deployment URL is correct and accessible
- **Solution:** Try opening the URL directly in a browser to test

### Issue: "Refused to connect" error
- **Solution:** Add `?embed=true` to the URL
- **Solution:** Some browsers block iframes - test in different browsers

### Issue: Scrolling issues
- **Solution:** Adjust the iframe height value
- **Solution:** Remove `overflow: hidden` if present

---

## 📞 Support

If you encounter any issues:
1. Check that your Replit app is deployed and running
2. Verify the OpenAI API key is set correctly in Replit Secrets
3. Test the app URL directly in a browser before embedding
4. Clear your browser cache and try again

---

## 🎉 You're Done!

Your Craffteine Formula Builder is now embedded in your Shopify store! Customers can create personalized formulas directly on your site.
