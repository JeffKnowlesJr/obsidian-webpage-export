# Step-by-Step Setup Instructions

## Getting Started (Steps 1-10)

1. **Install Docker on your computer**
   - Go to docker.com and download Docker Desktop
   - Install it and make sure it's running (you'll see a whale icon in your system tray)

2. **Find your Obsidian vault folder**
   - Open Obsidian
   - Go to Settings → About → Show vault folder
   - Note the path (like `/Users/yourname/Documents/MyVault`)

3. **Create a project folder**
   ```bash
   mkdir obsidian-website
   cd obsidian-website
   ```

4. **Copy your vault to the project folder**
   ```bash
   cp -r /path/to/your/vault ./vault
   ```

5. **Create an output folder**
   ```bash
   mkdir output
   ```

6. **Test the basic export**
   ```bash
   docker run --rm \
     -v ./vault:/vault \
     -v ./output:/output \
     -e EXPORT_ENTIRE_VAULT=true \
     kosmosisdire/obsidian-webpage-export:latest
   ```

7. **Check if it worked**
   ```bash
   ls output/
   # You should see index.html and other files
   ```

8. **Open the website in your browser**
   ```bash
   open output/index.html
   # Or double-click the file
   ```

9. **Verify all features work**
   - Search should work
   - Graph view should show your notes
   - Navigation should show your folders

10. **If something's broken, check the vault structure**
    ```bash
    ls -la vault/.obsidian/
    # This folder must exist
    ```

## GitHub Setup (Steps 11-25)

