const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

test.describe("Pens Game release assets", () => {
  test("workflow, kustomize, argocd, and launch docs match pensgame", async () => {
    const root = path.resolve(__dirname, "..");
    const workflow = fs.readFileSync(path.join(root, ".github/workflows/build-and-release.yml"), "utf8");
    const kustomization = fs.readFileSync(path.join(root, "deploy/k8s/overlays/prod/kustomization.yaml"), "utf8");
    const application = fs.readFileSync(path.join(root, "deploy/argocd/application.yaml"), "utf8");
    const checklist = fs.readFileSync(path.join(root, "deploy/launch-checklist.md"), "utf8");

    expect(workflow).toContain("APP_NAME: pensgame");
    expect(workflow).toContain("BUILD_NAMESPACE: webapp-build");
    expect(workflow).toContain("registry.144.91.77.245.sslip.io/pensgame");
    expect(workflow).toContain("deploy/k8s/overlays/prod/kustomization.yaml");
    expect(workflow).toContain("kaniko-builder");
    expect(workflow).toContain("KUBECONFIG_B64");
    expect(workflow).not.toContain("dokploy");

    expect(kustomization).toContain("namespace: pensgame");
    expect(kustomization).toContain("newName: registry.144.91.77.245.sslip.io/pensgame");
    expect(kustomization).toMatch(/newTag: (bootstrap|[0-9a-f]{40})/);

    expect(application).toContain("name: pensgame");
    expect(application).toContain("https://github.com/gateszhangc/pensgame.git");
    expect(application).toContain("path: deploy/k8s/overlays/prod");

    expect(checklist).toContain("GitHub repository: `gateszhangc/pensgame`");
    expect(checklist).toContain("Git branch: `main`");
    expect(checklist).toContain("Dokploy project: `n/a`");
    expect(checklist).toContain("Argo CD application: `pensgame`");
    expect(checklist).toContain("https://pensgame.lol/sitemap.xml");
    expect(checklist).toContain("Google account: `gateszhang92@gmail.com`");
    expect(checklist).toContain("Cloudflare");
  });
});
