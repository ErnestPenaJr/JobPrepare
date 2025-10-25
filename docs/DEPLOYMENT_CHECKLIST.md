# Deployment Checklist

Use this checklist to deploy JobPrep to Netlify + PlanetScale in ~30 minutes.

---

## ☑️ Pre-Deployment (5 minutes)

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally (`cd web && npm test`)
- [ ] Build succeeds locally (`cd web && npm run build`)
- [ ] `.env.local` is NOT committed (check `.gitignore`)
- [ ] GitHub repository is public or Netlify has access

---

## 🗄️ Database Setup - PlanetScale (10 minutes)

### Create Account & Database
- [ ] Sign up at [planetscale.com](https://planetscale.com)
- [ ] Create new database named `jobprep`
- [ ] Select region closest to users (e.g., `us-east-1`)
- [ ] Choose **Hobby** plan (free)

### Get Connection String
- [ ] Click **"Connect"** in database dashboard
- [ ] Select **"Prisma"** from framework dropdown
- [ ] Copy `DATABASE_URL` connection string
- [ ] Save securely (you'll paste into Netlify)

### Initialize Schema
Choose one method:

**Option A: Local Push (Recommended)**
```bash
# From project root
cd web

# Set connection string temporarily
export DATABASE_URL="your-planetscale-connection-string"

# Push schema
npx prisma db push

# Verify (optional)
npx prisma studio
```

**Option B: PlanetScale Console**
- [ ] Go to database → **"Console"** tab
- [ ] Copy SQL from `web/prisma/schema.prisma`
- [ ] Execute in console

### Verify Database
- [ ] Check tables exist: `Feedback`, `FeedbackAttachment`, `Usage`, `User`
- [ ] Verify connection works

---

## 🚀 Netlify Setup (10 minutes)

### Create Account & Site
- [ ] Sign up at [netlify.com](https://netlify.com)
- [ ] Click **"Add new site"** → **"Import an existing project"**
- [ ] Choose **"Deploy with GitHub"**
- [ ] Select your `JobPrep` repository
- [ ] Authorize Netlify to access repo

### Verify Build Settings
Netlify auto-detects from `netlify.toml`:
- [ ] Base directory: `web`
- [ ] Build command: `npm ci && npx prisma generate && npm run build`
- [ ] Publish directory: `.next`

If not auto-detected, enter manually.

### Set Environment Variables
Click **"Add environment variables"** and add:

```bash
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/jobprep?sslaccept=strict
```

Optional variables:
```bash
NEXT_PUBLIC_TIER=free
```

- [ ] `DATABASE_URL` is set (from PlanetScale)
- [ ] Connection string includes `?sslaccept=strict`
- [ ] No trailing spaces in values

### Deploy
- [ ] Click **"Deploy [site-name]"**
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Watch build logs for errors

---

## ✅ Post-Deployment Verification (5 minutes)

### Test Application
- [ ] Open deployed URL (e.g., `https://your-site.netlify.app`)
- [ ] Page loads without errors
- [ ] Upload a test resume (PDF or DOCX)
- [ ] Paste a sample job description
- [ ] Click **"Analyze"**
- [ ] Verify results display correctly
- [ ] Check browser console for errors (F12)

### Test Database Connection
- [ ] Analysis results save to database
- [ ] Check PlanetScale dashboard for query activity
- [ ] Verify no connection errors in Netlify logs

### Check Build Logs
- [ ] No warnings about missing dependencies
- [ ] Prisma client generated successfully
- [ ] Next.js build completed without errors

---

## 🔧 Optional Configuration

### Custom Domain
- [ ] Add custom domain in Netlify settings
- [ ] Configure DNS records at registrar
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Enable **"Force HTTPS"**

### Monitoring
- [ ] Set up PlanetScale storage alerts (80% threshold)
- [ ] Configure Netlify deploy notifications
- [ ] Add error tracking (Sentry, etc.)

### Performance
- [ ] Test page load speed (Lighthouse)
- [ ] Verify images are optimized
- [ ] Check bundle size in build logs

---

## 🐛 Troubleshooting

### Build Fails
**Error**: "Cannot find module '@prisma/client'"
- [ ] Verify build command includes `npx prisma generate`
- [ ] Check `netlify.toml` is correct

**Error**: Build timeout
- [ ] Check for slow dependencies
- [ ] Consider upgrading Netlify plan

### Database Connection Fails
- [ ] Verify `DATABASE_URL` is set in Netlify
- [ ] Check connection string format
- [ ] Ensure PlanetScale database is active
- [ ] Verify `?sslaccept=strict` is in URL

### 404 Errors
- [ ] Verify `@netlify/plugin-nextjs` is in `package.json`
- [ ] Check `netlify.toml` has correct plugin config

### Slow Performance
- [ ] Check PlanetScale query performance
- [ ] Review Netlify function logs
- [ ] Optimize large dependencies

---

## 📋 Post-Launch Tasks

### Immediate (Day 1)
- [ ] Share URL with test users
- [ ] Monitor error logs
- [ ] Test all features in production
- [ ] Document any issues

### Week 1
- [ ] Review PlanetScale query performance
- [ ] Check Netlify bandwidth usage
- [ ] Gather user feedback
- [ ] Fix any critical bugs

### Month 1
- [ ] Review database storage usage
- [ ] Check build minute consumption
- [ ] Plan for scaling if needed
- [ ] Update dependencies

---

## 📞 Support Resources

**Stuck? Check these:**
- [Full Deployment Guide](./DEPLOYMENT.md)
- [Netlify Docs](https://docs.netlify.com)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Prisma + PlanetScale Guide](https://www.prisma.io/docs/guides/database/planetscale)

**Need help?**
- Netlify Support: [answers.netlify.com](https://answers.netlify.com)
- PlanetScale Discord: [discord.gg/planetscale](https://discord.gg/planetscale)

---

## ✨ Success Criteria

Your deployment is successful when:
- ✅ Site loads at Netlify URL
- ✅ Resume upload works
- ✅ Job analysis completes
- ✅ Results display correctly
- ✅ Database queries execute
- ✅ No console errors
- ✅ Build completes in <5 minutes

**Congratulations! Your app is live! 🎉**
