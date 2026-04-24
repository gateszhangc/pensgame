# Pens Game deployment

This project deploys through the Argo/Kubernetes release path. It does not use Dokploy.

## Mapping

- GitHub repository: `gateszhangc/pensgame`
- Git branch: `main`
- Image repository: `registry.144.91.77.245.sslip.io/pensgame`
- K8s build namespace: `webapp-build`
- K8s manifest path: `deploy/k8s/overlays/prod`
- Argo CD application: `pensgame`
- Primary domain: `https://pensgame.lol/`
- Dokploy project: `n/a`

Route:

`gateszhangc/pensgame -> main -> K8s build Job -> registry.144.91.77.245.sslip.io/pensgame -> deploy/k8s/overlays/prod -> pensgame`

## Release Flow

1. GitHub Actions runs browser tests and renders the production Kustomize overlay.
2. GitHub Actions creates a Kubernetes build Job in `webapp-build`.
3. The build Job clones the exact commit, builds with Kaniko, and pushes `registry.144.91.77.245.sslip.io/pensgame:<git-sha>`.
4. GitHub Actions updates `deploy/k8s/overlays/prod/kustomization.yaml` `newTag` to the same Git SHA and pushes a `[skip ci]` commit.
5. Argo CD syncs `pensgame` automatically from `deploy/k8s/overlays/prod`.

## DNS And Search

- DNS is managed in Cloudflare for `pensgame.lol`.
- Apex `A` record should point to `144.91.77.245`.
- `www` should be a `CNAME` to `pensgame.lol`.
- The ingress serves both `pensgame.lol` and `www.pensgame.lol` on the same certificate and forces HTTPS.
- Google Search Console uses the domain property `sc-domain:pensgame.lol`.
- Google account: `gateszhang92@gmail.com`
- `https://pensgame.lol/sitemap.xml` must be submitted to GSC.
- GA4 and Microsoft Clarity are intentionally disabled.
- Cloudflare DNS verification is the source of truth for the GSC domain property.

## Required GitHub Secret

- `KUBECONFIG_B64`: base64-encoded kubeconfig with access to `webapp-build`, `argocd`, and the target application namespace.

## One-Time Bootstrap

1. Create the GitHub repo at `gateszhangc/pensgame` and push `main`.
2. Add `KUBECONFIG_B64` to the GitHub repository secrets.
3. Apply the Argo CD application once:

```bash
kubectl apply -f deploy/argocd/application.yaml
```

4. Delegate DNS to Cloudflare and create the live records:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR="${WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR:-$CODEX_HOME/skills/webapp-launch-analytics}"
export PRIMARY_URL="https://pensgame.lol"
export DNS_TARGET_APEX_IP="144.91.77.245"
export DNS_TARGET_WWW="pensgame.lol"
export PORKBUN_NS_MODE="api"
export SKIP_GA4="true"
export SKIP_CLARITY="true"

bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/ensure-cloudflare-dns.sh" pensgame.lol
```

5. After the live domain resolves and `https://pensgame.lol/` returns the site, configure Google Search Console:

```bash
export PRIMARY_URL="https://pensgame.lol"
export GSC_PROPERTY_TYPE="domain"
export GSC_SITE_URL="sc-domain:pensgame.lol"
export GSC_SITEMAP_URL="https://pensgame.lol/sitemap.xml"
export SKIP_GA4="true"
export SKIP_CLARITY="true"

bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/setup-gsc.sh" pensgame.lol
bash "$WEBAPP_LAUNCH_ANALYTICS_SKILL_DIR/scripts/check-gsc-property.sh" pensgame.lol
```

## Validation

Local:

```bash
npm ci
npm test
kubectl kustomize deploy/k8s/overlays/prod >/tmp/pensgame-rendered.yaml
docker build -t pensgame .
docker run --rm -p 3000:3000 pensgame
curl http://127.0.0.1:3000/healthz
```

Production:

```bash
kubectl -n argocd get application pensgame
curl -I https://pensgame.lol/
curl -I https://www.pensgame.lol/
curl -I https://pensgame.lol/robots.txt
curl -I https://pensgame.lol/sitemap.xml
```

GSC:

```bash
export PRIMARY_URL="https://pensgame.lol"
export GSC_PROPERTY_TYPE="domain"
export GSC_SITE_URL="sc-domain:pensgame.lol"
export GSC_SITEMAP_URL="https://pensgame.lol/sitemap.xml"
export SKIP_GA4="true"
export SKIP_CLARITY="true"

bash "$HOME/.codex/skills/webapp-launch-analytics/scripts/check-gsc-property.sh" pensgame.lol
```

## Rollback

Set `deploy/k8s/overlays/prod/kustomization.yaml` `newTag` to a previous working Git SHA, commit with `[skip ci]`, and push to `main`. Argo CD will sync the previous image tag automatically.
