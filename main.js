// TOOD create a new list element when a tab is created + remove when removed
function handleTabChangedMessage(request, sender, response) {
  console.debug("Got request: " + JSON.stringify(request));

  if (request.message == "tab-removed") {
    // find tab with ID
    const { tabId } = request;
    const elementQuery = document.querySelector(`[data-tabid="${tabId}"]`);
    if (elementQuery) {
      onCloseTabClick(tabId, elementQuery[0]);
    }
  } else if (request.message == "tab-added") {
  }
}

function createTabListItem(tab) {
  const { title, url, id } = tab;

  const tabListElement = document.createElement("li");
  tabListElement.dataset.tabid = id;

  addTabListInfoElements(title, url, tabListElement);
  addActionButtons(id, tabListElement);

  if (!tab.discarded) {
    tabListElement.appendChild(createTabActionButton(title, id, "unload"));
  } else {
    tabListElement.appendChild(createTabActionButton(title, id, "reload"));
  }

  return tabListElement;
}

function formatClipboardContent(tabArr) {
  let fmtString = String();

  for (const tabElement of tabArr) {
    fmtString += `${tabElement.title} : ${tabElement.url}\n`;
  }

  return fmtString;
}

function setClipboardContent(content) {
  navigator.clipboard.writeText(content).then(
    function () {
      console.info(`Copied content to clipboard.`);
    },
    function (err) {
      console.error(`Got error: ${err} attempting to copy URLs.`);
    }
  );
}

function isTabActive(id, callback) {
  browser.windows
    .getCurrent({ populate: true })
    .then((windowInfo) => {
      const activeTab = windowInfo.tabs.find((tab) => tab.active);
      callback(activeTab && activeTab.id === id);
    })
    .catch((error) => {
      console.error(`Error checking active tab: ${error}`);
      callback(false);
    });
}

// restore all elements to the DOM
function clearElements(tabListElements) {
  tabListElements.forEach((element) => {
    if (element.classList.contains("hidden")) {
      element.classList.remove("hidden");
    }
  });
}

function addTabListInfoElements(title, url, tabListElement) {
  const titleSpan = document.createElement("span");
  titleSpan.textContent = `Title: ${title} `;
  titleSpan.classList.add("tab-title");

  // click on link element saves just the url from the link
  const urlAnchor = document.createElement("a");
  urlAnchor.style.display = "block";
  urlAnchor.style.paddingTop = "2.5%";

  urlAnchor.textContent = `URL: ${url}`;
  urlAnchor.classList.add("tab-url");

  urlAnchor.setAttribute("href", url);

  urlAnchor.addEventListener("click", function (e) {
    e.preventDefault();
    setClipboardContent(url);
  });

  tabListElement.appendChild(titleSpan);
  tabListElement.appendChild(urlAnchor);
}

function addActionButtons(id, tabListElement) {
  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.classList.add("close-button");
  closeButton.addEventListener("click", function () {
    onCloseTabClick(id, tabListElement);
  });

  const activeButton = document.createElement("button");
  activeButton.textContent = "Go to Tab";
  activeButton.classList.add("active-button");
  activeButton.addEventListener("click", function () {
    onActiveTabClick(id);
  });

  tabListElement.appendChild(closeButton);
  tabListElement.appendChild(activeButton);
}

// change the appearance of the "action button" via the appropriate CSS classes
function toggleActionButtonAppearance(btn) {
  if (btn.dataset.action === "unload") {
    if (btn.classList.contains("restore-btn")) {
      btn.classList.remove("restore-btn");
    }

    btn.classList.add("discard-btn");
    btn.innerText = `Discard tab`;
    btn.dataset.action = "unload";
  } else if (btn.dataset.action === "reload") {
    if (btn.classList.contains("discard-btn")) {
      btn.classList.remove("discard-btn");
    }

    btn.classList.add("restore-btn");
    btn.innerText = `Reload tab`;
    btn.dataset.action = "reload";
  }
}

