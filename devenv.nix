{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/packages/
  packages = [
    pkgs.actionlint
    pkgs.ollama
  ];

  # https://devenv.sh/languages/
  languages.javascript = {
    enable = true;
    npm = {
      enable = true;
    };
  };

  # https://devenv.sh/scripts/
  scripts.lint-all.exec = ''
    prek run --all-files
  '';
  scripts.cc-edit-lint-hook.exec = ''
    "$DEVENV_ROOT/scripts/cc-edit-lint-hook.mjs"
  '';

  # https://devenv.sh/git-hooks/
  git-hooks.hooks.npx-eslint-pkg-api = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/api -- npx eslint --cache --fix FILES";
    files = "^packages/api/.*\.[cm]?(js|ts)x?$";
  };
  git-hooks.hooks.npx-eslint-pkg-core = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/core -- npx eslint --cache --fix FILES";
    files = "^packages/core/.*\.[cm]?(js|ts)x?$";
  };
  git-hooks.hooks.npx-eslint-pkg-desktop-app = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/desktop-app -- npx eslint --cache --fix FILES";
    files = "^packages/desktop-app/.*\.[cm]?(js|ts)x?$";
  };
  git-hooks.hooks.npx-eslint-pkg-eslint-config = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/eslint-config -- npx eslint --cache --fix FILES";
    files = "^packages/eslint-config/.*\.[cm]?(js|ts)x?$";
  };
  git-hooks.hooks.npx-eslint-pkg-server = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/server -- npx eslint --cache --fix FILES";
    files = "^packages/server/.*\.[cm]?(js|ts)x?$";
  };
  git-hooks.hooks.npx-eslint-pkg-web-client = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/web-client -- npx eslint --cache --fix FILES";
    files = "^packages/web-client/.*\.[cm]?(js|ts)x?$";
  };
  git-hooks.hooks.npx-prisma-lint-pkg-core = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/core -- npx prisma-lint FILES";
    files = "^packages/core/.*\.prisma$";
  };
  git-hooks.hooks.actionlint = {
    enable = true;
    entry = "actionlint";
    files = "^.github/workflows/.*\.ya?ml$";
  };

  # See full reference at https://devenv.sh/reference/options/
}
