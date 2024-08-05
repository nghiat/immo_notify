document.getElementById('add').addEventListener('click', function() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    chrome.runtime.sendMessage({
        type: 'add',
        tab: tabs[0],
        data: {
        'interval': parseInt(document.getElementById('reloadInterval').value, 10) * 1000
        }
      }, (response) => {
      document.getElementById('tracked').style.visibility = 'visible';
      console.log('Response from background:');
    });
  });
});

document.getElementById('remove').addEventListener('click', function() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    chrome.runtime.sendMessage({type: 'remove', 'tab': tabs[0]}, (response) => {
      document.getElementById('tracked').style.visibility = 'hidden';
      console.log('Response from background:');
    });
  });
});


chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
  chrome.runtime.sendMessage({
      type: 'query',
      tab: tabs[0],
    }, (response) => {
      if (Object.keys(response).length === 0) {
        document.getElementById('tracked').style.visibility = 'hidden';
      } else {
        document.getElementById('tracked').style.visibility = 'visible';
      }

      if ('interval' in response) {
        document.getElementById('reloadInterval').value = response.interval / 1000;
      }
  });
});
