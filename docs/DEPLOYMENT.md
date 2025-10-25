# Deployment Guide: Netlify + PlanetScale

This guide walks you through deploying the JobPrep application to Netlify with PlanetScale MySQL database.

## Prerequisites

- GitHub account
- Netlify account (free tier works)
- PlanetScale account (free tier works)
- Git repository pushed to GitHub

---

## Part 1: Set Up PlanetScale Database

### Step 1: Create PlanetScale Account
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub (recommended)
3. Verify your email

### Step 2: Create Database
1. Click **"Create a database"**
2. Database name: `jobprep` (or your preferred name)
3. Region: Choose closest to your users (e.g., `us-east-1`)
4. Plan: **Hobby** (free tier)
5. Click **"Create database"**

### Step 3: Get Connection String
1. In your database dashboard, click **"Connect"**
2. Select **"Prisma"** from the framework dropdown
3. Copy the `DATABASE_URL` connection string
4. It looks like:
   ```
   mysql://username:password@aws.connect.psdb.cloud/jobprep?sslaccept=strict
   ```
5. **Save this securely** - you'll need it for Netlify

### Step 4: Initialize Database Schema
You have two options:

#### Option A: Using PlanetScale Console
1. In PlanetScale dashboard, click **"Console"** tab
2. Copy the schema from `web/prisma/schema.prisma`
3. Paste and execute the SQL commands

#### Option B: Using Prisma Migrate (Recommended)
```bash
# Set your PlanetScale connection string temporarily
export DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/jobprep?sslaccept=strict"

# Navigate to web directory
cd web

# Push schema to database
npx prisma db push

# Verify schema
npx prisma studio
```

---

## Part 2: Deploy to Netlify

### Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub (recommended)
3. Authorize Netlify to access your repositories

### Step 2: Create New Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your `JobPrep` repository
4. Netlify will auto-detect the configuration from `netlify.toml`

### Step 3: Configure Build Settings
Netlify should auto-populate these from `netlify.toml`:
- **Base directory**: `web`
- **Build command**: `npm ci && npx prisma generate && npm run build`
- **Publish directory**: `.next`

If not, enter them manually.

### Step 4: Set Environment Variables
Before deploying, add these environment variables:

1. Click **"Add environment variables"**
2. Add the following:

```bash
# Database Connection (from PlanetScale)
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/jobprep?sslaccept=strict

# Application Tier (optional, defaults to free)
NEXT_PUBLIC_TIER=free

# Netlify Blobs (auto-configured by Netlify)
# No action needed - Netlify sets these automatically
```

### Step 5: Deploy
1. Click **"Deploy [site-name]"**
2. Wait 2-5 minutes for build to complete
3. Watch build logs for any errors

### Step 6: Verify Deployment
1. Once deployed, click the generated URL (e.g., `https://your-site-name.netlify.app`)
2. Test the application:
   - Upload a resume
   - Paste a job description
   - Run analysis
   - Check database connection

---

## Part 3: Custom Domain (Optional)

### Step 1: Add Custom Domain
1. In Netlify site settings, go to **"Domain management"**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `jobprep.com`)

### Step 2: Configure DNS
1. Netlify will provide DNS records
2. Add these to your domain registrar:
   - **A Record**: `75.2.60.5`
   - **CNAME**: `your-site-name.netlify.app`
3. Wait for DNS propagation (5-60 minutes)

### Step 3: Enable HTTPS
1. Netlify auto-provisions SSL certificates
2. Wait for certificate to be issued (~1 minute)
3. Enable **"Force HTTPS"** in domain settings

---

## Part 4: Post-Deployment Configuration

### Environment-Specific Settings

#### Production Environment Variables
```bash
# Required
DATABASE_URL=mysql://...@aws.connect.psdb.cloud/jobprep?sslaccept=strict

# Optional - Feature Flags
NEXT_PUBLIC_TIER=free
NEXT_PUBLIC_API_URL=  # Leave empty for same-origin

# Optional - Analytics (if you add them later)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_SENTRY_DSN=https://...
```

### Database Maintenance

#### Backup Strategy
PlanetScale free tier includes:
- Automatic daily backups (retained for 7 days)
- Point-in-time recovery

