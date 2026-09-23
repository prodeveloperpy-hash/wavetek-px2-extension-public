# Wavetek PX2 Browser Extension
## Proof of Concept and Remote Testing Proposal

**Prepared for:** Ash / Client Team  
**Prepared by:** Development Team  
**Document version:** 1.0  
**Date:** 23 September 2026

---

## 1. Executive Summary

This proposal describes the development and testing approach for a Chrome/Edge browser extension that will provide a Wavetek user interface for interacting with the PX2 device.

The PX2 already includes a browser-based WebUI. The proposed extension will not modify the PX2 hardware or firmware. It will communicate with the PX2 over the existing Ethernet connection and reproduce the approved requests currently used by the PX2 WebUI.

The work will begin with a focused Proof of Concept (POC). The POC will confirm that the extension can connect to the PX2, authenticate, read one basic setting, change one approved non-critical setting, and verify that the device accepted the change. Once this is proven, the solution can be expanded into the complete Wavetek interface.

## 2. Project Objective

The objective is to provide users with a Wavetek-branded Chrome/Edge extension through which supported PX2 settings can be viewed and updated.

The intended communication flow is:

> **Wavetek Chrome/Edge Extension → Ethernet Network → PX2 Device**

The extension will act as the user-facing layer. The PX2 will remain responsible for applying and storing its settings.

## 3. Understanding of the PX2 WebUI

The PX2 WebUI is not a separate public website or desktop application. It is a web interface hosted inside the physical PX2 device. A computer connected to the same Ethernet/local network opens it using the PX2 local IP address.

Because this interface is normally available only inside the PX2 network, real integration cannot be fully tested from a remote development computer without secure access to the London test network or a computer connected to the device.

The PX2 operating manual explains the device and its WebUI features, but it does not provide the complete internal HTTP contract required by the extension. Therefore, the login and setting-change requests must first be inspected on the real device.

## 4. Current Development Status

An initial Manifest V3 Chrome/Edge extension shell has been prepared. It includes:

- A Wavetek-style POC interface
- Mock mode for demonstrating the user flow without hardware
- Configurable PX2 address and endpoint fields
- Basic, form/session, and existing-session authentication options
- Connection testing
- A generic read-setting and update-setting workflow
- Permission, HTTP, timeout, and connection-error feedback
- Local configuration storage without password persistence

The existing endpoint values are placeholders. Real-device discovery is required before the extension can be considered integrated with the PX2.

## 5. POC Scope

The POC is intended to answer one technical question: **Can a Chrome/Edge extension safely and reliably communicate with the PX2 and change an approved setting over Ethernet?**

The POC will include:

1. Confirmation that the PX2 WebUI is reachable.
2. Identification of the authentication method.
3. Inspection of the requests used by the existing WebUI.
4. Extension-based authentication with the PX2.
5. Reading one agreed basic setting, where supported.
6. Changing one agreed safe/non-critical setting.
7. Verification of the new value in the original PX2 WebUI.
8. Clear reporting of connection and device errors.
9. Testing in Chrome and Microsoft Edge.
10. Documentation of the findings and remaining work.

The full Wavetek settings interface is outside the initial POC. It will be planned after the POC confirms the integration method.

## 6. Recommended One-Time Remote Test Setup

To avoid requiring the client team to assist during every development test, we recommend a one-time secure remote-access setup using a dedicated Windows test computer in London.

The proposed setup is:

> **Development Computer → Private VPN → London Test Computer → Ethernet → PX2**

Recommended components:

- **Tailscale or an approved company VPN:** Provides private access without exposing the PX2 publicly.
- **Dedicated London test computer:** Remains connected to both the internet and the PX2 network.
- **AnyDesk, TeamViewer, or Chrome Remote Desktop (optional backup):** Allows supervised troubleshooting when direct VPN access is insufficient.

The client only needs to complete the initial setup and keep the agreed test environment available during the POC period. Once configured correctly, the development team should be able to inspect, develop, and repeat tests without requesting the same manual assistance each time.

## 7. Client-Side One-Time Requirements

The client team will be requested to:

1. Provide a Windows computer dedicated or temporarily allocated to PX2 testing.
2. Connect that computer to the PX2 through Ethernet.
3. Confirm that the original PX2 WebUI opens successfully in Chrome or Edge.
4. Ensure that the computer also has a stable internet connection.
5. Install and authorize the agreed private VPN/remote-access solution.
6. Keep the computer powered on and prevent sleep during agreed testing windows.
7. Provide dedicated test credentials for the PX2, where possible.
8. Confirm the PX2 model and firmware version.
9. Identify one non-critical setting that may safely be changed during the POC.
10. Confirm any company security or access policies that must be followed.

## 8. Development and Testing Method

### Phase 1 — Environment verification

- Verify remote access to the London test computer.
- Confirm that the PX2 WebUI is reachable from the test computer.
- Record the device IP, firmware version, browser version, and network arrangement.
- Confirm that the approved test setting can be changed manually through the original WebUI.

### Phase 2 — Request discovery

