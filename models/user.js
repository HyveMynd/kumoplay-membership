/**
 * Created by HyveMynd on 7/20/14.
 */

var assert = require('assert');
var hat = require('hat');

var User = function(args){
	assert.ok(args.email && args.firstName && args.lastName, "Email, first, and last name is required");
	var user = {};

    if (args.id){
        user.id = args.id;
    }
    user.firstName = args.firstName;
    user.lastName = args.lastName;
	user.email = args.email;
	user.createdAt = args.createdAt || new Date();
	user.status = args.status || "pending";
	user.signInCount = args.signInCount || 0;
	user.lastLoginAt = args.lastLoginAt || new Date();
	user.currentLoginAt = args.currentLoginAt || new Date();
	user.authenticationToken = args.authenticationToken || hat();
    user.hashedPassword = args.hashedPassword || null;

	return user;
};

module.exports = User;