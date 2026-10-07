# @brrock/oj

Prebuilt Linux binaries of [oj](https://github.com/lovablelabs/oj) (lovablelabs' Rust frontend tooling), packaged for npm so it can run where you can't `cargo install`, like Vercel builds.

Upstream oj only ships to crates.io. This repo builds it from source for each oj release and publishes:

| package | contents |
|---|---|
| `@brrock/oj` | the `oj` command (a small Node launcher) |
| `@brrock/oj-linux-x64-gnu` | oj for Linux x64, glibc ≥ 2.34 |
| `@brrock/oj-linux-arm64-gnu` | oj for Linux arm64, glibc ≥ 2.34 |

npm installs only the platform package that matches the machine. Binaries are built inside `amazonlinux:2023`, which is Vercel's build image.

## Use on Vercel

```sh
npm i -D @brrock/oj
```

```json
{
  "scripts": {
    "build": "oj build"
  }
}
```

Set the Vercel project's output directory to `dist`. Versions match upstream oj versions.

Only Linux is supported. On macOS/Windows install oj with `cargo install oj --locked`; you can point the launcher at any binary with `OJ_BINARY_PATH=/path/to/oj`.

`@brrock/oj` depends on `rolldown@1.2.1` and sets `OJ_VENDORED_ROLLDOWN` to it, the same rolldown the upstream nix build vendors for oj's TanStack Start bundles. Set `OJ_VENDORED_ROLLDOWN=` (empty) to use the app's own rolldown instead.

## How releases work

`.github/workflows/release.yml` runs every 6 hours. When the latest `lovablelabs/oj` release isn't on npm yet, it:

1. builds `oj` for x64 and arm64 in `amazonlinux:2023` (fat-LTO release build, so expect 1–2 hours),
2. publishes the platform packages, then `@brrock/oj`, through npm trusted publishing (OIDC). Provenance is attached automatically and no npm token is stored.

To build a specific version by hand: `make release VERSION=0.2.16`.

## One-time setup

You need npm ≥ 11.10 (for `npm trust`) and 2FA enabled on your npm account.

```sh
make login     # npm login
make setup     # publishes empty 0.0.0 placeholders, then trusts release.yml for each package
make release   # build + publish the latest oj
make watch     # follow the run
```

Trusted publishing can only be configured on packages that already exist, which is why `setup` publishes placeholders first. Optionally run `make lockdown` afterwards to block token-based publishes.
