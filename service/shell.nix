let
  pkgs = import <nixpkgs> {};
  node = pkgs.nodejs-19_x;
in
pkgs.mkShell {
  buildInputs = [node pkgs.nodePackages.npm];
}