- Open the browser Developer Tools Network panel.
- Inspect the WebUI login/authentication sequence.
- Inspect the request used to read the approved setting.
- Inspect the request used to save the approved setting.
- Identify request methods, paths, headers, cookies, content types, payloads, redirects, responses, and any CSRF tokens.
- Record whether the interface uses HTTP Basic authentication, form sessions, a challenge/response mechanism, or another method.

### Phase 3 — Extension integration

- Replace the placeholder endpoints with the discovered PX2 requests.
- Implement the confirmed authentication flow.
- Map the approved setting between the Wavetek UI and PX2 request format.
- Add any required token/session handling.
- Preserve user-friendly error feedback.
- Ensure credentials and captured session data are not committed to source control.

### Phase 4 — POC validation

- Load the unpacked extension into Chrome.
- Test access permission and device connectivity.
- Authenticate through the extension.
- Read the approved setting.
- Update the setting through the extension.
- Reopen or refresh the original PX2 WebUI and confirm the new value.
- Repeat the test in Microsoft Edge.
- Document results, limitations, and browser/device-specific behavior.

### Phase 5 — POC handover

- Provide the updated extension source code.
- Provide installation and test instructions.
- Provide a short technical note describing authentication and discovered endpoints.
- Provide a demonstration or test record.
- Agree on scope and estimates for the complete Wavetek interface.

## 9. POC Deliverables

The expected POC deliverables are:

- Chrome/Edge Manifest V3 extension source code
- Wavetek-branded POC interface
- Working PX2 connection and authentication flow
- One working setting-read flow, where available
- One verified safe setting-change flow
- Connection and error-status feedback
- Setup and installation instructions
- Technical integration notes
- POC test results and identified limitations

## 10. POC Success Criteria

The POC will be considered successful when:

1. The extension can reach the PX2 through the approved network setup.
2. The extension can authenticate using the confirmed PX2 method.
3. One approved setting can be read or its current state can be obtained.
4. One approved setting can be changed through the extension.
5. The setting change is confirmed in the original PX2 WebUI or directly on the device.
6. Connection, authentication, and request failures are presented clearly.
7. The same basic workflow is verified in both Chrome and Edge.

## 11. Security Approach

- The PX2 administration interface should not be exposed directly to the public internet.
- Remote connectivity should use Tailscale, a company VPN, or another approved private-access method.
- Access should be limited to authorized accounts and devices.
- Dedicated test credentials should be used where supported.
- Passwords, cookies, tokens, HAR files, and credentials must not be committed to GitHub.
- Credentials entered in the current POC are not persisted by the extension.
- Remote access can be supervised and revoked immediately after the project or testing period.
- Production security requirements will be reviewed separately before full deployment.

## 12. Assumptions and Dependencies

The proposal assumes that:

- A functioning PX2 device is available in London.
- A computer can connect to the PX2 through Ethernet.
- The existing WebUI can be opened and used with valid credentials.
- The client authorizes inspection of WebUI network requests for integration purposes.
- At least one safe setting is available for repeated testing.
- The device firmware permits browser-based configuration from the connected computer.
- The client can provide the one-time network/remote-access setup.

Any proprietary encryption, undocumented challenge mechanism, browser incompatibility, firmware restriction, or company network policy may require additional investigation.

## 13. Items Outside the Initial POC

Unless separately agreed, the POC does not include:

- Complete implementation of every PX2 setting
- PX2 firmware or hardware modification
- Public internet exposure of the PX2
- Production deployment or managed extension-store publishing
- Enterprise authentication/identity integration
- Multi-device fleet management
- Long-term monitoring, support, or maintenance
- Final production UI/UX for every workflow

## 14. Work After a Successful POC

Once the POC succeeds, the next phase can include:

1. Confirming the complete list of settings required in Wavetek.
2. Mapping each Wavetek control to the relevant PX2 request.
3. Developing the full interface and validation rules.
4. Adding secure credential/session management appropriate for production.
5. Supporting connection status, error recovery, and device compatibility.
6. Conducting complete Chrome/Edge and firmware-version testing.
7. Preparing deployment, packaging, user documentation, and release procedures.

The effort and schedule for this phase will be estimated after the POC reveals the PX2 authentication method and request structure.

## 15. Proposed Next Steps

1. Client confirms acceptance of the POC approach.
2. Client identifies the London PX2 and dedicated test computer.
3. Both parties agree on a secure remote-access method.
4. Client completes the one-time connection and authorization setup.
5. Development team verifies access and begins request discovery.
6. POC integration and validation are completed.
7. Results are reviewed and the full Wavetek implementation is scoped.

## 16. Approval Requested

Please confirm:

- Whether a PX2-connected Windows test computer can be provided.
- Whether a private VPN such as Tailscale is acceptable under your security policy.
- Whether optional remote desktop access may be used for troubleshooting.
- Which PX2 setting is approved for the POC change test.
- Who will provide the device credentials and initial setup assistance.
- A suitable date and time for the one-time setup session.

---

**End of proposal**
