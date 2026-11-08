chrome.runtime.onInstalled.addListener(() => {
    // Automatically enable the extension for all users
    chrome.management.setEnabled(chrome.runtime.id, true);
});