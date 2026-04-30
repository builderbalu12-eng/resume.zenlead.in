// Store page data for popup to access
let pageData: {
  pageHTML: string;
  pageURL: string;
} | null = null;

// Log when extension is installed and configure side panel behaviour
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Background] LandYourJob extension installed");
  // Make clicking the extension icon open/close the side panel automatically
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    console.warn("[Background] Could not set panel behaviour (Chrome 114+ required)");
  });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveAuthCredentials") {
    console.log(
      "[Background] Saving auth credentials to chrome.storage.sync:",
      { userId: request.userId }
    );

    try {
      chrome.storage.sync.set(
        {
          'resumematch_auth_token': request.authToken,
          'resumematch_user_id': request.userId,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "[Background] Error saving auth credentials:",
              chrome.runtime.lastError.message
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError?.message,
            });
          } else {
            console.log("[Background] ✓ Auth credentials saved to chrome.storage.sync");

            // Verify the save was successful
            chrome.storage.sync.get(
              ['resumematch_auth_token', 'resumematch_user_id'],
              (result) => {
                if (result['resumematch_auth_token'] && result['resumematch_user_id']) {
                  console.log(
                    "[Background] ✓ Verification: auth credentials are now in chrome.storage.sync"
                  );
                } else {
                  console.warn(
                    "[Background] ⚠️ WARNING: auth credentials were not saved!"
                  );
                }
              }
            );

            sendResponse({ success: true });
          }
        }
      );
    } catch (e) {
      console.error("[Background] Exception saving auth credentials:", e);
      sendResponse({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return true;
  } else if (request.action === "clearAuthCredentials") {
    console.log("[Background] Clearing auth credentials from chrome.storage.sync (user logged out)");

    try {
      chrome.storage.sync.remove(
        [
          'resumematch_auth_token',
          'resumematch_user_id',
          'resumematch_master_resume' // Also remove cached resume
        ],
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "[Background] Error clearing auth credentials:",
              chrome.runtime.lastError.message
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError?.message,
            });
          } else {
            console.log("[Background] ✓ All auth credentials and resume cleared from chrome.storage.sync");

            // Verify the clear was successful
            chrome.storage.sync.get(
              ['resumematch_auth_token', 'resumematch_user_id', 'resumematch_master_resume'],
              (result) => {
                if (!result['resumematch_auth_token'] && !result['resumematch_user_id']) {
                  console.log("[Background] ✓ Verification: auth credentials successfully removed");
                } else {
                  console.warn("[Background] ⚠️ WARNING: Some credentials were not properly cleared!");
                }
              }
            );

            sendResponse({ success: true });
          }
        }
      );
    } catch (e) {
      console.error("[Background] Exception clearing auth credentials:", e);
      sendResponse({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return true;
  } else if (request.action === "resumeUpdated") {
    console.log(
      "[Background] Resume update notification received from web app:",
      request.resume?.contact?.name,
    );

    // Save the resume to chrome.storage.sync so extension UI can access it
    if (request.resume) {
      try {
        const resumeJson = JSON.stringify(request.resume);
        const resumeSize = new Blob([resumeJson]).size;

        console.log(
          "[Background] Saving updated resume to chrome.storage.sync:",
          request.resume.contact?.name,
          `(${(resumeSize / 1024).toFixed(2)}KB)`,
        );

        chrome.storage.sync.set(
          { resumematch_master_resume: resumeJson },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "[Background] Error saving resume to chrome.storage.sync:",
                chrome.runtime.lastError.message,
              );
            } else {
              console.log("[Background] ✓ Resume saved to chrome.storage.sync");

              // Verify the save was successful
              chrome.storage.sync.get(
                ["resumematch_master_resume"],
                (result) => {
                  if (result.resumematch_master_resume) {
                    try {
                      const saved = JSON.parse(
                        result.resumematch_master_resume,
                      );
                      console.log(
                        "[Background] ✓ Verification: chrome.storage.sync now contains resume for:",
                        saved.contact?.name,
                      );
                    } catch (e) {
                      console.warn(
                        "[Background] Could not verify saved data:",
                        e,
                      );
                    }
                  } else {
                    console.warn(
                      "[Background] ⚠️ WARNING: Resume was not found after saving to chrome.storage.sync!",
                    );
                  }
                },
              );

              // Notify any open extension UI (popup) to refresh
              try {
                chrome.runtime.sendMessage({ action: "resumeUpdated" }, () => {
                  if (chrome.runtime.lastError) {
                    console.log(
                      "[Background] Popup not currently listening (this is OK, data is in storage):",
                      chrome.runtime.lastError.message,
                    );
                  } else {
                    console.log(
                      "[Background] ✓ Popup notified of resume update",
                    );
                  }
                });
              } catch (e) {
                console.log(
                  "[Background] Could not notify popup (OK if not open):",
                  e,
                );
              }
            }
          },
        );
      } catch (e) {
        console.error("[Background] Error processing resume update:", e);
      }
    } else {
      console.warn(
        "[Background] Resume update received but no resume data provided",
      );
    }

    sendResponse({ success: true });
    return true;
  } else if (request.action === "saveSettings") {
    console.log(
      "[Background] Saving settings to chrome.storage.sync:",
      request.settings,
    );
    try {
      chrome.storage.sync.set(
        {
          resumematch_settings: JSON.stringify(request.settings),
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "[Background] Error saving settings:",
              chrome.runtime.lastError,
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError?.message,
            });
          } else {
            console.log("[Background] ✓ Settings saved to chrome.storage.sync");
            sendResponse({ success: true });
          }
        },
      );
    } catch (e) {
      console.error("[Background] Exception saving settings:", e);
      sendResponse({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return true;
  } else if (request.action === "analyzeJob") {
    console.log("[Background] Received analyzeJob from content script", {
      htmlLength: request.pageHTML?.length,
      url: request.pageURL,
    });

    // Store page data from content script
    pageData = {
      pageHTML: request.pageHTML,
      pageURL: request.pageURL,
    };

    sendResponse({ success: true });

    // Notify the sidebar (if it is open) that fresh page data is available.
    // We cannot call sidePanel.open() here because Chrome 116+ requires it to be
    // triggered by a direct user gesture — a background message handler doesn't qualify.
    // The user opens the panel by clicking the extension icon (handled by setPanelBehavior).
    console.log("[Background] Broadcasting pageDataReady to sidebar...");
    chrome.runtime.sendMessage({ action: "pageDataReady", pageData }).catch(() => {
      // Sidebar is not open yet — that's fine, it will fetch the data via getPageData on init.
    });
  } else if (request.action === "getPageData") {
    console.log(
      "[Background] Popup requesting page data:",
      pageData ? `Available (${pageData.pageHTML.length} chars)` : "None",
    );
    // Popup requesting stored page data
    sendResponse({ pageData });
  } else if (request.action === "clearPageData") {
    console.log("[Background] Clearing page data");
    pageData = null;
    sendResponse({ success: true });
  } else if (request.action === "downloadResume") {
    const { url, filename } = request;
    console.log("[Background] Downloading:", filename);
    chrome.downloads.download({
      url,
      filename,
      saveAs: false,
    });
    sendResponse({ success: true });
  }

  return true; // Keep channel open for async responses
});
