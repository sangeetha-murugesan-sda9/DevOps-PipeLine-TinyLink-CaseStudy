# Designing a Coherent DevOps Pipeline for a Full-Stack Web Application: A TinyLink Case Study

## 1. Introduction

This report documents a DevOps pipeline built around TinyLink, a small URL-shortening service. One Docker image moves from a pull request, through a continuous-integration gate, to a deployment onto infrastructure declared with Terraform. The report explains that architecture, how the components interact, why the main tools were chosen, how AI-assisted tools were used, and what limitations the system accepts.

## 2. Application

TinyLink is a small URL shortener. An Express API stores links in PostgreSQL, creates a short code or accepts a chosen alias, and redirects that code to the original URL. A React frontend provides the form and a QR code for each link. A multi-stage Docker build compiles the React app to static files and copies them into the Express server, so one container serves both the UI and the API. The pipeline builds, tests, and deploys that container. The application is kept small so the workflow around it stays the subject of the project.

## 3. Architecture and How the Components Interact

Figure 1 shows the flow from a pull request, through CI, to CD onto live infrastructure, with SonarCloud and Renovate feeding quality and dependency information back in.
![Figure 1. TinyLink end-to-end DevOps architecture and pipeline flow.](image.png)

CI (`ci.yml`) runs on every pull request to main and gates the merge. It lints the code, runs the tests against a real PostgreSQL 16 service container, runs a SonarCloud scan that must pass its quality gate, and builds the Docker image without pushing it. A ruleset on main requires a pull request and this check, so none of these steps can be skipped.

CD (`cd.yml`) runs only after a merge to main. It builds the image and pushes it to GitHub Container Registry, tagged with the commit SHA. It then runs `terraform apply` with that tag, so Render runs the image built from that commit, reads the service URL from the Terraform output, and calls `GET /health` as a smoke test. A failing smoke test turns a broken rollout into a red run immediately.

One Terraform stack declares a Neon PostgreSQL project and a Render web service running the container image from GHCR. Terraform state is kept remotely in HCP Terraform, because GitHub Actions runners are discarded after each run and cannot keep a local state file. API keys reach Terraform only as GitHub secrets passed as environment variables.

SonarCloud performs static analysis (bugs, vulnerabilities, and code smells) on each change. Renovate opens pull requests for outdated npm packages, the Docker base image, GitHub Actions, and Terraform providers. Those pull requests go through the same CI gate as any human change. A Renovate pull request that upgraded jsdom to v30 failed the frontend tests and never reached main.


## 4. Design Decisions

### 4.1 SonarCloud over Self-Hosted SonarQube

A self-hosted server would add a second piece of infrastructure to patch, back up, and secure. SonarCloud gives the same analysis and quality gate through one CI step and a token.

### 4.2 Renovate over Dependabot

Both tools open update pull requests. A single `renovate.json` covers npm for the client and the server, the Dockerfile, GitHub Actions, and Terraform providers, and it states a policy: minor and patch updates for npm and GitHub Actions may automerge, while Dockerfile and Terraform updates stay open for review. Major updates stay on that review path as well. Large bumps, such as React 19, Express 5, and jsdom 30, can break the build or require a newer Node version, and we did not want those to merge unreviewed.

### 4.3 Render and Neon over a Paid Cloud Target

Both have Terraform providers, so the infrastructure-as-code story is unchanged, and neither costs anything. We used Neon for the database because Render's own free Postgres expires after 30 days.

### 4.4 GitHub Actions and a Branch-Protected Main

Required status checks on the ruleset make the CI gate a property of the repository. This became concrete when a teammate pushed directly to main, which is what prompted us to enable the rule.

## 5. Use of AI-Assisted Tools

## 6. Limitations and Trade-offs

here is no staging stage, so a faulty deployment reaches the live service. Only the CI gate and the smoke test stand in front of it.
The Render provider cannot update a free-tier service in place, so a new image tag replaces the service. A deploy therefore causes a short outage and a new URL suffix. On a paid plan, an in-place update would avoid this.

Both Terraform providers needed workarounds that their documentation did not mention, and their versions are pinned loosely, so behaviour can change between applies.
Render sleeps after about 15 minutes without traffic and takes about a minute to answer the next request. Neon scales its compute to zero. The free-tier limits are on instance hours and storage, not on the number of deployments, and they do not delete the project.

SonarCloud and Renovate cover code and dependency issues. Nothing in the pipeline scans for committed secrets or for vulnerabilities in the container image.
The smoke test checks that `/health` answers. It does not check that creating and opening a link works.

Major dependency updates still open pull requests, but they are not automerged. The build stays stable, and those upgrades wait until someone reviews them.
SonarCloud, HCP Terraform, Render, and Neon are external services. We do not control their availability or their terms.

## 7. Conclusion

TinyLink's functionality is minimal on purpose. The substance is the pipeline: pull requests are gated by lint, tests, and a quality gate; a merge builds an image from that commit and deploys it with Terraform; and every choice above has a stated alternative and a stated cost. The pipeline is running, and we can explain how each part works and where it falls short.

