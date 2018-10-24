const { expect } = require('../../test-helper');
const server = require('../../../server');

const spMetadata = `<?xml version="1.0"?>
  <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="http://localhost:3000/api/saml/metadata.xml" ID="http___localhost_8080_gar_metadata_xml">
    <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
      <KeyDescriptor>
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>MIICCzCCAXQCCQD2MlHh/QmGmjANBgkqhkiG9w0BAQsFADBKMQswCQYDVQQGEwJG
  UjEPMA0GA1UECAwGRlJBTkNFMQ4wDAYDVQQHDAVQQVJJUzEMMAoGA1UECgwDUElY
  MQwwCgYDVQQLDANERVYwHhcNMTgxMDIyMTQ1MjQ5WhcNMTkxMDIyMTQ1MjQ5WjBK
  MQswCQYDVQQGEwJGUjEPMA0GA1UECAwGRlJBTkNFMQ4wDAYDVQQHDAVQQVJJUzEM
  MAoGA1UECgwDUElYMQwwCgYDVQQLDANERVYwgZ8wDQYJKoZIhvcNAQEBBQADgY0A
  MIGJAoGBAMbY6nVh9GjtlyIm6KxQ8p+2dOE+wWTRq6Kg/481ovarmJWyW10LgZir
  fUvKrLqK5OdJ9+svOl2/JokF8ckOQmR/VWtuwcb6EvEfIMgLwQGZYKIPrdGN56Bc
  Y0+aprp8SIMfsrtR+NrWp0QJIRc6aWd5WWQybKNwFeGz2WIWzQXRAgMBAAEwDQYJ
  KoZIhvcNAQELBQADgYEACRHKc85tMIANiX+4agaZFPluqoo2cjk6ph6FAigNuIZZ
  r6mEAVCUh8Pmh5fQzUP9vl6Baqw+x5RBIw919OwzwcMCN3hNTi2k4oO4Kua/DJ/1
  fWJRqfnAZU3M6Y7Tfjfg7yhSkHuPYVew4SHMtWSYEkP0opnxjXIiBWfhpDY8EuE=
  </ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
        <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
        <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
        <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"/>
      </KeyDescriptor>
      <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://localhost:3000/api/saml/notifylogout"/>
      <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
      <AssertionConsumerService index="1" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://localhost:3000/api/saml/assert"/>
      <AttributeConsumingService index="1">
        <ServiceName>Default Service</ServiceName>
        <RequestedAttribute FriendlyName="eduPersonPrincipalName" Name="urn:oid:1.3.6.1.4.1.5923.1.1.1.6" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
        <RequestedAttribute FriendlyName="mail" Name="urn:oid:0.9.2342.19200300.100.1.3" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
        <RequestedAttribute FriendlyName="displayName" Name="urn:oid:2.16.840.1.113730.3.1.241" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"/>
      </AttributeConsumingService>
    </SPSSODescriptor>
  </EntityDescriptor>`;

