# 🚀 Quick Start: Deploy to Netlify + MySQL

Deploy your JobPrep app in **~20 minutes** with this streamlined guide.

---

## 📋 What You'll Need

- GitHub account with this repo pushed
- 20 minutes of time
- Your MySQL database (already configured at pena-cloud.network)

---

## Step 1: Database Setup (5 min)

### 1.1 Your MySQL Database
You already have a MySQL database at `pena-cloud.network:3307/JOBPREP`

### 1.2 Initialize Schema
```bash
# From your project root
cd web

# Copy environment template
cp .env.local.example .env.local

# The DATABASE_URL is already configured in .env.local.example:
# mysql://ernestpenajr:%24268RedDragons@pena-cloud.network:3307/JOBPREP

# Push schema to your database
npx prisma db push

# You should see: "Your database is now in sync with your schema"
```

**Note:** The `%24` in the connection string is the URL-encoded version of `$` in your password.

✅ **Database ready!**

---

## Step 2: Netlify Deployment (10 min)

### 2.1 Create Account
```
1. Go to: https://netlify.com
2. Click "Sign up" → Use GitHub
3. Authorize Netlify
```

### 2.2 Import Project
```
1. Click "Add new site" → "Import an existing project"
2. Choose "Deploy with GitHub"
3. Find and select your "JobPrep" repository
4. Click on the repository
```

### 2.3 Configure Build
Netlify should auto-detect these settings from `netlify.toml`:

```
Base directory: web
Build command: npm ci && npx prisma generate && npm run build
Publish directory: .next
```

If not shown, enter them manually.

### 2.4 Set Environment Variables
**BEFORE clicking Deploy**, add environment variables:

```
1. Click "Add environment variables"
2. Add this variable:

   Key: DATABASE_URL
   Value: mysql://ernestpenajr:%24268RedDragons@pena-cloud.network:3307/JOBPREP

3. Optional - Add:
   Key: NEXT_PUBLIC_TIER
   Value: free
```

**Important:** The `%24` is the URL-encoded version of `$` in your password. This is required for the connection string to work properly.

### 2.5 Deploy!
```
1. Click "Deploy [your-site-name]"
2. Wait 2-5 minutes
3. Watch the build logs
```

✅ **Site deployed!**

---

## Step 3: Verify (5 min)

### 3.1 Open Your Site
```
1. Click the generated URL (e.g., https://your-site-name.netlify.app)
2. Page should load without errors
```

### 3.2 Test Functionality
```
1. Upload a test resume (PDF or DOCX)
2. Paste a sample job description
3. Click "Analyze"
4. Verify results display
```

### 3.3 Check Database
```
1. Check your MySQL database logs at pena-cloud.network
2. Verify new tables were created: Feedback, FeedbackAttachment, Usage, User
3. You should see query activity from the application
```

✅ **Everything works!**

---

## 🎉 Success!

Your app is now live at: `https://your-site-name.netlify.app`

### What's Next?

**Optional Enhancements:**
- [ ] Add custom domain (see [full guide](./docs/DEPLOYMENT.md))
- [ ] Set up monitoring/analytics
- [ ] Configure error tracking
- [ ] Optimize performance

**Maintenance:**
- Check PlanetScale storage weekly
- Monitor Netlify bandwidth usage
- Update dependencies monthly

---

## 🐛 Quick Troubleshooting

### Build Failed?
**Check build logs for:**
- Missing `npx prisma generate` in build command
- Wrong `DATABASE_URL` format
- Missing dependencies

**Fix:** Update `netlify.toml` or environment variables

### Database Connection Error?
**Verify:**
- `DATABASE_URL` is set in Netlify UI
- Connection string includes `?sslaccept=strict`
- PlanetScale database is active

**Fix:** Re-copy connection string from PlanetScale

### 404 Errors?
**Check:**
- `@netlify/plugin-nextjs` is in `web/package.json`
- `netlify.toml` has correct plugin config

**Fix:** Redeploy after verifying config

---

## 📚 Full Documentation

For detailed guides, see:
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Complete instructions
- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[Environment Variables](./web/.env.local.example)** - Configuration reference

---

## 💰 Cost Breakdown

### Your Setup

**MySQL Database (Your Existing Server)**
- Already configured at pena-cloud.network
- No additional cost

**Netlify (FREE)**
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- Automatic HTTPS

**Total Additional Cost: $0/month** 🎉

### When to Upgrade?
- Netlify: When bandwidth > 100GB ($19/month)

---

## 🆘 Need Help?

**Documentation:**
- [Netlify Docs](https://docs.netlify.com)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Prisma + PlanetScale](https://www.prisma.io/docs/guides/database/planetscale)

**Community Support:**
- [Netlify Community](https://answers.netlify.com)
- [PlanetScale Discord](https://discord.gg/planetscale)

**Stuck?** Open an issue in this repository.

---

**Happy Deploying! 🚀**