11. **Create a GitHub account** (if you don't have one)
    - Go to github.com and sign up

12. **Install Git on your computer**
    - Download from git-scm.com
    - Or use `brew install git` on Mac

13. **Create a new repository on GitHub**
    - Click "New repository"
    - Name it something like "my-digital-garden"
    - Make it public
    - Don't initialize with README

14. **Initialize Git in your project folder**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

15. **Connect to GitHub**
    ```bash
    git remote add origin https://github.com/yourusername/my-digital-garden.git
    git push -u origin main
    ```

16. **Create the GitHub Actions folder**
    ```bash
    mkdir -p .github/workflows
    ```

17. **Create the automation file**
    ```bash
    touch .github/workflows/export.yml
    ```

18. **Add the automation code** (copy this exactly):
    ```yaml
    name: Export Obsidian to Website
    on:
      push:
        branches: [main]
    
    jobs:
      export:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          
          - name: Export vault
            run: |
              mkdir -p ./output
              docker run --rm \
                -v $PWD/vault:/vault \
                -v $PWD/output:/output \
                -e EXPORT_ENTIRE_VAULT=true \
                kosmosisdire/obsidian-webpage-export:latest
                
          - name: Deploy to GitHub Pages
            uses: peaceiris/actions-gh-pages@v3
            with:
              github_token: ${{ secrets.GITHUB_TOKEN }}
              publish_dir: ./output
    ```

19. **Enable GitHub Pages**
    - Go to your repository on GitHub
    - Click Settings → Pages
    - Source: "Deploy from a branch"
    - Branch: "gh-pages"
    - Click Save

20. **Push the automation**
    ```bash
    git add .
    git commit -m "Add automation"
    git push
    ```

21. **Watch it run**
    - Go to your repository → Actions tab
    - You should see "Export Obsidian to Website" running

22. **Wait for it to finish** (usually 2-5 minutes)

23. **Check if GitHub Pages is working**
    - Go to Settings → Pages
    - You should see "Your site is published at https://yourusername.github.io/my-digital-garden"

24. **Visit your website**
    - Click the link or go to `https://yourusername.github.io/my-digital-garden`

25. **Test that everything works**
    - Search should work
    - Graph view should show
    - All your notes should be there

## Customization (Steps 26-40)

26. **Create a configuration file**
    ```bash
    touch config.json
    ```

27. **Add basic configuration**:
    ```json
    {
      "exportPath": "/output",
      "exportPreset": "online",
      "deleteOldFiles": true,
      "exportOptions": {
        "graphViewOptions": {
          "enabled": true
        },
        "searchOptions": {
          "enabled": true,
          "placeholder": "Search my notes..."
        },
        "themeToggleOptions": {
          "enabled": true,
          "defaultTheme": "dark"
        }
      }
    }
    ```

28. **Update your automation to use the config**:
    ```yaml
    # In .github/workflows/export.yml, change the docker run line to:
    docker run --rm \
      -v $PWD/vault:/vault \
      -v $PWD/output:/output \
      -v $PWD/config.json:/config.json \
      kosmosisdire/obsidian-webpage-export:latest
    ```

29. **Add a custom domain** (optional)
    - Buy a domain (like yourname.com)
    - Create a file called `CNAME` in your project root
    - Put your domain in it: `echo "yourname.com" > CNAME`

30. **Customize the site title**
    - Add to config.json:
    ```json
    "rssOptions": {
      "enabled": true,
      "title": "My Digital Garden",
      "description": "My personal knowledge base"
    }
    ```

31. **Exclude private notes**
    - Create `.gitignore`:
    ```
    vault/Private/
    vault/Drafts/
    *.tmp
    ```

32. **Add Google Analytics** (optional)
    - Get a tracking ID from Google Analytics
    - Add to config.json:
    ```json
    "customHeadOptions": {
      "enabled": true,
      "content": "<script async src=\"https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID\"></script><script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'GA_TRACKING_ID');</script>"
    }
    ```

33. **Test locally before pushing**
    ```bash
    docker run --rm \
      -v ./vault:/vault \
      -v ./output:/output \
      -v ./config.json:/config.json \
      kosmosisdire/obsidian-webpage-export:latest
    
    open output/index.html
    ```

34. **Push your changes**
    ```bash
    git add .
    git commit -m "Add configuration"
    git push
    ```

35. **Wait for the site to update** (2-5 minutes)

36. **Check your live website** to make sure changes applied

37. **Set up automatic updates**
    - Every time you push to GitHub, your website updates automatically
    - No manual work needed

38. **Create a README for your repository**:
    ```markdown
    # My Digital Garden
    
    This is my personal knowledge base, automatically published from my Obsidian vault.
    
    Visit the website: https://yourusername.github.io/my-digital-garden
    ```

39. **Add the README**
    ```bash
    echo "# My Digital Garden" > README.md
    git add README.md
    git commit -m "Add README"
    git push
    ```

40. **Share your website** with friends and colleagues

## Maintenance (Steps 41-50)

41. **Update your notes regularly**
    - Just edit in Obsidian as normal
    - Copy updated files to your `vault/` folder
    - Push to GitHub

42. **Set up a sync script** (optional):
    ```bash
    #!/bin/bash
    # sync.sh
    cp -r /path/to/your/obsidian/vault/* ./vault/
    git add .
    git commit -m "Update notes $(date)"
    git push
    ```

43. **Make the script executable**
    ```bash
    chmod +x sync.sh
    ```

44. **Run it whenever you want to update**
    ```bash
    ./sync.sh
    ```

45. **Monitor your GitHub Actions**
    - Check the Actions tab if something breaks
    - Look for red X's (failures) or green checkmarks (success)

46. **Update the Docker image occasionally**
    ```bash
    docker pull kosmosisdire/obsidian-webpage-export:latest
    ```

47. **Backup your configuration**
    - Keep copies of `config.json` and `.github/workflows/export.yml`
    - These contain all your customizations

48. **Test with a small vault first**
    - If you have thousands of notes, try with just a few first
    - Make sure everything works before doing the full export

49. **Check your website regularly**
    - Make sure search works
    - Make sure all links work
    - Make sure images load

50. **Celebrate!** 🎉
    - You now have an automatically updating website from your Obsidian notes
    - Share it with the world or keep it private
    - Your knowledge is now accessible anywhere, anytime

## Quick Reference Commands

**Test export locally:**
```bash
docker run --rm -v ./vault:/vault -v ./output:/output -e EXPORT_ENTIRE_VAULT=true kosmosisdire/obsidian-webpage-export:latest
```

**Update and push:**
```bash
git add .
git commit -m "Update notes"
git push
```

**Check if Docker is running:**
```bash
docker ps
```

**View your website locally:**
```bash
open output/index.html
```

**Check GitHub Actions:**
Go to your repository → Actions tab

**Your website URL:**
`https://yourusername.github.io/repository-name`