const idpMetadata = `<?xml version="1.0"?>
  <md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:mdattr="urn:oasis:names:tc:SAML:metadata:attribute" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:shibmd="urn:mace:shibboleth:metadata:1.0" xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="https://pixpoc.samlidp.io/saml2/idp/metadata.php">
    <md:Extensions>
      <mdattr:EntityAttributes>
        <saml:Attribute Name="http://macedir.org/entity-category-support" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">
          <saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:string">http://refeds.org/category/research-and-scholarship</saml:AttributeValue>
        </saml:Attribute>
      </mdattr:EntityAttributes>
    </md:Extensions>
    <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
      <md:Extensions>
        <shibmd:Scope regexp="false">pixpoc.samlidp.io</shibmd:Scope>
        <mdui:UIInfo>
          <mdui:DisplayName xml:lang="en">Pix POC</mdui:DisplayName>
        </mdui:UIInfo>
      </md:Extensions>
      <md:KeyDescriptor use="signing">
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>MIICxDCCAaygAwIBAgIUEpX6nxWA6XQA1CMkzAopdqUjfLkwDQYJKoZIhvcNAQEFBQAwHDEaMBgGA1UEAwwRcGl4cG9jLnNhbWxpZHAuaW8wHhcNMTgxMDE3MTAzMzQ0WhcNMTkxMDE3MTAzMzQ0WjAcMRowGAYDVQQDDBFwaXhwb2Muc2FtbGlkcC5pbzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJqXgIkxAA1TnIrti8LNoKECnZfp8QKEoWMTgymZ3MgHDNjOcLT+otUx6D5UBN0uTLbMLaDmIgYe6kyEGVoySNZQmd5i15ZEqYUqCArGVUjsHX7nkHvQp39L8RDHq1Tl7rCMhk3O7zH2zSbmg3NUZfdFJE3IiYVGweWIDHcJ8QtzKsQ+oaWjR629cEEH+EdZZNanT8HePd8ZLtviyBFqa5mSAO/HVf5wPHilWicT9BDuRD+K2029Lxwn8WZ/797mECfGefQpsYOi1rmjc6vBWexG9mr97cYjqr+GSeAgBOftZ5iw85GzwN3JFgnF9+3AVLd518UmREXKyqR/S54coSUCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAY2tmwOVk4aN/b4j/T6uXKKdfeBPQgiPDRnhQcIq29eAV1Rmbl83+vFAkcauX+ki4xTuHarb2070l5YFa+RyBZmCOKC8i0udO75pYKBhMfQh/Y4KRfVBat+poYMVFCZZJhwpUdGm5D2bTw5cWaAXp3vVtqASPaERfVJoqfFQ1bD8pkMJVuANWMhAHxRXLLtWMsRpaIzIEq75nsMrUpPusJ89ccJgjY0zRltBwKSrvV4nJK08xsdInrnXrZoC9Yf1/TM+Y5QUR8ZiWKERyaMcLq+O0KTSatygUQgSL3pUKi0or/I/uCrZp3pdkB8GNRV6Ji0o1JmETIfdyMXK+5xXtBw==</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </md:KeyDescriptor>
      <md:KeyDescriptor use="encryption">
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>MIICxDCCAaygAwIBAgIUEpX6nxWA6XQA1CMkzAopdqUjfLkwDQYJKoZIhvcNAQEFBQAwHDEaMBgGA1UEAwwRcGl4cG9jLnNhbWxpZHAuaW8wHhcNMTgxMDE3MTAzMzQ0WhcNMTkxMDE3MTAzMzQ0WjAcMRowGAYDVQQDDBFwaXhwb2Muc2FtbGlkcC5pbzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJqXgIkxAA1TnIrti8LNoKECnZfp8QKEoWMTgymZ3MgHDNjOcLT+otUx6D5UBN0uTLbMLaDmIgYe6kyEGVoySNZQmd5i15ZEqYUqCArGVUjsHX7nkHvQp39L8RDHq1Tl7rCMhk3O7zH2zSbmg3NUZfdFJE3IiYVGweWIDHcJ8QtzKsQ+oaWjR629cEEH+EdZZNanT8HePd8ZLtviyBFqa5mSAO/HVf5wPHilWicT9BDuRD+K2029Lxwn8WZ/797mECfGefQpsYOi1rmjc6vBWexG9mr97cYjqr+GSeAgBOftZ5iw85GzwN3JFgnF9+3AVLd518UmREXKyqR/S54coSUCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAY2tmwOVk4aN/b4j/T6uXKKdfeBPQgiPDRnhQcIq29eAV1Rmbl83+vFAkcauX+ki4xTuHarb2070l5YFa+RyBZmCOKC8i0udO75pYKBhMfQh/Y4KRfVBat+poYMVFCZZJhwpUdGm5D2bTw5cWaAXp3vVtqASPaERfVJoqfFQ1bD8pkMJVuANWMhAHxRXLLtWMsRpaIzIEq75nsMrUpPusJ89ccJgjY0zRltBwKSrvV4nJK08xsdInrnXrZoC9Yf1/TM+Y5QUR8ZiWKERyaMcLq+O0KTSatygUQgSL3pUKi0or/I/uCrZp3pdkB8GNRV6Ji0o1JmETIfdyMXK+5xXtBw==</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </md:KeyDescriptor>
      <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://pixpoc.samlidp.io/saml2/idp/SingleLogoutService.php"/>
      <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://pixpoc.samlidp.io/saml2/idp/SingleLogoutService.php"/>
      <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
      <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://pixpoc.samlidp.io/saml2/idp/SSOService.php"/>
      <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://pixpoc.samlidp.io/saml2/idp/SSOService.php"/>
    </md:IDPSSODescriptor>
    <md:Organization>
      <md:OrganizationName xml:lang="en">Pix POC</md:OrganizationName>
      <md:OrganizationDisplayName xml:lang="en">Pix POC</md:OrganizationDisplayName>
      <md:OrganizationURL xml:lang="en">https://pix.fr</md:OrganizationURL>
    </md:Organization>
    <md:ContactPerson contactType="technical">
      <md:GivenName>Jonathan</md:GivenName>
      <md:SurName>Perret</md:SurName>
      <md:EmailAddress>mailto:jonathan.perret@pix.fr</md:EmailAddress>
    </md:ContactPerson>
  </md:EntityDescriptor>`;

