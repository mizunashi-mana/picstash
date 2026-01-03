{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/packages/
  packages = [ ];

  # https://devenv.sh/languages/
  languages.javascript = {
    enable = true;
    npm = {
      enable = true;
    };
  };

  # https://devenv.sh/scripts/
  scripts.cc-edit-lint-hook.exec = ''
    "$DEVENV_ROOT/scripts/cc-edit-lint-hook.mjs"
  '';

  # https://devenv.sh/git-hooks/
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
  git-hooks.hooks.npx-eslint-pkg-client = {
    enable = true;
    entry = "./scripts/run-script.mjs --cwd packages/client -- npx eslint --cache --fix FILES";
    files = "^packages/client/.*\.[cm]?(js|ts)x?$";
  };

  # See full reference at https://devenv.sh/reference/options/
}
