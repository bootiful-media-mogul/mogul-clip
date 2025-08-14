const APP_URL = 'https://studio.media-mogul.io'

// const APP_URL = 'http://127.0.0.1:1010'

console.log('Available APIs:', {
    scripting: !!chrome.scripting,
    tabs: !!chrome.tabs,
    cookies: !!chrome.cookies,
    storage: !!chrome.storage
})


/**
 * either loads saved authentication or opens a new tab and authenticates.
 */
async function attemptAuthentication() {

    async function authenticateForUri(uri) {
        let authTab
        const tabs = await chrome.tabs.query({url: uri + '/*'});
        if (tabs.length > 0) {
            authTab = tabs[0];
        } //
        else {
            authTab = await chrome.tabs.create({
                url: uri
            });
        }
        const cookie = await chrome.cookies.get({url: uri, name: 'SESSION'})
        const cookieValue = cookie?.value
        return {
            uri,
            cookieValue,
            authTab
        }
    }

    const authenticatedUserInStorage = await chrome.storage.local.get(
        ['url', 'cookie', 'name']
    );

    if (authenticatedUserInStorage == null || authenticatedUserInStorage.cookie == null) {
        const auth = await authenticateForUri(APP_URL)
        const u = await user(auth)
        await chrome.storage.local.set({
            url: APP_URL,
            cookie: auth.cookieValue,
            name: u.name
        });
    }
    return (await chrome.storage.local.get(['url', 'cookie', 'name']));
}

async function user(auth) {
    const {uri, cookieValue, authTab} = auth
    const response = await fetch(uri + '/api/me', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    return (await response.json())
}

window.addEventListener('load', async () => {
    const user = await attemptAuthentication()
    const tab = await activeTab();
    document.getElementsByClassName('user')[0].innerText = user.name
    document.getElementsByClassName('clip-uri')[0].innerText = tab.url
    document.getElementsByClassName('clip-cookie')[0].innerText = user.cookie
    console.log(tab)

})


async function graphql(uri, cookie, query) {
    try {
        const response = await fetch(uri + '/api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Mogul-Session-ID': cookie
            },
            body: JSON.stringify({query})
        });

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            return null;
        }

        return (await data.data)
    } catch (error) {
        console.error('Network error:', error);
        return null;
    }
}

async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}
