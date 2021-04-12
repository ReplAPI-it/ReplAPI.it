let headers = require('../utils/headers.js');
let constants = require('../utils/constants.js');

class User {
	constructor(username) {
		this.username = username;
	}

	async profileData() {
		let user = this.username;
		let info = await constants
			.fetch(constants.graphql, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					query: `
    			  query User($user: String!) {
    				  userByUsername(username: $user) {
                ${constants.userAttributes},
                roles { ${constants.roleAttributes} },
                subscription { ${constants.subscriptionAttributes} },
                organization { ${constants.organizationAttributes} },
                languages { ${constants.languageAttributes} }
    				  }
    				}`,
					variables: JSON.stringify({
						user: user
					})
				})
			})
			.then(res => res.json());

    if(info.errors) throw new Error(`Replit GraphQL Error(s): ${JSON.stringify(info.errors)}`)
    
		if (!info.data.userByUsername) {
			throw new Error(`${user} is not a user. Please query users on Replit.`);
		} else {
			return info.data.userByUsername;
		}
	}

	async postDataFull(after, count, order) {
		if (!after) after = '';
		if (!count) count = 50;
		if (!order) order = '';

		let user = this.username;
		let output = [];

	 	async function recurse(after) {
			if (after === null) return;

			let info = await variables
				.fetch(constants.graphql, {
					method: 'POST',
					headers,
					body: JSON.stringify({
						query: `
              query UserPost($user: String!, $after: String!, $count: Int!, $order: String!) {
                userByUsername(username: $user) {
                  posts(count: $count, after: $after, order: $order) {
                    items { 
                      ${constants.postAttributes},
                      user { ${constants.userAttributes} },
                      board { ${constants.boardAttributes} },
                      repl { ${constants.replAttributes} },
                      comments(count: ${global.initVariables.previewCount.comments || 10}) { ${constants.commentAttributes} },
                      votes { id, user { ${constants.userAttributes} } },
                      answeredBy { ${constants.userAttributes} },
                      answer { ${ constants.commentAttributes} }
                    }
                    pageInfo {
                      nextCursor
                    }
                  }
                }
              }`,
						variables: JSON.stringify({
							user: user,
							after: after,
							count: count,
							order: order
						})
					})
				})
				.then(res => res.json());

      if(info.errors) throw new Error(`Replit GraphQL Error(s): ${JSON.stringify(info.errors)}`)
      
			if (!info.data.userByUsername) {
				throw new Error(
					`${user} is not a user. Please query users on Replit.`
				);
			} else {
				info.data.userByUsername.posts.items.forEach(post => {
					output.push(post);
				});
				if (output.length != count) {
					await recurse(info.data.userByUsername.posts.pageInfo.nextCursor);
				}
			}
		}

		await recurse(after);
		return output;
	}

	async commentData(after, count, order) {
		if (!after) after = '';
		if (!count) count = 50;
		if (!order) order = '';

		let user = this.username;
		let output = [];

		async function recurse(after) {
			if (after === null) return;

			let info = await variables
				.fetch(variables.graphql, {
					method: 'POST',
					headers,
					body: JSON.stringify({
						query: `
            query UserComment($user: String!, $after: String!, $count: Int!, $order: String!) {
              userByUsername(username: $user) {
                comments(count: $count, after: $after, order: $order) {
                  items { 
                    ${constants.commentAttributes},
                    parentComment { ${constants.commentAttributes} },
                    comments(count: ${global.initVariables.previewCount.comments || 10}) { ${constants.commentAttributes} },
                    user { ${constants.userAttributes} },
                    post { 
                      ${constants.postAttributes},
                      user { ${constants.userAttributes} },
                      board { ${constants.boardAttributes} },
                      repl { ${constants.replAttributes} },
                      comments(count: ${global.initVariables.previewCount.comments || 10}) { ${constants.commentAttributes} },
                      votes { id, user { ${constants.userAttributes} } },
                      answeredBy { ${constants.userAttributes} },
                      answer { ${ constants.commentAttributes} }
                    }
                  }
                  pageInfo {
                    nextCursor
                  }
                }
              }
            }`,
						variables: JSON.stringify({
							user: user,
							after: after,
							count: count,
							order: order
						})
					})
				})
				.then(res => res.json());

      if(info.errors) throw new Error(`Replit GraphQL Error(s): ${JSON.stringify(info.errors)}`)
			
			if (!info.data.userByUsername) {
				throw new Error(
					`${user} is not a user. Please query users on Replit.`
				);
			} else {
				info.data.userByUsername.comments.items.forEach(comment => {
					output.push(comment);
				});
				if (output.length != count) {
					await recurse(info.data.userByUsername.comments.pageInfo.nextCursor);
				}
			}
		}

		await recurse(after);
		return output;
	}
}

module.exports = {
	User: User
};
