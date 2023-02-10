{config, pkgs, lib, ...}: 

with lib;

let
  cfg = config.services.ssoTest;
in
{
  options = {
    services.ssoTest = {
      port = mkOption {
        description = "Port";
        type = types.ints.positive;
      };

      domain = mkOption {
        description = "Domain";
        type = types.path;
      };

      sessionSecret = mkOption {
        description = "Session secret";
        type = types.path;
      };

      samlCertificateKey = mkOption {
        description = "SAML certificate key";
        type = types.path;
      };

      #oidcCertificate = mkOption {
      #  description = "OIDC certificate";
      #  type = types.path;
      #};

      idpMetadata = mkOption {
        description = "IDP metadata";
        type = types.path;
      };
    };
  };

  config = {
    users.users.sso-test-runner = {
      isSystemUser = true;
    };

    systemd.services.ssoTest = {
      wantedBy = ["multi-user.target"]; 
      after = ["network.target"];
      description = "SSO-test service";
      environment = {
        NODE_ENV = "production";
        PORT = "8080";
        SESSION_SECRET = cfg.sessionSecret;
        DOMAIN = cfg.domain;
        OIDC_CERTIFICATE_KEY = cfg.oidcCertificateKey;
        #SAML_CERTIFICATE = cfg.samlCertificate;
        IDP_METADATA = cfg.idpMetadata;
      };
      serviceConfig = {
        Type = "simple";
        User = "sso-test-runner";
        Restart = "always";
        ExecStart = "${pkgs.service}/bin/service";
      };
    };
  };
}