// where actionType = "unload" | "reload"
function createTabActionButton(title, id, actionType) {
  // just to ensure callers dont make a mess
  if (!(actionType === "unload" || actionType === "reload")) {
    throw new Error(
      `Action type must be either 'unload' or 'reload' got action type of ${actionType}`
    );
  }

  const btn = document.createElement("button");
  btn.classList.add("tab-action-btn");
  btn.dataset.action = actionType;

  // init class setting
  toggleActionButtonAppearance(btn);

  btn.addEventListener("click", function () {
    console.debug(`dataset.action = ${btn.dataset.action}`);

    if (btn.dataset.action === "unload") {
      isTabActive(id, function (isActive) {
        // TODO we'll just ignore for the currently active tab, for now.
        // the 'success' callback is invoked but currently accessed tab will not be discarded
        if (isActive) {
          console.debug(`Tab id: ${id} is active tab; not discarding`);
          return;
        } else {
          console.debug(
            `Tab is not active - discarding tab with tab id ${id}; title '${title}'`
          );

          browser.tabs.discard(id).then(
            function () {
              // this is called even when the tab is the current/focused tab
              console.debug(`Discarded tab id: ${id} successfully`);
              // unload becomes reload
              btn.dataset.action = "reload";
              toggleActionButtonAppearance(btn);
            },
            function (error) {
              console.error(
                `Error discarding tab with tab id: ${id} error: ${error}`
              );
            }
          );
        }
      });
    } else if (btn.dataset.action === "reload") {
      console.debug(`Reloading tab with tab id ${id}; title '${title}'`);

      browser.tabs.reload(id).then(
        function () {
          console.debug(`Reloaded tab id: ${id} successfully`);
          btn.dataset.action = "unload";
          toggleActionButtonAppearance(btn);
        },
        function (error) {
          console.error(
            `Error reloading tab with tab id: ${id} error: ${error}`
          );
        }
      );
    }
  });

  return btn;
}

// @param id - the tabID
// @param li - the list element to remove
function onCloseTabClick(id, li) {
  function onRemoved() {
    console.debug(`Removed tab with id: ${id}`);
    li.remove();
  }

  function onError(error) {
    console.error(`Error removing tab with id ${id}; error: ${error}`);
  }

  // close the tab and remove the parent element
  browser.tabs.remove(id).then(onRemoved, onError);
}

// TODO: keep in mind this wont change the state of a button for this tab if that tab was discarded
function onActiveTabClick(id) {
  function onActive() {
    console.debug(`Made tab with id: ${id} active`);
  }
  function onError(error) {
    console.error(`Error making tab with id: ${id} active; error: ${error}`);
  }
  browser.tabs.update(id, { active: true }).then(onActive, onError);
}

document.addEventListener("DOMContentLoaded", function () {
  browser.runtime.onMessage.addListener(handleTabChangedMessage);

  const tabList = document.getElementById("tab-list");
  const copyBtn = document.getElementById("copy-urls-btn");
  const tabCountHeader = document.getElementById("tab-count-header");

  // collect attributes associated with each tab
  const tabContentArr = Array();
  // retain refs for each created `li` element for each tab
  const tabListElements = Array();

  browser.tabs.query({ currentWindow: true }, function (tabs) {
    const nTabs = tabs.length;
    tabCountHeader.innerText += ` ${nTabs}`;
    copyBtn.innerText = `Copy ${nTabs} titles and URLs`;

    tabs.forEach(function (tab) {
      const { title, url, id } = tab;
      tabContentArr.push({
        title,
        url,
      });

      const tabListElement = createTabListItem(tab, tabList);
      tabList.appendChild(tabListElement);
      tabListElements.push(tabListElement);
    });
  });

  const searchElement = document.getElementById("search");
  let nSearchMatches = 0;

  // certainly, this is far too slow
  searchElement.addEventListener("input", function (event) {
    const searchStr = event.target.value.toLowerCase();

    // restore all elements on each input change....
    clearElements(tabListElements);
    nSearchMatches = 0;

    const elementResults = tabListElements.map((element) => {
      const m = {
        element: element,
        titleStr: "",
        urlStr: "",
      };

      for (const childElement of element.children) {
        if (childElement.classList.contains("tab-title")) {
          m.titleStr = childElement.innerText.toLowerCase();
        }

        if (childElement.classList.contains("tab-url")) {
          m.urlStr = childElement.innerText.toLowerCase();
        }
      }

      return m;
    });

    elementResults.forEach((element) => {
      const hasSearch =
        element.titleStr.includes(searchStr) ||
        element.urlStr.includes(searchStr);

      if (!hasSearch) {
        element.element.classList.add("hidden");
      } else {
        nSearchMatches++;
      }
    });
  });

  copyBtn.addEventListener("click", function () {
    const clipboardContent = formatClipboardContent(tabContentArr);
    setClipboardContent(clipboardContent);
  });
});