#### Monitoring
1. PlanetScale dashboard shows:
   - Query performance
   - Connection count
   - Storage usage
2. Set up alerts for:
   - Storage > 80% (free tier: 5GB limit)
   - Connection errors

---

## Part 5: Continuous Deployment

### Automatic Deployments
Netlify automatically deploys when you push to GitHub:

1. **Production**: Pushes to `main` branch
2. **Preview**: Pull requests get preview URLs
3. **Branch deploys**: Configure in Netlify settings

### Deploy Hooks
Create webhook for manual deployments:
1. Netlify → Site settings → Build & deploy → Build hooks
2. Create hook: "Manual Deploy"
3. Use webhook URL to trigger builds

---

## Troubleshooting

### Build Fails: "Cannot find module '@prisma/client'"
**Solution**: Ensure build command includes `npx prisma generate`:
```bash
npm ci && npx prisma generate && npm run build
```

### Database Connection Error
**Solution**: Check environment variables:
1. Verify `DATABASE_URL` is set correctly
2. Ensure PlanetScale database is active
3. Check connection string format includes `?sslaccept=strict`

### 404 on Routes
**Solution**: Netlify plugin should handle Next.js routing automatically.
If not, add to `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Build Timeout
**Solution**: 
1. Check build logs for slow dependencies
2. Consider upgrading Netlify plan (15 min timeout on free tier)
3. Optimize build by removing unused dependencies

### Prisma Schema Changes Not Reflected
**Solution**:
1. Push schema changes to PlanetScale:
   ```bash
   npx prisma db push
   ```
2. Trigger new Netlify deployment
3. Verify `npx prisma generate` runs in build logs

---

## Cost Estimates

### Free Tier Limits

**PlanetScale Hobby (Free)**:
- 5GB storage
- 1 billion row reads/month
- 10 million row writes/month
- 1 production branch
- 1 development branch

**Netlify Free**:
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited sites
- Automatic HTTPS

### When to Upgrade

**PlanetScale** ($29/month):
- Storage > 5GB
- Need more than 1 production branch
- Need connection pooling

**Netlify** ($19/month):
- Bandwidth > 100GB
- Need more build minutes
- Want advanced features (split testing, etc.)

---

## Monitoring & Maintenance

### Weekly Checks
- [ ] Review PlanetScale query performance
- [ ] Check Netlify build logs for warnings
- [ ] Monitor storage usage

### Monthly Tasks
- [ ] Review database backup status
- [ ] Check bandwidth usage
- [ ] Update dependencies (`npm outdated`)

### Quarterly Tasks
- [ ] Review and optimize slow queries
- [ ] Audit environment variables
- [ ] Test disaster recovery process

---

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to Git
- ✅ Use Netlify UI to set production variables
- ✅ Rotate database credentials quarterly
- ✅ Use different credentials for dev/prod

### Database Security
- ✅ Enable PlanetScale IP restrictions (if available)
- ✅ Use read-only credentials where possible
- ✅ Monitor for unusual query patterns
- ✅ Keep Prisma client updated

### Application Security
- ✅ Enable HTTPS redirect in Netlify
- ✅ Set security headers in `netlify.toml`
- ✅ Implement rate limiting for API routes
- ✅ Sanitize user inputs

---

## Rollback Procedure

### If Deployment Fails
1. Go to Netlify → Deploys
2. Find last successful deploy
3. Click **"Publish deploy"** to rollback

### If Database Migration Fails
1. PlanetScale → Branches → Revert branch
2. Or restore from backup (Settings → Backups)

---

## Support & Resources

### Documentation
- [Netlify Docs](https://docs.netlify.com)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with PlanetScale](https://www.prisma.io/docs/guides/database/planetscale)

### Community
- [Netlify Community](https://answers.netlify.com)
- [PlanetScale Discord](https://discord.gg/planetscale)
- [Next.js Discord](https://discord.gg/nextjs)

---

## Next Steps

After successful deployment:
1. ✅ Test all features in production
2. ✅ Set up monitoring/analytics
3. ✅ Configure custom domain
4. ✅ Set up error tracking (Sentry, etc.)
5. ✅ Create backup/restore procedures
6. ✅ Document any custom configurations
