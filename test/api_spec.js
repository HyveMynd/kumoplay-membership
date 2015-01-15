/**
* Created by Andres Monroy (HyveMynd) on 9/19/14.
*/
var db = require('revision');
var Membership = require('../index.js');
var assert = require('assert');

describe("Main Api", function(){
    var memb = {};

    before(function (done) {
        memb = new Membership('membership');
        db.connect({db: 'membership'}, function (err, db) {
            assert.ok(err === null, err);
            db.users.destroyAll(function (err) {
                assert.ok(err === null, err);
                done();
            });
        });
    });

    describe("authentication", function(){
        var newUser = {};
        before(function (done) {
            memb.register("test@test.com", "password", "password", "asd", "dsa", function (err, result) {
                assert.ok(result.success, result.message);
                newUser = result.user;
                done();
            });
        });

        it("authenticates", function (done) {
            memb.authenticate('test@test.com', "password", function (err, result) {
                assert.ok(err === null, err);
                result.success.should.be.true;
                done();
            });
        });
        it("gets by token", function (done) {
            memb.findByUserToken(newUser.authenticationToken, function (err, result) {
                assert.ok(err === null, err);
                result.should.be.defined;
                done();
            });
        });

    });


});