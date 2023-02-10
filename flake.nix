{
  inputs = {
    nixpkgs.url = github:NixOS/nixpkgs;
    dream2nix.url = "github:nix-community/dream2nix";
  };

  outputs = {self, nixpkgs, dream2nix}: {
    nixosModules.service = import ./service/module.nix;
  } // dream2nix.lib.makeFlakeOutputs {
    systems = ["x86_64-linux"];
    config.projectRoot = ./.;
    source = ./.;
    projects = ./projects.toml;
  };
}
