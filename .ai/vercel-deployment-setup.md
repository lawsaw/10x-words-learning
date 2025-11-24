# Vercel Deployment Setup

## Summary

This document describes the changes made to adapt the 10xWordsLearning project for deployment to Vercel.

## Changes Made

### 1. Vercel Configuration (`vercel.json`)

Created a new `vercel.json` configuration file with:

- Build and development commands
- Framework detection (Next.js)
- Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENROUTER_API_KEY`

### 2. GitHub Actions Workflow (`master.yml`)

Created a new CI/CD workflow for the `main` branch with the following jobs:

#### Jobs:

1. **Lint Code**: Runs ESLint on the codebase
2. **Build**: Builds the Next.js application
3. **Unit Tests**: Runs unit tests with coverage
4. **Deploy to Vercel**: Deploys the application to Vercel production
5. **Status Notification**: Posts deployment status to commit comments

#### Key Features:

- Automatic deployment on push to `main` branch
- Runs lint, build, and unit tests before deployment
- Uses Vercel CLI for deployment
- Posts deployment URL and status as commit comments
- Excludes E2E tests (as requested)

### 3. Required GitHub Secrets

To use this workflow, configure the following secrets in your GitHub repository:

#### Vercel Secrets:

- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

#### Application Secrets:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `OPENROUTER_API_KEY`: OpenRouter API key

### 4. Actions Version Verification

All GitHub Actions are using the latest major versions:

- ✅ `actions/checkout@v5` (latest: v5.0.1)
- ✅ `actions/setup-node@v6` (latest: v6.0.0)
- ✅ `actions/upload-artifact@v5` (latest: v5.0.0)
- ✅ `actions/github-script@v8` (latest: v8)

All actions are active and not deprecated.

## How to Deploy

### Initial Setup:

1. **Create a Vercel Project**:
   - Visit [Vercel](https://vercel.com)
   - Create a new project linked to your GitHub repository
   - Note down the Project ID and Organization ID

2. **Get Vercel Token**:
   - Go to Vercel Account Settings → Tokens
   - Create a new token with appropriate permissions

3. **Configure GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add all required secrets listed above

4. **Configure Vercel Environment Variables**:
   - In your Vercel project dashboard, add the same environment variables
   - Or they will be pulled from the `vercel.json` configuration

### Deployment Process:

1. Push changes to the `main` branch
2. GitHub Actions will automatically:
   - Run linting
   - Build the application
   - Run unit tests
   - Deploy to Vercel if all checks pass
3. Deployment URL will be posted as a commit comment

## Next.js Configuration

The current `next.config.ts` is minimal and ready for Vercel deployment. No additional configuration is needed as Vercel automatically handles Next.js projects.

## Environment Variables

All environment variables are properly configured:

- Build-time variables (NEXT*PUBLIC*\*) are available during build
- Server-side variables are available at runtime
- All sensitive keys are stored as secrets

## Monitoring

After deployment:

- Check the GitHub Actions tab for workflow status
- View deployment logs in Vercel dashboard
- Check commit comments for deployment URLs and status

## Troubleshooting

If deployment fails:

1. Check GitHub Actions logs for error messages
2. Verify all secrets are correctly configured
3. Ensure Vercel project is properly linked
4. Check Vercel dashboard for deployment logs
5. Verify environment variables are set in Vercel

## Differences from Pull Request Workflow

The `master.yml` workflow differs from `pull-request.yml`:

- Triggers on push to `main` (not on pull requests)
- Excludes E2E tests to speed up deployment
- Includes a deployment job with Vercel CLI
- Posts status as commit comments (not PR comments)
- Uses production environment for deployment