const expiredSamlResponse = 'PHNhbWxwOlJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphc3NlcnRpb24iIElEPSJfNjlkZjIyNTU1NDJlMWM0MWYyZDg2N2UwMzQ5ZTdhZTIyMDIzMzhiOWEzIiBWZXJzaW9uPSIyLjAiIElzc3VlSW5zdGFudD0iMjAxOC0xMC0yNFQxNTo0ODo1NFoiIERlc3RpbmF0aW9uPSJodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpL3NhbWwvYXNzZXJ0IiBJblJlc3BvbnNlVG89Il9lNWI2MjZiZS04M2MyLTQ3ZWEtYjAxYy1jNWRkMzZmODA5NTIiPjxzYW1sOklzc3Vlcj5odHRwczovL3BpeHBvYy5zYW1saWRwLmlvL3NhbWwyL2lkcC9tZXRhZGF0YS5waHA8L3NhbWw6SXNzdWVyPjxkczpTaWduYXR1cmUgeG1sbnM6ZHM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPgogIDxkczpTaWduZWRJbmZvPjxkczpDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIi8+CiAgICA8ZHM6U2lnbmF0dXJlTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI3JzYS1zaGExIi8+CiAgPGRzOlJlZmVyZW5jZSBVUkk9IiNfNjlkZjIyNTU1NDJlMWM0MWYyZDg2N2UwMzQ5ZTdhZTIyMDIzMzhiOWEzIj48ZHM6VHJhbnNmb3Jtcz48ZHM6VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI2VudmVsb3BlZC1zaWduYXR1cmUiLz48ZHM6VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIi8+PC9kczpUcmFuc2Zvcm1zPjxkczpEaWdlc3RNZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjc2hhMSIvPjxkczpEaWdlc3RWYWx1ZT53Z0NsdDNCdzZrR2lEcEU4eTZKdG96eWNQNjA9PC9kczpEaWdlc3RWYWx1ZT48L2RzOlJlZmVyZW5jZT48L2RzOlNpZ25lZEluZm8+PGRzOlNpZ25hdHVyZVZhbHVlPlVyVUpoOStIYlZCditENzNsR0EzN0VQdWpiN3NieFBJdUs2U1pQTHJLSFhGQ1BXMVhDZ3VVRTZoZ3NEYTlTMWF0bU9RRWd5RFphRnZoTDU4VkRNeS80WXc5UDRwbzZuRjhoci90Q0MxWTNqMXpxWjRMdVg3QWRTNHlwc3oyUlNUOUgyaDhFQVErQjdnbXVzaDBQOUZOc3NyOUpJOFhPSzhRUytjTmNXMjc4aDIrWms4UW5MSDEzbURSYkRpNFViRXhZS1NSRlp0VTFBd0VzSDgwOUdvWUdXWWludjhlcVpCSDIyaE5ueXNkS2NPOElBSzVqK3BBVzMyS0dFcUZrdGk0NUNVZWxPdStQaTU2NVRRdWVwVk55UTVpcHNPQlNobUdyQ1kzMFEyVGc0aUI0ZVNWcktienBtOHk4SWlUYVpLMFBITDhpN1Q5SXgwaStMajdrYVpTQT09PC9kczpTaWduYXR1cmVWYWx1ZT4KPGRzOktleUluZm8+PGRzOlg1MDlEYXRhPjxkczpYNTA5Q2VydGlmaWNhdGU+TUlJQ3hEQ0NBYXlnQXdJQkFnSVVFcFg2bnhXQTZYUUExQ01rekFvcGRxVWpmTGt3RFFZSktvWklodmNOQVFFRkJRQXdIREVhTUJnR0ExVUVBd3dSY0dsNGNHOWpMbk5oYld4cFpIQXVhVzh3SGhjTk1UZ3hNREUzTVRBek16UTBXaGNOTVRreE1ERTNNVEF6TXpRMFdqQWNNUm93R0FZRFZRUUREQkZ3YVhod2IyTXVjMkZ0Ykdsa2NDNXBiekNDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFKcVhnSWt4QUExVG5JcnRpOExOb0tFQ25aZnA4UUtFb1dNVGd5bVozTWdIRE5qT2NMVCtvdFV4NkQ1VUJOMHVUTGJNTGFEbUlnWWU2a3lFR1ZveVNOWlFtZDVpMTVaRXFZVXFDQXJHVlVqc0hYN25rSHZRcDM5TDhSREhxMVRsN3JDTWhrM083ekgyelNibWczTlVaZmRGSkUzSWlZVkd3ZVdJREhjSjhRdHpLc1Erb2FXalI2MjljRUVIK0VkWlpOYW5UOEhlUGQ4Wkx0dml5QkZxYTVtU0FPL0hWZjV3UEhpbFdpY1Q5QkR1UkQrSzIwMjlMeHduOFdaLzc5N21FQ2ZHZWZRcHNZT2kxcm1qYzZ2QldleEc5bXI5N2NZanFyK0dTZUFnQk9mdFo1aXc4NUd6d04zSkZnbkY5KzNBVkxkNTE4VW1SRVhLeXFSL1M1NGNvU1VDQXdFQUFUQU5CZ2txaGtpRzl3MEJBUVVGQUFPQ0FRRUFZMnRtd09WazRhTi9iNGovVDZ1WEtLZGZlQlBRZ2lQRFJuaFFjSXEyOWVBVjFSbWJsODMrdkZBa2NhdVgra2k0eFR1SGFyYjIwNzBsNVlGYStSeUJabUNPS0M4aTB1ZE83NXBZS0JoTWZRaC9ZNEtSZlZCYXQrcG9ZTVZGQ1paSmh3cFVkR201RDJiVHc1Y1dhQVhwM3ZWdHFBU1BhRVJmVkpvcWZGUTFiRDhwa01KVnVBTldNaEFIeFJYTEx0V01zUnBhSXpJRXE3NW5zTXJVcFB1c0o4OWNjSmdqWTB6Umx0QndLU3J2VjRuSkswOHhzZElucm5YclpvQzlZZjEvVE0rWTVRVVI4WmlXS0VSeWFNY0xxK08wS1RTYXR5Z1VRZ1NMM3BVS2kwb3IvSS91Q3JacDNwZGtCOEdOUlY2SmkwbzFKbUVUSWZkeU1YSys1eFh0Qnc9PTwvZHM6WDUwOUNlcnRpZmljYXRlPjwvZHM6WDUwOURhdGE+PC9kczpLZXlJbmZvPjwvZHM6U2lnbmF0dXJlPjxzYW1scDpTdGF0dXM+PHNhbWxwOlN0YXR1c0NvZGUgVmFsdWU9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpzdGF0dXM6U3VjY2VzcyIvPjwvc2FtbHA6U3RhdHVzPjxzYW1sOkVuY3J5cHRlZEFzc2VydGlvbj48eGVuYzpFbmNyeXB0ZWREYXRhIHhtbG5zOnhlbmM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvMDQveG1sZW5jIyIgeG1sbnM6ZHNpZz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyIgVHlwZT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjRWxlbWVudCI+PHhlbmM6RW5jcnlwdGlvbk1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvMDQveG1sZW5jI2FlczEyOC1jYmMiLz48ZHNpZzpLZXlJbmZvIHhtbG5zOmRzaWc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjx4ZW5jOkVuY3J5cHRlZEtleT48eGVuYzpFbmNyeXB0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8wNC94bWxlbmMjcnNhLW9hZXAtbWdmMXAiLz48eGVuYzpDaXBoZXJEYXRhPjx4ZW5jOkNpcGhlclZhbHVlPk5Ld1hiT1FvcEt6azVuWlNhaFlUTG9hWGhXeTBlbk1qWURnUHFUSlpCejBzbEh3QldJYzNOUDlLT090RkFxUXo2UXhqbzNnWWIvc2xSZVliTnl4YlcyZExNaEFkdm9hbjh6YTN1c1cyOUY4Y2hOa0pmUVlCM0o1UDIyWE12ajZEVWhXWGxtQnUzdXl0TFpHYXc2UVQ5WTJQa2RKRkJIZjVJa1RDUzd1ZllaYz08L3hlbmM6Q2lwaGVyVmFsdWU+PC94ZW5jOkNpcGhlckRhdGE+PC94ZW5jOkVuY3J5cHRlZEtleT48L2RzaWc6S2V5SW5mbz4KICAgPHhlbmM6Q2lwaGVyRGF0YT4KICAgICAgPHhlbmM6Q2lwaGVyVmFsdWU+N2xQcE9lSUtnRE1aQ3dBVU5SRDM3Rnk5L1JWVktRNzl1bkZzTWZybUhYOUFKTTNnYlJyUXNCbTk4UEtEMUJ5clR2aTgwcUt5elViaktrRnVVUCtiQ25JYmQxWTNKVkwrT1U3VGZKQjBzZktNS2IrTE40eFVwOGpreWZ4NzJYS0xXdEFNL1pCTmZxaUYyTG5wNTZXS0EvYzFHQ0NZTDk5RDd1aURDdFVoQm1NZjZXNjJrVm8wZ1F1K1NJY2ZkQ1AxQkVSODdHVzh0dTR3MjZjODhyTzVPbUFmdFJSQVV5aFB6RlR4TG1CZEJpUUJDMytvSDZkRjNKbzh2VmxZaDl5WXpaZVNrTFU2aUJyN2U5NnNkRmVyc0t3WThCTGpNUzllakcyZEZ6S0hXcHpGY3NObG53bG1tbnhTWDZqcWdIcCtaaTRMT0VtK05NV3Evd0FaNGx4RUduTnNoc3hkV1lGSmg1U3FXM1hXbzVBTkhoaTA2dW42MjRUdG8yNVdqUkVvV2NiSE1IRHI1VjZldCtZVDYxQVBQeXlyR3N2czE2NnRDWTlpMityQlVreDd1Umt5TmdFTVpkOGZiRTE4b2lyTk5qYjhoM0NNS055U1JCdUxVVGx0UTNUSzFKYkdtUzFlNU12eGpBMlNtYTFNYTJhMFJZT3NMUFhaNng2TkZyem52aGlyL3k0VGlsUGtpTU5lL0xFRjVXNHJuYWlrRmtiSjBWVE5TSjRWSmdFT1lPTDBNaWxpQW01MzM5WTQvWG5EU0dmNmtoTTY0M2owTmZlNGl3aXVtcmltbG5kY1pqdTlDK2F5MFpBRVNjamRFdUR2M2xvVTZIYmxEdmVtTE9adDgvN081NVFQbjNyY3p6Rm1Kc0tPUXhvb1IrRHFnVVVkUmI5MXdqVmVwZXVHRHl1Q3NRMEd1bk85YlhzckZhY0R3Rzc0TWhZSVVHanlIenBib2FhWDYwaXpxWVNmRWtLaHRHNFlLYWQzZnhwRXdoSkNYUnU0RC9mUklwN0wxS0xGRWdlekUxSFVOMEJML0FzSGdiNjBEak5iNDBzdWtJd3NFbjZKQms3SDV6MlNyWW4wOGFUMVZPUmkrcnNHb1ZPY0xEZ3FkbkVXekpMbjJBUklUaENzY0g3SytJMW1nVFpCd0lqUzljT2VrdndEVFlwdEpCQS9aemdxNjRlMWxNRVFDdjV1cE5PVWtnTXY1K1ZaNnJzbmhxUTk1R3ZoMWNuRjZzZzg2SnE0QWNNTFJ4VFpXa2c2a2xPNlcyY1J0aUVuRmcwb3NIc05HRTdjb3g3cGMvY3ozRG5RcHhrRi81RFJiWHM1cE1pQnJPTFN4MzRtYTlYdng5R0JzNUczc1ZHcU9nM29BZmc4TUJvWlRnZkE5V0M2QitDbGJiT2lIYXR2NGpmMGx1ZEZva0xuYUJXeEI0NjFPaGlWOGZVditTYy96LzNWbCtTSFd5em8xL0RJZW1KWmgyUlcyWFRwaHhQMjByZ2V0Q2pLdkhRWTNPL2xqbjZSTEhhRHdmSitnVitaWlpGQU9vbEQxVlVXTHFDTnI4VHo1aDFPSTh6RHdQOEROWkFsYlZlMGNpeVlRR0tDcEp2TThjc0w1VERVWUl1V010VjlRZnFXRVNZRzNvOVJXS3pCYlEwT2ovbEFhS2YwWUtoRHZKMERSOFoyM01td2ZzMGh2dWVjK2M5Y2tieG5MUThVUnZ6ckNGV3dNVHlCajVqMFBYVlpoUXZTcWFvZzNsMHAyL00vaU0ybC9tc1BNemdPRW1ZVVp3cElLMHQwVDhiekhIYTFYcVhCQ2tIcDdXcDFpTEFIeExyaXNwaCtDZERwYXpId3FlS1hVVlJTSExLNnBRRFl6aGVodmZ6YW1xR05PZW91TG1SWEw4TXhBVzV3cHFvN1I1ZEJ5aHVGNWxrZVpKYkNMY1JNbytocWkxTXhwNDVPTjFFZ25ZK1kxcGZCcUtsSzZzaTZmazhpc0JpMWxIUUsrTlh0cFJON0RHbHMzTTNtRDB1cDJVczFCNHdDZ0ZHeEpkQnhWU3h6M1B2WVBYRWNiVlR5NGpCa2NqUXNiaXUwYUt6VUlNWGswTm5TMXM0R0c0SnpTQ29QdUlndmoyc0o1SkxTdzV3YWwzL3R5aHlWUWVub1lBNXgvcEN0anhnUTRVdGI4VDhZNlFNS0lLY3EzOXB0TXZpeW5HVFMwQWJUSGlwclErYVA4Yk9zZ3JabGc5RDM4UDQrVStnRGoxRForUDdqNllWVU53RUU3V1ErWEN2SWlXNmVYaHdHWGkwSVIvQ2RvYzV2cHRzUHQvWndET3RINVF1bWZhWU5pcTRpTE13NWdiMTJqdWlJb1lhY1ZJYTFJWk80OHR0ckxlejRET1QyTytYZ1c2UnY2K25GcjhDVElZSTBhRFhBTmdER25sakwwYkxaZWcrWHhDMWtGQ0c3OTdtUmNSVWdheHpuSHN6QitwZkRGSWV5SnF5WDlzZUo4VXFIOUdiZE5oaVozZUxnRUJIV1FrQVJuOVMvSGFvSmN2WEpDQWJJTUpWdXppV2pKT2E2eGNtUnRXNEJ6Syt6UVI3b3hteFJ1OUhjTFlCaGhGa2NRUGt2RFVadGl0eUdLc3BFc1hpR0psUC9WUVRtWkNjc3VJZjZXeFVkK2hPbG5adVJsYytoNk9FcjdndWYwb3MyVmY2VDhnQ0hKbkZqaWtwMk9OUVZza1BkdXpXZnc0NENVeGViMURwSWtnR2NJUWhVK3B2cmh3TkUwQU1MQ1NxSndVVGhHRjBiMHhoeGx6REtRVm80LzZNeVkvOFdZVm9SZWFncTA3WnBjSHg2aXFsMjNTektJYkZMc3laMFVxSFFBMmhiQ09qZkdiMHVVeXdzZUVSRFpPRGlnN2tIbUFmb1N4dE5iKzZiQjFSU3VUVFdSTXlITVlZbHcrYjhZdG9nZzhMTVFaZzdGSUYwUFJQNmErNlp2dFlselJMQUxVbTI3bHROaDM1Q1FTNjFHbG45LzhHRjEvSU53OENLYlFqdGxqTXJIaVRBQkUxZXBIalpVNVpSdDJ4SFVHR0NnanRVbFZ4NGI2MStwYkhjUlVzS1lFUVZFSWI3WUZvbEs2Y2dxWUFlSTdQV2c2ZFRJb1Y0cXJIOU83Q1Jsc0pTbEdNSE9jNFg4Z0RUWlN5U1BxZ3pwcnNZZlBjMFZmRk1tTjJNenoxV1dsM3hlbndNeUhiMXU5QTlCUk1KRms2VWc0KzZDemt6Y0o0NTRTSEk2QncvK1RYVXdISUlpMVdNaGM2Ri9mdS9wdTR1RWRYZlhpNy9iOTVNcnk2S3J1K3k2b3JsbDlUL09RKzI0eENnMDRxZkp5cW8rMVl2T0NRbms1dHZwT0J4TWcwenRqUEpkTjRrSXFFZjlVQzFReW9wemZ5eHlaTnl0Qnp1amFLWVF0ZVRhR21XSGQrWGRkMmZGbjJxY2dnQTM1b2RoODZnMis5YmtKVVNkck85WlZhWUk4V1VDaHNINEdMdkJEa0tzbGtkdUJrOHUrNlJYR2hOWEZXREZ6ZS9zSjJKd0c3QVFKeCtlYjJ1RVJaL2U4UUR6YUNlRTRkTEJyVk9kQzJleVUyNDZ3RnJDb0pPeXVZWGU3eUhMREtHVE1aTXdOa2YxUEprUFZTYkFKR1FXSHd2MStuNWN4TGdIWUdVVjBtY3lpcE43RnErL0VRWDBLUjc3NFlQbnE5MVZJWUNjWXpvVmVhSVBvTnZsUkk4Zll2bVRodjArUCtjVXNHWm02Tmw0OUFjKzVEQ2QxUnlrTmFTNUNWUkRIeXhrOFQyNXpFcXp3NGJ5OXVET1Y0SzFKWkJkRmxvQjl1S0dMMFloTWlXVkxvUVRFMXhacS83R1FscWRnWlBkOUVPZ2J1eVdVeFMyNWF1SFh4Qm11d2lPOGYvYlhQQkxvL0FiajJuMno1ZmNKZE5Mb1lRWDJnRzQybWRrTysycU5nckpBeEFQcFRVSXUybHdNdjVpSWlWZVFuS2ZuUklqQ0NaTEF2aEU2ZUhTZ2JwZjBDSWxsbmVEdk5IMUwwM2xpM3JtdFc3VVVkV2Niemc3Z3ZSSW96NVJyblI2RUEva2ZXVk1xUjNORzBvcUJSdEpsaU5xOTRXU3pyWExCRytGWHNuS1p6OC8vamx5cnB0UHp5SmpjK0FjdE40L0k0aEJMSWl0YlNmL0x1MkdhQ1A2bDlvQ0ZWcmF3U25sbWdtRm1GVUU5alh4dVdWQlhvak5McnZmZG5IK1FndnFSbDRWV0NlK2JWU1RLYjRSWExTOGdwbUs4TEk2U3huM1FDOGxxSENrOGkzemY2dUx2VW03dW1salA2cEUxSkVHVDl5QjVkdkVLc3d4S3FqRkFCZUU5dVhSclBPRWxWTHZOcDAzd3RNeC9NS01BZXVoRWd1M2xEb0sySnh5OHpHbDRYWlB0b3k5cmN1cnZmbXJ3c1M5U2dnSXNQU0ZoUEFycEMyb3RKQzdxQTBjNU5LQUxDN1h6cDVIbVRyc2NPZ0QwK21iZHNyMWF3endydmsxdjBSd2hoeVJ3bkwrcWowaS9HbjE4UHdnT3J5bzQvV1E0K08wMERVM25NbWFOOHVscGlmQjcxUjFDS0ZiQzU4MkdnZ0ZHMlVYRzlWTDY4YmZkS0pjUXB6N2lTZWhiVVUwanVqU3o1NUl1R09wK2hkckJ2RXQxOUNMY1lYK0dGTjNOVEZ2MWFudWZ0VzRFT25ZejlaNTQzdm9Oc3EwdncrYm9IL0hXcVhYdmROQTJkb0JWVmlhWXhZSW9ma0tnblo2emJ5d3BEWDYxUnVKUHhEMFhiUDZHYUowcFlVdXVCUzlkbGs2UEtiTC9FS2F4dW5PUmN3cWx3aWhOMDJDTVB4ME1yM3VMdDV5U05iTGhZT1o4Z2RZNFZwYUs1TXpRZ21JS3g5aEszbFF5OHdEMmR4WFFQNkpTWTUrUFpnNDQrQmVqdDFsNFFPOUFWdW9Ba2pNMXF6RHljOXRqbUZDdGwwREM0RFlRNktXNlFtZjJQR1FRQmd0aHh4MEVkNm9JRlF2UUJIQ1h1OEl2MlBIQS9LaDJmVTlWOWhDangvYkhZUVJjT2ZIbEFGMndSUjNCbDZEQzd3RzFYdjdkdWZzc0wwa0F5MFlhTjlvMjREYTFnV0EzQm05VnZJU1hVS3FBc0JyTFY4L2dmSnlvaUNyZlF0VHpJbGJQbkw1aStLR1JwU3VtVFdPWnFGdk90Ujl2c0hLNWE5aDhXc1Urc3N2bU9jbW4reEVncHcwTFM1S2lMeVUvME5maGFqd1U2blUybEtmbmNSM0VKdTR4NjhjbE1TTkNtR01JVEhyWmpQZ3JjZ3NWWisxSm5ZUVRqcnVUbE9xVHVVc2ZmekNNRktnMUNzMVo0eDVKL1FTM1NLOVpxN2R1N011dXZxbFcxNXNOOWEwUk5LMmIvMEpmb2syUkgwME5oZXNwK2VOZ05PUzljRnBVejIyZk9GUkcyK29WVzY5cUU0a04xazAxT1hKMThzWWFDeERRVHpaVkdBRmNrQVFDNyt1UlJ5b0RETURTQ0VNYmpXMXJzUno5UDczdnhLNUhTYk5SQTY5d2ZjdjlhclVMbDl6M282eFJlb1I0c080dHRNY3gya215V29mWE9sT2dYN2huQTE0SFNkdUk4WTJTMkRXL3hMUWp4YUNFMTZCN2ZZOUowZS9veFJLNUFNMlNoSHUwK1Nqc2pDYzQyTGZJVVVJRVVWQUhHaGc5bXJ1aFlvODU0b2krRWFCa3RIVUhoNDVXcENtQ2UwQ2Nacjl2cjNqNmVSYzgvdy9ySG0yVTZ3L3dTMU9hRHFLNTZhZUxTN09xUHBQcXdreG40RmJoY3k4RHF6aTJVMDc4RUc4MHNVR1dUMnlEcERLaDF0QWZCZWZrS1VMeml0V2dPWng1YWtDN2Vpb1VjK25RZVgwZ3FPUlAzbWhEMzJPbXp2b2RURXJNblk5MEFCSkpnS3hZSyt5TUNpZ1duYXhlOFBiNnhkQ0p3bjNJZDAyVEEwV1I4OVlqd2xpaFd0ODlGNzdVYlpKNFplMjJoeXZ5REtOV2RpYXlqS2pjbis5MGY1Ly9LYm0xWlAzTG1PYWtwU0ZkckJjSUdhbHlEWXROQ09QakozRFN2bXlTWTN2Rk5PU1VJdVh1OE5EbXJ4RkdXd290TU5DaEVrMk8yZWQwaUo0UjhXVmdJZW4xRWdMUi9kemx1ZUVITzVOTmlrV0NSejFwcTBtWSt3TFJyRTFkZXBnb2RmTVJHZ0ppa1FCdXhUWUdLL3MxMEtmTnUycGN0cnBEclR0OUs0cmtNN1RRblVYWVNjTzdqMmJBbWJvYzhuV3lHdFhjaGlvZmtJQ2YzRWNrb2ZIOXVKck9wNW5pRk1La1lMamFFbHlBR0lsYlp5K3lWRnFPU1NzSlZQWmNWN205Zkd2blNoTEhJdW1ibTZsNU93NW1IUW9Zd0xtaHRndWF6SitCYTZGQUFKS0hhRmloZnhLTG4vNUROclYycmFKN0tnZ1NYcmlLSHpqRGg4cEFXRUtkbkhYS3IvUDYrV1VXNktWcDlpYUxQOFJmNmFSbHg1d3RuMjV3Ti9KWFBueENVdmVCRUNzK2R6V0ZnMGc2VUY1S3hQNHRIa05NMldtUHlQRzJpZFB2N3RIUlpwcHhoMit4bEplTEZHOE10Q1IxdmFlTkFNWVdYb0RvczZrVGN5MlN1bDVTRStOWThsQmtMenIybW9jaE05ZHN4WC9wVU5GcURLZ0pCVjVvbEdYUzF5M0h2Z1dVemZZRDM5Y3JWVDk1NFhITDB2RDZ1YTFnSGNVKytxTGVrYkdlT08zMEhlZGE1ZEVTNkVtRGhETXcvRy8zcVFGQXVncXVDWG1rZDdlSitxejJxUEQ2bkRINEc0OXB6anRjeEhwcGFORkM5ZHJ3Z1JkS3lVREgwcGtUcTFjeTFOSDhjLzVUSTkvbUlFK1hTQU84WmIvUTN4ZHF0WjI2OHBLc0pOcmxubVNhQ3gxK1M2bStmaG5vOUhVc0xOd2hiTlRsaGZINXNmaS9YMWYzakFqbWsrdzVsbXZ2Sm1WZ0s2VllnNGdEa2JUaHIwUEExajlMMDVJeVA5Rml0MUhnSlo4eEtEbEo0REczZnhrb0RaVjhxUnpvM0ZDamE3cDlHY1p0YlN4aXZ0eXpMcXg4czcwSnF5cS9tOWxYQUZPa2RMZytWSXNxQ0tBeFd6YzVyUGZ0aGdscE1icnBqTTkzTmNoWDJseEVmU1lrOEJDTWd4TE0ybzRid0RncVJyVHhyM20zeGlYdHdkaGl1TjNBT3JnVkgyaHNpWENhSmtOWkd1OFlGcUs0WEwwY2ZmUGoxWTNrSm9qRlZVT2FaWnZRaTBPeHNpRTFVcDFNajdHRnBjS3FhUVhWMDBTZklBK3Y5ajlyVkFMUHlxaHR5TStxMUllS0lHaUljTXBPVmQyT01PNUppZnVRQXdWQ0p1dk9iYnFtc3k4ZzR6YUdEUDQ3YmhnUVB2cDFJTEQrTTZMTk41MU1pNmJ6NUZRT2JBaVZ1QzBmZmFaMWw4elVleHY2bFZVSHVjU2R1M0RtQkU0enBmbXJEb1haL1RhQStyMnJLZmJ3PT08L3hlbmM6Q2lwaGVyVmFsdWU+CiAgIDwveGVuYzpDaXBoZXJEYXRhPgo8L3hlbmM6RW5jcnlwdGVkRGF0YT48L3NhbWw6RW5jcnlwdGVkQXNzZXJ0aW9uPjwvc2FtbHA6UmVzcG9uc2U+';

const spPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
                      MIICXQIBAAKBgQDG2Op1YfRo7ZciJuisUPKftnThPsFk0auioP+PNaL2q5iVsltd
                      C4GYq31Lyqy6iuTnSffrLzpdvyaJBfHJDkJkf1VrbsHG+hLxHyDIC8EBmWCiD63R
                      jeegXGNPmqa6fEiDH7K7Ufja1qdECSEXOmlneVlkMmyjcBXhs9liFs0F0QIDAQAB
                      AoGALb+eQZ9lwfZXvS3CflKpX4F05pWvnOh4WpQ799DZS3MzSc2dI40QJfXef9+D
                      We+2tlfYSC23efYOgZvygtVbBKfpj4ea3wyWJItRJRefipvad8suR8lPHurOJ9kN
                      zLEbUoEqQOaI3yy0H16J4MnbC2ffZgx1Yg5UxfaMzEJ/ebkCQQD2EWA/7rmdKcJU
                      5Ot3okytar0ov+UWTlz5hPXf1ul5Z5iLU6GT/kfRJV9kwN75hV7fqi1k8CO5hSoH
                      MDlSkuBTAkEAzt+b67gUVVF6joJZUptKRhjxijnnCoOhAZkiswH5kv2mfO2vEg9C
                      R5CycVoEX0A9HakjHDUuUtqrmOtCYcHMywJBALeyHxV7RQwD6bRwtSw5eF6Z6Z7r
                      Kr1tQNFxphA1o1RjtyiEBYKy+LA04zMXHR5Pp5T3uS26bCEKPWbiZFi1l0sCQQC5
                      SEr1BuynMY+r3ZE0zELsn2COJagJobTtooMSgr1N6oJXt+WqLiJ1yGIZ5b6utPFI
                      BHmexP7VVGaGUock2RebAkBAwdjk8QTnAUQNO/3jgV+D/+w8C1j3KWq5OvUBihdk
                      JYsCGAGZJwfckqDk8zQZ7v4gxEvG9LS+1DUsX8Rb24Of
                      -----END RSA PRIVATE KEY-----`;

describe('Acceptance | Controller | saml-controller', () => {

  before(() => {
    process.env.SAML_SP_CONFIG = JSON.stringify(
      {
        metadata: spMetadata,
        encPrivateKey: spPrivateKey,
      }
    );
    process.env.SAML_IDP_CONFIG = JSON.stringify(
      {
        metadata: idpMetadata,
        isAssertionEncrypted: true,
        messageSigningOrder: 'encrypt-then-sign',
      }
    );
  });

  after(() => {
    delete process.env.SAML_SP_CONFIG;
    delete process.env.SAML_IDP_CONFIG;
  });

  describe('GET /api/saml/metadata.xml', () => {

    const options = {
      method: 'GET',
      url: '/api/saml/metadata.xml',
    };

    it('should return SAML Service Provider metadata', () => {
      // when
      const promise = server.inject(options);

      // then
      return promise.then((response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.equal(spMetadata);
        expect(response.headers['content-type']).to.equal('application/xml');
      });
    });
  });

  describe('GET /api/saml/login', () => {

    const options = {
      method: 'GET',
      url: '/api/saml/login',
    };

    it('should redirect to IDP when login requested', () => {
      // when
      const promise = server.inject(options);

      // then
      return promise.then((response) => {
        expect(response.statusCode).to.equal(302);
        expect(response.headers['location']).to.have.string('https://pixpoc.samlidp.io/saml2/idp/SSOService.php?SAMLRequest=');
      });
    });
  });

  describe('POST /api/saml/assert', () => {

    // Since we are using a pre-recorded SAML response for this test,
    // the easy test is to check that it is correctly recognized as
    // no longer valid.
    it('should consume expired SAML assertion', () => {
      // when
      const promise = server.inject({
        method: 'POST',
        url: '/api/saml/assert',
        payload: {
          SAMLResponse: expiredSamlResponse
        }
      });

      // then
      return promise.then((response) => {
        expect(response.statusCode).to.equal(400);
        expect(response.result).to.equal('ERR_EXPIRED_SESSION');
      });
    });
  });
});
