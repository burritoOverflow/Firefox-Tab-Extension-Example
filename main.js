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

function createDiscardButton(title, id) {
  const discardBtn = document.createElement("button");
  discardBtn.classList.add("discard-btn");
  discardBtn.classList.add("tab-action-btn");
  discardBtn.innerText = `Discard tab ${id}`;

  discardBtn.addEventListener("click", function () {
    console.debug(`Discarding tab with tab id ${id}; title '${title}'`);

    browser.tabs.discard(id).then(
      function () {
        console.debug(`Discarded tab id: ${id} successfully`);
      },
      function (error) {
        console.error(
          `Error discarding tab with tab id: ${id} error: ${error}`
        );
      }
    );
  });

  console.debug(`Added tab with tab id ${id} title: '${title}'`);
  return discardBtn;
}

function createReloadButton(title, id) {
  const reloadBtn = document.createElement("button");
  reloadBtn.classList.add("restore-btn");
  reloadBtn.classList.add("tab-action-btn");
  reloadBtn.innerText = `Reload tab ${id}`;

  reloadBtn.addEventListener("click", function () {
    console.debug(`Reloading tab with tab id ${id}; title '${title}'`);

    browser.tabs.reload(id).then(
      function () {
        console.debug(`Reloaded tab id: ${id} successfully`);
      },
      function (error) {
        console.error(`Error reloaded tab with tab id: ${id} error: ${error}`);
      }
    );
  });

  console.debug(`Added tab with tab id ${id} title: '${title}'`);
  return reloadBtn;
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

      // TODO change the button to the opposite buttons after the click event completes successfully
      if (!tab.discarded) {
        const discardBtn = createDiscardButton(title, id);
        tabListElement.appendChild(discardBtn);
      } else {
        const reloadBtn = createReloadButton(title, id);
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
      if (!element.innerText.toLowerCase().includes(searchStr)) {
        element.classList.add("hidden");
        console.debug(`hiding element ${element}`);
      }
    });
  });

  copyBtn.addEventListener("click", function () {
    const clipboardContent = formatClipboardContent(tabContentArr);
    setClipboardContent(clipboardContent);
  });
});
