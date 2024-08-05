function parse_ids(ids, website) {
  chrome.storage.local.get([website], function(result) {
    let idsSet = new Set(ids);
    let savedIds = Array.isArray(result[website]) ? new Set(result[website]) : new Set();
    let checkLength = 5;
    checkLength = Math.min(checkLength, ids.length);
    const shouldShowNotification = ids.slice(0, checkLength).some(id => !savedIds.has(id)); // Only check if the first few ads are new, as ads from the previous page might reappear when some ads are deleted.
    let mergedIds = new Set([...idsSet, ...savedIds]);
    chrome.storage.local.set({[website]: Array.from(mergedIds)}, function() {
      console.log(website);
      if (shouldShowNotification) {
        chrome.notifications.create({title: "New Wohnung", message: website, iconUrl: website + ".ico", type: "basic"})
      }
    });
  });
}

function query(sendResponse, tab) {
  chrome.storage.local.get({savedUrls: {}}, (result) => {
    if (tab.url in result.savedUrls) {
      sendResponse(result.savedUrls[tab.url]);
    } else {
      sendResponse({});
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'add') {
    chrome.storage.local.get({savedUrls: {}}, function(result) {
      let savedUrls = result.savedUrls;
      savedUrls[message.tab.url] = message.data;
      chrome.storage.local.set({savedUrls: savedUrls}, function() {
        updateIcon(message.tab);
      });
    });
  } else if (message.type === 'remove') {
    chrome.storage.local.get({savedUrls: {}}, function(result) {
      let savedUrls = result.savedUrls;
      delete savedUrls[message.tab.url];
      chrome.storage.local.set({savedUrls: savedUrls}, function() {
        updateIcon(message.tab);
      });
    });
  } else if (message.type === 'ids') {
    parse_ids(message.ids, message.website);
  } else if (message.type === 'query') {
    query(sendResponse, message.tab);
    return true;
  }
  sendResponse({status: 'received'});
});

let pendingTimeouts = {};

function checkTab(tab) {
  chrome.storage.local.get({savedUrls: {}}, (result) => {
    if (tab.url in result.savedUrls) {
      if (tab.url in pendingTimeouts) {
        clearTimeout(pendingTimeouts[tab.url]);
        delete pendingTimeouts[tab.url];
      }
      chrome.tabs.sendMessage(tab.id, {type: 'parse'}, {}, (response) => {
        console.log('Response from content');
        const timeoutId = setTimeout(() => {
          chrome.tabs.reload(tab.id, {bypassCache: true}, () => {
            console.log("reloaded: " + tab.url);
          });
        }, result.savedUrls[tab.url].interval);
        pendingTimeouts[tab.url] = timeoutId;
      });
    }
  });
}

function updateIcon(tab) {
  chrome.storage.local.get({savedUrls: {}}, (result) => {
    if (tab.url in result.savedUrls) {
      chrome.action.setIcon({ path: 'active.png', tabId: tab.id });
    } else {
      chrome.action.setIcon({ path: 'inactive.png', tabId: tab.id });
    }
  });
}
function start() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      checkTab(tab);
    }
  });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') {
      return;
    }
    checkTab(tab);
    if (tab.active) {
      updateIcon(tab);
    }
  });
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      updateIcon(tab);
    });
  });
}

chrome.runtime.onStartup.addListener(() => {
  start();
});

chrome.runtime.onInstalled.addListener(() => {
  start();
});
