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
      console.info(`Copied ${tabContentArr.length} URLs to clipboard.`);
    },
    function (err) {
      console.error(`Got error: ${err} attempting to copy URLs.`);
    }
  );
}

function createDiscardButton(title, id) {
  const discardBtn = document.createElement("button");
  discardBtn.classList.add("discard-btn");
  discardBtn.innerText = `Discard tab ${id}`;

  discardBtn.addEventListener("click", function () {
    console.debug(`Discarding tab with tab id ${id}; title '${title}'`);
    browser.tabs.discard(id);
  });

  console.debug(`Added tab with tab id ${id} title: '${title}'`);
  return discardBtn;
}

document.addEventListener("DOMContentLoaded", function () {
  const tabList = document.getElementById("tab-list");
  const copyBtn = document.getElementById("copy-urls");
  const tabCountHeader = document.getElementById("tab-count-header");

  const tabContentArr = Array();

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

      if (!tab.discarded) {
        const discardBtn = createDiscardButton(title, id);
        tabListElement.appendChild(discardBtn);
      } else {
        console.debug(
          `Tab with tab id: ${id} and title ${title} already discarded`
        );
      }

      tabList.appendChild(tabListElement);
    });
  });

  copyBtn.addEventListener("click", function () {
    const clipboardContent = formatClipboardContent(tabContentArr);
    setClipboardContent(clipboardContent);
  });
});
