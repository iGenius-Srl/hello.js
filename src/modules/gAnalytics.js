(function(hello) {

    var contactsUrl = 'https://www.google.com/m8/feeds/contacts/default/full?v=3.0&alt=json&max-results=@{limit|1000}&start-index=@{start|1}';

    hello.init({
        gAnalytics: {

            name: 'Google Analytics',

            // See: http://code.google.com/apis/accounts/docs/OAuth2UserAgent.html
            oauth: {
                version: 2,
                auth: 'https://accounts.google.com/o/oauth2/auth',
                grant: 'https://accounts.google.com/o/oauth2/token'
            },

            // Authorization scopes
            scope: {
                basic: 'https://www.googleapis.com/auth/plus.me profile',
                email: 'email',
                birthday: '',
                events: '',
                photos: 'https://picasaweb.google.com/data/',
                videos: 'http://gdata.youtube.com',
                friends: 'https://www.google.com/m8/feeds, https://www.googleapis.com/auth/plus.login',
                files: 'https://www.googleapis.com/auth/drive.readonly',
                publish: '',
                publish_files: 'https://www.googleapis.com/auth/drive',
                create_event: '',
                offline_access: ''
            },

            scope_delim: ' ',

            login: function(p) {
                if (p.qs.display === 'none') {
                    // Google doesn't like display=none
                    p.qs.display = '';
                }

                if (p.qs.response_type === 'code') {

                    // Let's set this to an offline access to return a refresh_token
                    p.qs.access_type = 'offline';
                }

                // Reauthenticate
                // https://developers.google.com/identity/protocols/
                if (p.options.force) {
                    p.qs.approval_prompt = 'force';
                }
            },

            // API base URI
            base: 'https://www.googleapis.com/',

            // Map GET requests
            get: {
                me: 'plus/v1/people/me',
                list: 'analytics/v3/management/accountSummaries'
            },
            wrap: {
                list: function(res) {
                    if (res.error && res.error.code === 403) {
                        return {
                            error: {
                                status: 404,
                                message: 'you have no pages'
                            }
                        }
                    }

                    if (res.error) {
                        return res;
                    }

                    var data = [];
                    res.items.forEach(function(account) {
                        account.webProperties.forEach(function(property) {
                            property.profiles.forEach(function(profile) {
                                data.push({
                                    accountID: account.id,
                                    propertyID: property.id,
                                    id: profile.id,
                                    name: account.name + '-' + property.name + '-' + profile.name
                                });
                            });
                        });
                    });
                    return data;
                }
            }
        }
    });
})(hello);
