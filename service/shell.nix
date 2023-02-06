let
  pkgs = import <nixos> {};
  node = pkgs.nodejs-18_x;
in
pkgs.mkShell {
  buildInputs = [node pkgs.neovim pkgs.jre pkgs.nodePackages_latest.npm];
}
