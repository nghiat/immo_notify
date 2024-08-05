function parse_wg_gesucht() {
  const listings = document.getElementsByClassName('offer_list_item')
  var ids = [];
  for (const listing of listings) {
    ids.push(listing.getAttribute('data-id'));
  }
  chrome.runtime.sendMessage({type: 'ids', ids: ids, website: 'wg_gesucht'}, (response) => {
    console.log('Response from background');
  });
}

function parse_kleinanzeigen() {
  let badge = document.getElementsByClassName('Badge-urgency');
  if (badge.length > 0) {
    console.log('Badge');
    Notification.requestPermission().then(function (permission) {
      var notification = new Notification('new Kleinanzeigen', {
        icon: 'https://www.kleinanzeigen.de/favicon.svg',
        silent: true
      });
    });
    return;
  }

  const listings = document.getElementsByClassName('ad-listitem')
  var ids = [];
  for (const listing of listings) {
    if (listing.classList.contains('is-topad')) {
      console.log("skip top");
      continue;
    }
    let ellipsis = listing.getElementsByClassName('ellipsis');
    if (ellipsis.length > 0) {
      let ellipsisText = ellipsis[0].text.toLowerCase();
      if (ellipsisText.includes('tausch') || ellipsisText.includes('zwischen')) {
        console.log("skip tausch/zwischen");
        continue;
      }
    }
    const adItem = listing.getElementsByClassName('aditem');
    if (adItem.length > 0) {
      ids.push(adItem[0].getAttribute('data-adid'));
    }
  }
  chrome.runtime.sendMessage({type: 'ids', ids: ids, website: 'kleinanzeigen'}, (response) => {
    console.log('Response from background');
  });
}

function parse_immoscout() {
  const listings = document.getElementsByClassName('result-list__listing')
  var ids = [];
  for (const listing of listings) {
    ids.push(listing.getAttribute('data-id'));
  }
  chrome.runtime.sendMessage({type: 'ids', ids: ids, website: 'immoscout24'}, (response) => {
    console.log('Response from background');
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'parse') {
    const url = new URL(document.URL);
    if (url.host === 'www.kleinanzeigen.de') {
      parse_kleinanzeigen();
    } else if (url.host === 'www.immobilienscout24.de') {
      parse_immoscout();
    } else if (url.host === 'www.wg-gesucht.de') {
      parse_wg_gesucht();
    }
  }
  sendResponse({status: 'received'});
});

function check_captcha() {
  const url = new URL(document.URL);
  if (url.host === 'www.wg-gesucht.de' && document.title == 'Überprüfung') {
    var notification = new Notification('Captcha', {
      icon: 'https://www.wg-gesucht.de/assets/favicon/favicon_wg_gesucht.ico',
      silent: true
    });
  }
}

check_captcha();
