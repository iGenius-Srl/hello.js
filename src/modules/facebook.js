(function(hello) {
	var version = "2.10";
	hello.init({
		facebook: {
			name: "Facebook",

			// SEE https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/v2.1
			oauth: {
				version: 2,
				auth: "https://www.facebook.com/dialog/oauth/",
				grant: "https://graph.facebook.com/oauth/access_token"
			},

			// Authorization scopes
			scope: {
				basic: "public_profile",
				email: "email",
				share: "user_posts",
				birthday: "user_birthday",
				events: "user_events",
				photos: "user_photos",
				videos: "user_videos",
				friends: "user_friends",
				files: "user_photos,user_videos",
				publish_files: "user_photos,user_videos,publish_actions",
				publish: "publish_actions",

				// Deprecated in v2.0
				// Create_event : 'create_event',

				offline_access: ""
			},

			// Refresh the access_token
			refresh: true,

			login: function(p) {
				// Reauthenticate
				// https://developers.facebook.com/docs/facebook-login/reauthentication
				if (p.options.force) {
					p.qs.auth_type = "reauthenticate";
				}

				p.qs.display = p.options.display || "popup";
			},

			logout: function(callback, options) {
				// Assign callback to a global handler
				var callbackID = hello.utils.globalEvent(callback);
				var redirect = encodeURIComponent(
					hello.settings.redirect_uri +
						"?" +
						hello.utils.param({
							callback: callbackID,
							result: JSON.stringify({ force: true }),
							state: "{}"
						})
				);
				var token = (options.authResponse || {}).access_token;
				hello.utils.iframe(
					"https://www.facebook.com/logout.php?next=" +
						redirect +
						"&access_token=" +
						token
				);

				// Possible responses:
				// String URL   - hello.logout should handle the logout
				// Undefined    - this function will handle the callback
				// True - throw a success, this callback isn't handling the callback
				// False - throw a error
				if (!token) {
					// If there isn't a token, the above wont return a response, so lets trigger a response
					return false;
				}
			},

			// API Base URL
			base: "https://graph.facebook.com/v" + version + "/",

			// Map GET requests
			get: {
				me: "me?fields=email,first_name,last_name,name,timezone,verified",
				"me/friends": "me/friends",
				"me/following": "me/friends",
				"me/followers": "me/friends",
				"me/share": "me/feed",
				"me/like": "me/likes",
				"me/files": "me/albums",
				"me/albums": "me/albums?fields=cover_photo,name",
				"me/album": "@{id}/photos?fields=picture",
				"me/photos": "me/photos",
				"me/photo": "@{id}",
				"friend/albums": "@{id}/albums",
				"friend/photos": "@{id}/photos",
				list: "me/accounts?fields=id,name,username,picture{url}&limit=400",
				listCampaigns: "me/adaccounts?fields=name,currency&limit=400"
				// Pagination
				// Https://developers.facebook.com/docs/reference/api/pagination/
			},

			// Map POST requests
			post: {
				"me/share": "me/feed",
				"me/photo": "@{id}"

				// Https://developers.facebook.com/docs/graph-api/reference/v2.2/object/likes/
			},

			wrap: {
				me: formatUser,
				"me/friends": formatFriends,
				"me/following": formatFriends,
				"me/followers": formatFriends,
				"me/albums": format,
				"me/photos": format,
				"me/files": format,
				default: format,
				list: function(res) {
					return formatListData(res, { status: 404, message: "You have no pages." });
				},
				listCampaigns: function(res) {
					return formatListData(res, {
						status: 404,
						message: "You have no ads account."
					});
				}
			},
			// Special requirements for handling XHR
			xhr: function(p, qs) {
				if (p.method === "get" || p.method === "post") {
					qs.suppress_response_codes = true;
				}

				// Is this a post with a data-uri?
				if (p.method === "post" && p.data && typeof p.data.file === "string") {
					// Convert the Data-URI to a Blob
					p.data.file = hello.utils.toBlob(p.data.file);
				}

				return true;
			},

			// Special requirements for handling JSONP fallback
			jsonp: function(p, qs) {
				var m = p.method;
				if (m !== "get" && !hello.utils.hasBinary(p.data)) {
					p.data.method = m;
					p.method = "get";
				} else if (p.method === "delete") {
					qs.method = "delete";
					p.method = "post";
				}
			},

			// Special requirements for iframe form hack
			form: function(p) {
				return {
					// Fire the callback onload
					callbackonload: true
				};
			}
		}
	});

	var base = "https://graph.facebook.com/";

	function formatUser(o) {
		if (o.id) {
			o.thumbnail = o.picture = "https://graph.facebook.com/" + o.id + "/picture";
		}

		return o;
	}

	function formatFriends(o) {
		if ("data" in o) {
			o.data.forEach(formatUser);
		}

		return o;
	}

	function format(o, headers, req) {
		if (typeof o === "boolean") {
			o = { success: o };
		}

		if (o && "data" in o) {
			var token = req.query.access_token;

			if (!(o.data instanceof Array)) {
				var data = o.data;
				delete o.data;
				o.data = [data];
			}

			o.data.forEach(function(d) {
				if (d.picture) {
					d.thumbnail = d.picture;
				}

				d.pictures = (d.images || []).sort(function(a, b) {
					return a.width - b.width;
				});

				if (d.cover_photo && d.cover_photo.id) {
					d.thumbnail = base + d.cover_photo.id + "/picture?access_token=" + token;
				}

				if (d.type === "album") {
					d.files = d.photos = base + d.id + "/photos";
				}

				if (d.can_upload) {
					d.upload_location = base + d.id + "/photos";
				}
			});
		}

		return o;
	}

	//Format result of list and listCampaigns methods
	function formatListData(res, error) {
		if (res.error) {
			return res;
		}

		if (!res.data.length) {
			return {
				error: error
			};
		}

		return res.data.map(function(d) {
			return {
				id: d.id,
				name: d.name,
				username: d.username,
				currency: d.currency,
				image: d.picture && d.picture.data && d.picture.data.url ? d.picture.data.url : null
			};
		});
	}
})(hello);
