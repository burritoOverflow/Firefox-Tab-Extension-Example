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
      const { title, url } = tab;
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

      tabList.appendChild(tabListElement);
    });
  });

  copyBtn.addEventListener("click", function () {
    const clipboardContent = formatClipboardContent(tabContentArr);
    setClipboardContent(clipboardContent);
  });
});
