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

// restore all elements to the DOM
function clearElements(tabListElements) {
  tabListElements.forEach((element) => {
    if (element.classList.contains("hidden")) {
      element.classList.remove("hidden");
    }
  });
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
      console.debug(`Discarding tab with tab id ${id}; title '${title}'`);

      browser.tabs.discard(id).then(
        function () {
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

document.addEventListener("DOMContentLoaded", function () {
  const tabList = document.getElementById("tab-list");
  const copyBtn = document.getElementById("copy-urls-btn");
  const tabCountHeader = document.getElementById("tab-count-header");

  const tabContentArr = Array();
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

      const tabListElement = document.createElement("li");

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

      const closeButton = document.createElement("button");
      closeButton.textContent = "X";
      closeButton.classList.add("close-button");
      closeButton.addEventListener("click", function () {
        onCloseTabClick(id, tabListElement);
      });

      tabListElement.appendChild(closeButton);

      // TODO change the button to the opposite buttons after the click event completes successfully
      if (!tab.discarded) {
        const discardBtn = createTabActionButton(title, id, "unload");
        tabListElement.appendChild(discardBtn);
      } else {
        const reloadBtn = createTabActionButton(title, id, "reload");
        tabListElement.appendChild(reloadBtn);
      }

      tabList.appendChild(tabListElement);
      tabListElements.push(tabListElement);
    });
  });

  const searchElement = document.getElementById("search");

  // certainly, this is far too slow
  searchElement.addEventListener("input", function (event) {
    const searchStr = event.target.value.toLowerCase();

    // restore all elements on each input change....
    clearElements(tabListElements);

    tabListElements.forEach((element) => {
      for (const childElement of element.children) {
        // TODO this search misses quite a few elements..
        if (
          childElement.classList.contains("tab-title") ||
          childElement.classList.contains("tab-url")
        ) {
          console.debug(childElement.innerText);

          if (!childElement.innerText.toLowerCase().includes(searchStr)) {
            element.classList.add("hidden");
          }
        }
      }
    });
  });

  copyBtn.addEventListener("click", function () {
    const clipboardContent = formatClipboardContent(tabContentArr);
    setClipboardContent(clipboardContent);
  });
});
