browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  browser.runtime
    .sendMessage({ msg: "tab-removed", tabId: tabId })
    .then(() =>
      console.debug(
        `Tab Removed event sent successfully for tabID ${tabId} remove info: ${JSON.stringify(
          removeInfo
        )}`
      )
    )
    .catch((error) =>
      console.error(
        `Failure attempting to send remove event for tabID ${tabId}; error: ${error}`
      )
    );
});

browser.tabs.onCreated.addListener((tabObject) => {
  browser.runtime
    .sendMessage({ msg: "tab-added", tabId: tabObject })
    .then(() =>
      console.debug(
        `Tab Added event sent successfully for tabID ${JSON.stringify(
          tabObject
        )}`
      )
    )
    .catch((error) =>
      console.error(
        `Failure attempting to send added event for tabID ${JSON.stringify(
          tabObject
        )}; error: ${error}`
      )
    );
});
